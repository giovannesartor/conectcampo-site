import { Injectable, Logger } from '@nestjs/common';

export interface NdviTimePoint {
  date: Date;
  ndviMean: number;
  ndviMin: number;
  ndviMax: number;
  cloudCover: number | null;
}

export interface PlanetScene {
  acquired: Date;
  cloudCover: number | null; // 0..1
}

/**
 * Cliente de satélite para NDVI. Suporta duas fontes da Planet Insights Platform:
 *
 * 1) Sentinel Hub Statistical API (services.sentinel-hub.com) — retorna valores de
 *    NDVI medidos (média/min/máx) por intervalo. Requer OAuth2 client credentials:
 *      - SENTINELHUB_CLIENT_ID
 *      - SENTINELHUB_CLIENT_SECRET
 *      - SENTINELHUB_BASE_URL (opcional)
 *
 * 2) Planet Data API (api.planet.com) — retorna cenas PlanetScope reais que
 *    intersectam a geometria (datas de captura + % de nuvem). Usa a API key:
 *      - PLANET_API_KEY (PLAK...)
 *    Obs.: a Planet API key NÃO funciona em services.sentinel-hub.com (por design).
 *
 * Docs: https://docs.planet.com/develop/apis/statistical/
 *       https://docs.planet.com/develop/apis/data/
 */
@Injectable()
export class SatelliteService {
  private readonly logger = new Logger(SatelliteService.name);
  private token: { value: string; expiresAt: number } | null = null;

  private get baseUrl(): string {
    return process.env.SENTINELHUB_BASE_URL || 'https://services.sentinel-hub.com';
  }

  private get planetBaseUrl(): string {
    return process.env.PLANET_BASE_URL || 'https://api.planet.com';
  }

  /** Sentinel Hub (Statistical API) configurado — NDVI medido. */
  isSentinelHubConfigured(): boolean {
    return Boolean(
      process.env.SENTINELHUB_CLIENT_ID && process.env.SENTINELHUB_CLIENT_SECRET,
    );
  }

  /** Planet Data API configurada — cobertura real de cenas. */
  isPlanetConfigured(): boolean {
    return Boolean(process.env.PLANET_API_KEY);
  }

  /** Alguma fonte real de satélite disponível. */
  isConfigured(): boolean {
    return this.isSentinelHubConfigured() || this.isPlanetConfigured();
  }

  private async getToken(): Promise<string> {
    if (this.token && this.token.expiresAt > Date.now() + 30_000) {
      return this.token.value;
    }

    const body = new URLSearchParams({
      grant_type: 'client_credentials',
      client_id: process.env.SENTINELHUB_CLIENT_ID as string,
      client_secret: process.env.SENTINELHUB_CLIENT_SECRET as string,
    });

    const res = await fetch(
      `${this.baseUrl}/auth/realms/main/protocol/openid-connect/token`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body,
        signal: AbortSignal.timeout(10_000),
      },
    );

    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Falha ao autenticar no Sentinel Hub (${res.status}): ${text}`);
    }

    const json = (await res.json()) as { access_token: string; expires_in: number };
    this.token = {
      value: json.access_token,
      expiresAt: Date.now() + json.expires_in * 1000,
    };
    return this.token.value;
  }

  /** Extrai uma geometria GeoJSON (Polygon/MultiPolygon) de Feature/FeatureCollection/Geometry. */
  private normalizeGeometry(geometry: unknown): Record<string, unknown> | null {
    if (!geometry || typeof geometry !== 'object') return null;
    const g = geometry as Record<string, any>;
    if (g.type === 'FeatureCollection' && Array.isArray(g.features) && g.features[0]) {
      return g.features[0].geometry ?? null;
    }
    if (g.type === 'Feature') return g.geometry ?? null;
    if (g.type === 'Polygon' || g.type === 'MultiPolygon') return g;
    return null;
  }

  private evalscript(): string {
    return `//VERSION=3
function setup() {
  return {
    input: [{ bands: ["B04", "B08", "SCL", "dataMask"] }],
    output: [
      { id: "ndvi", bands: 1, sampleType: "FLOAT32" },
      { id: "dataMask", bands: 1 }
    ]
  };
}
function evaluatePixel(s) {
  let ndvi = (s.B08 - s.B04) / (s.B08 + s.B04);
  let valid = 1;
  if (!isFinite(ndvi)) valid = 0;
  // Exclui sombra de nuvem (3), água (6), nuvens (8,9), cirrus (10) e neve (11)
  if (s.SCL == 3 || s.SCL == 6 || s.SCL == 8 || s.SCL == 9 || s.SCL == 10 || s.SCL == 11) valid = 0;
  return { ndvi: [ndvi], dataMask: [s.dataMask * valid] };
}`;
  }

  /**
   * Busca a série temporal de NDVI para uma geometria (GeoJSON em lon/lat, EPSG:4326).
   * Retorna null se a integração não estiver configurada ou a geometria for inválida.
   */
  async fetchNdviTimeSeries(
    geometry: unknown,
    from: Date,
    to: Date,
  ): Promise<NdviTimePoint[] | null> {
    if (!this.isSentinelHubConfigured()) return null;
    const geom = this.normalizeGeometry(geometry);
    if (!geom) return null;

    const token = await this.getToken();

    const requestBody = {
      input: {
        bounds: { geometry: geom },
        data: [
          {
            type: 'sentinel-2-l2a',
            dataFilter: { mosaickingOrder: 'leastCC' },
          },
        ],
      },
      aggregation: {
        timeRange: { from: from.toISOString(), to: to.toISOString() },
        aggregationInterval: { of: 'P10D' },
        evalscript: this.evalscript(),
        resx: 0.0001, // ~10m em graus
        resy: 0.0001,
      },
      calculations: { default: {} },
    };

    const res = await fetch(`${this.baseUrl}/statistics/v1`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify(requestBody),
      signal: AbortSignal.timeout(15_000),
    });

    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Statistical API retornou ${res.status}: ${text}`);
    }

    const json = (await res.json()) as {
      status: string;
      data: Array<{
        interval: { from: string; to: string };
        outputs?: { ndvi?: { bands?: { B0?: { stats?: { mean: number | string; min: number | string; max: number | string } } } } };
      }>;
    };

    const points: NdviTimePoint[] = [];
    for (const item of json.data ?? []) {
      const stats = item.outputs?.ndvi?.bands?.B0?.stats;
      if (!stats) continue;
      const mean = Number(stats.mean);
      if (!Number.isFinite(mean)) continue; // intervalo sem imagem válida (nuvens)
      points.push({
        date: new Date(item.interval.from),
        ndviMean: Number(mean.toFixed(3)),
        ndviMin: Number(Number(stats.min).toFixed(3)),
        ndviMax: Number(Number(stats.max).toFixed(3)),
        cloudCover: null,
      });
    }

    return points;
  }

  /**
   * Busca cenas PlanetScope reais (Planet Data API) que intersectam a geometria,
   * retornando data de captura e cobertura de nuvem. Usa a Planet API key (PLAK...).
   * Retorna null se a key não estiver configurada ou a geometria for inválida.
   */
  async fetchPlanetScenes(
    geometry: unknown,
    from: Date,
    to: Date,
  ): Promise<PlanetScene[] | null> {
    if (!this.isPlanetConfigured()) return null;
    const geom = this.normalizeGeometry(geometry);
    if (!geom) return null;

    const apiKey = process.env.PLANET_API_KEY as string;
    // Basic auth: API key como username, senha vazia.
    const authHeader = `Basic ${Buffer.from(`${apiKey}:`).toString('base64')}`;

    const requestBody = {
      item_types: ['PSScene'],
      filter: {
        type: 'AndFilter',
        config: [
          { type: 'GeometryFilter', field_name: 'geometry', config: geom },
          {
            type: 'DateRangeFilter',
            field_name: 'acquired',
            config: { gte: from.toISOString(), lte: to.toISOString() },
          },
          {
            type: 'RangeFilter',
            field_name: 'cloud_cover',
            config: { lte: 0.8 },
          },
        ],
      },
    };

    const res = await fetch(`${this.planetBaseUrl}/data/v1/quick-search`, {
      method: 'POST',
      headers: {
        Authorization: authHeader,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
      signal: AbortSignal.timeout(15_000),
    });

    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Planet Data API retornou ${res.status}: ${text}`);
    }

    const json = (await res.json()) as {
      features?: Array<{ properties?: { acquired?: string; cloud_cover?: number } }>;
    };

    const scenes: PlanetScene[] = (json.features ?? [])
      .filter((f) => f.properties?.acquired)
      .map((f) => ({
        acquired: new Date(f.properties!.acquired as string),
        cloudCover: f.properties?.cloud_cover ?? null,
      }))
      .sort((a, b) => a.acquired.getTime() - b.acquired.getTime());

    return scenes;
  }
}
