import { Injectable, Logger } from '@nestjs/common';
import { fetchJson } from '../../common/http/fetch-json';

export interface DayForecast {
  date: string;
  tempMin: number;
  tempMax: number;
  rainMm: number;
  humidity: number;
  condition: 'ENSOLARADO' | 'PARCIAL' | 'NUBLADO' | 'CHUVA' | 'TEMPESTADE';
}

export interface WeatherAlert {
  type: 'GEADA' | 'SECA' | 'CHUVA_FORTE' | 'GRANIZO' | 'ONDA_CALOR';
  severity: 'BAIXA' | 'MEDIA' | 'ALTA';
  title: string;
  description: string;
}

// Faixas climáticas aproximadas por estado (usadas apenas no fallback simulado)
const STATE_CLIMATE: Record<string, { baseTemp: number; baseRain: number }> = {
  MT: { baseTemp: 26, baseRain: 6 }, MS: { baseTemp: 25, baseRain: 5 },
  GO: { baseTemp: 24, baseRain: 5 }, MG: { baseTemp: 22, baseRain: 4 },
  SP: { baseTemp: 22, baseRain: 4 }, PR: { baseTemp: 20, baseRain: 5 },
  RS: { baseTemp: 19, baseRain: 5 }, SC: { baseTemp: 19, baseRain: 5 },
  BA: { baseTemp: 26, baseRain: 3 }, TO: { baseTemp: 27, baseRain: 5 },
  MA: { baseTemp: 28, baseRain: 4 }, PI: { baseTemp: 28, baseRain: 3 },
};

// Coordenadas das capitais por estado (fallback quando não há cidade informada)
const STATE_COORDS: Record<string, { lat: number; lon: number }> = {
  AC: { lat: -9.97, lon: -67.81 }, AL: { lat: -9.65, lon: -35.73 }, AP: { lat: 0.03, lon: -51.07 },
  AM: { lat: -3.12, lon: -60.02 }, BA: { lat: -12.97, lon: -38.51 }, CE: { lat: -3.73, lon: -38.53 },
  DF: { lat: -15.79, lon: -47.88 }, ES: { lat: -20.32, lon: -40.34 }, GO: { lat: -16.69, lon: -49.26 },
  MA: { lat: -2.53, lon: -44.30 }, MT: { lat: -15.60, lon: -56.10 }, MS: { lat: -20.44, lon: -54.65 },
  MG: { lat: -19.92, lon: -43.94 }, PA: { lat: -1.46, lon: -48.50 }, PB: { lat: -7.12, lon: -34.86 },
  PR: { lat: -25.43, lon: -49.27 }, PE: { lat: -8.05, lon: -34.90 }, PI: { lat: -5.09, lon: -42.80 },
  RJ: { lat: -22.91, lon: -43.20 }, RN: { lat: -5.79, lon: -35.21 }, RS: { lat: -30.03, lon: -51.23 },
  RO: { lat: -8.76, lon: -63.90 }, RR: { lat: 2.82, lon: -60.67 }, SC: { lat: -27.59, lon: -48.55 },
  SP: { lat: -23.55, lon: -46.63 }, SE: { lat: -10.95, lon: -37.07 }, TO: { lat: -10.18, lon: -48.33 },
};

@Injectable()
export class WeatherService {
  private readonly logger = new Logger(WeatherService.name);

  // ─── Fonte real: Open-Meteo (gratuita, sem API key) ───────────────────────────

  /** Converte código WMO (Open-Meteo) para condição interna. */
  private conditionFromWmo(code: number): DayForecast['condition'] {
    if (code === 0 || code === 1) return 'ENSOLARADO';
    if (code === 2) return 'PARCIAL';
    if (code === 3 || code === 45 || code === 48) return 'NUBLADO';
    if (code >= 95) return 'TEMPESTADE';
    if (code >= 51 && code <= 82) return 'CHUVA';
    return 'PARCIAL';
  }

  private async resolveCoords(state: string, city?: string): Promise<{ lat: number; lon: number }> {
    if (city?.trim()) {
      try {
        const url = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=1&country=BR&language=pt`;
        const json = await fetchJson<{ results?: Array<{ latitude: number; longitude: number }> }>(url, {
          timeoutMs: 6000,
          retries: 2,
        });
        const match = json.results?.[0];
        if (match) return { lat: match.latitude, lon: match.longitude };
      } catch {
        /* cai para a capital do estado */
      }
    }
    return STATE_COORDS[state] ?? STATE_COORDS.SP;
  }

  async getForecast(state = 'SP', city = '') {
    const coords = await this.resolveCoords(state, city);
    try {
      const url =
        `https://api.open-meteo.com/v1/forecast?latitude=${coords.lat}&longitude=${coords.lon}` +
        `&daily=temperature_2m_max,temperature_2m_min,precipitation_sum,relative_humidity_2m_mean,weather_code` +
        `&current=temperature_2m,relative_humidity_2m,weather_code&timezone=auto&forecast_days=7`;
      const json = await fetchJson<any>(url, { timeoutMs: 7000, retries: 2 });
      {
        const d = json.daily;
        const days: DayForecast[] = (d?.time ?? []).map((date: string, i: number) => ({
          date,
          tempMin: Math.round(d.temperature_2m_min[i]),
          tempMax: Math.round(d.temperature_2m_max[i]),
          rainMm: Number((d.precipitation_sum[i] ?? 0).toFixed(1)),
          humidity: Math.round(d.relative_humidity_2m_mean?.[i] ?? json.current?.relative_humidity_2m ?? 60),
          condition: this.conditionFromWmo(d.weather_code[i]),
        }));
        if (days.length) {
          const current = {
            temp: Math.round(json.current?.temperature_2m ?? (days[0].tempMin + days[0].tempMax) / 2),
            humidity: Math.round(json.current?.relative_humidity_2m ?? days[0].humidity),
            condition: this.conditionFromWmo(json.current?.weather_code ?? d.weather_code[0]),
          };
          return {
            state,
            city,
            current,
            forecast: days,
            alerts: this.buildAlerts(days, state),
            source: 'Open-Meteo (tempo real)',
          };
        }
      }
    } catch (err) {
      this.logger.warn(`Open-Meteo indisponível, usando fallback: ${(err as Error).message}`);
    }
    return this.buildSimulatedForecast(state, city);
  }

  // ─── Fallback simulado (determinístico) ───────────────────────────────────────

  private seedFrom(str: string): () => number {
    let seed = 0;
    for (const ch of str) seed = (seed * 31 + ch.charCodeAt(0)) % 100000;
    return () => {
      seed = (seed * 1103515245 + 12345) & 0x7fffffff;
      return (seed % 1000) / 1000;
    };
  }

  private conditionFromRain(rain: number): DayForecast['condition'] {
    if (rain > 25) return 'TEMPESTADE';
    if (rain > 8) return 'CHUVA';
    if (rain > 2) return 'NUBLADO';
    if (rain > 0.5) return 'PARCIAL';
    return 'ENSOLARADO';
  }

  private buildSimulatedForecast(state: string, city: string) {
    const climate = STATE_CLIMATE[state] ?? { baseTemp: 24, baseRain: 4 };
    const rand = this.seedFrom(`${state}${city}${new Date().toISOString().slice(0, 10)}`);
    const month = new Date().getMonth();
    const rainSeason = month >= 9 || month <= 2 ? 1.6 : 0.5;

    const days: DayForecast[] = [];
    for (let i = 0; i < 7; i++) {
      const tVar = (rand() - 0.5) * 6;
      const tempMax = Math.round(climate.baseTemp + 4 + tVar);
      const tempMin = Math.round(climate.baseTemp - 4 + tVar * 0.5);
      const rainMm = Number((climate.baseRain * rainSeason * rand() * 2).toFixed(1));
      const humidity = Math.round(55 + rand() * 40);
      const date = new Date(Date.now() + i * 86400000).toISOString().slice(0, 10);
      days.push({ date, tempMin, tempMax, rainMm, humidity, condition: this.conditionFromRain(rainMm) });
    }
    const current = {
      temp: Math.round((days[0].tempMin + days[0].tempMax) / 2),
      humidity: days[0].humidity,
      condition: days[0].condition,
    };
    return {
      state,
      city,
      current,
      forecast: days,
      alerts: this.buildAlerts(days, state),
      source: 'Simulado (Open-Meteo indisponível)',
    };
  }

  private buildAlerts(days: DayForecast[], state: string): WeatherAlert[] {
    const alerts: WeatherAlert[] = [];
    const minTemp = Math.min(...days.map((d) => d.tempMin));
    const totalRain = days.reduce((s, d) => s + d.rainMm, 0);
    const maxTemp = Math.max(...days.map((d) => d.tempMax));

    const southern = ['RS', 'SC', 'PR', 'SP', 'MG'].includes(state);
    if (minTemp <= 5 && southern) {
      alerts.push({
        type: 'GEADA',
        severity: minTemp <= 2 ? 'ALTA' : 'MEDIA',
        title: 'Risco de geada',
        description: `Temperatura mínima prevista de ${minTemp}°C nos próximos dias. Proteja lavouras sensíveis.`,
      });
    }
    if (totalRain < 5) {
      alerts.push({
        type: 'SECA',
        severity: totalRain < 2 ? 'ALTA' : 'MEDIA',
        title: 'Baixa precipitação',
        description: `Apenas ${totalRain.toFixed(1)}mm previstos na semana. Avalie irrigação e manejo hídrico.`,
      });
    }
    if (totalRain > 80) {
      alerts.push({
        type: 'CHUVA_FORTE',
        severity: 'ALTA',
        title: 'Excesso de chuva',
        description: `Acumulado de ${totalRain.toFixed(0)}mm previsto. Atenção a operações de campo e colheita.`,
      });
    }
    if (maxTemp >= 38) {
      alerts.push({
        type: 'ONDA_CALOR',
        severity: 'MEDIA',
        title: 'Onda de calor',
        description: `Máximas de até ${maxTemp}°C. Estresse térmico para lavouras e animais.`,
      });
    }
    return alerts;
  }

  getPlantingWindow(crop = 'SOJA', state = 'SP') {
    const WINDOWS: Record<string, { start: string; end: string; note: string }> = {
      SOJA: { start: 'Set', end: 'Dez', note: 'Ideal após início das chuvas; respeitar vazio sanitário.' },
      MILHO: { start: 'Set', end: 'Fev', note: 'Milho safrinha entre jan–fev após soja precoce.' },
      ALGODAO: { start: 'Nov', end: 'Jan', note: 'Plantio no início do período chuvoso.' },
      FEIJAO: { start: 'Out', end: 'Fev', note: 'Três safras possíveis conforme região.' },
      TRIGO: { start: 'Abr', end: 'Jun', note: 'Cultura de inverno no Sul.' },
      CAFE: { start: 'Out', end: 'Mar', note: 'Plantio de mudas no período chuvoso.' },
      ARROZ: { start: 'Set', end: 'Dez', note: 'Arroz irrigado no Sul; sequeiro no Centro-Oeste.' },
      CANA: { start: 'Jan', end: 'Mar', note: 'Cana de ano-e-meio; ou set–nov para cana de ano.' },
    };
    const window = WINDOWS[crop] ?? { start: '—', end: '—', note: 'Consulte zoneamento agrícola (ZARC) do MAPA.' };
    const monthIdx = new Date().getMonth();
    const monthsPt = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
    return { crop, state, window, currentMonth: monthsPt[monthIdx] };
  }
}
