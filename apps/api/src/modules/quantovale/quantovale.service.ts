import {
  Injectable,
  Logger,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service';

// ──────────────────────────────────────────────────────────────────────────────
// Interfaces
// ──────────────────────────────────────────────────────────────────────────────

const QV_API_VERSION = '2024-01-15';

interface QuantovaleTokenResponse {
  access_token: string;
  refresh_token?: string;
  expires_in?: number;
  token_type: string;
  scopes?: string[];
}

export interface QuantovaleValuation {
  id: string;
  company_name?: string;
  status?: string;
  plan?: string;
  valuation_result?: number;
  equity_value?: number;
  payment_url?: string;
  created_at?: string;
  [key: string]: unknown;
}

export interface QuantovaleReport {
  equity_value?: number;
  risk_score?: number;
  report_pdf_url?: string;
  [key: string]: unknown;
}

export interface CreateValuationInput {
  company_name: string;
  plan: string;
  annual_revenue?: number;
  annual_costs?: number;
  annual_expenses?: number;
  sector?: string;
}

// ──────────────────────────────────────────────────────────────────────────────

@Injectable()
export class QuantovaleService {
  private readonly logger = new Logger(QuantovaleService.name);

  private readonly clientId: string;
  private readonly clientSecret: string;
  private readonly redirectUri: string;
  private readonly authorizeUrl: string;
  private readonly tokenUrl: string;  // e.g. https://quantovale.online/oauth/token
  private readonly apiUrl: string;   // e.g. https://quantovale.online/api/v1

  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
  ) {
    this.clientId = this.config.getOrThrow<string>('QUANTOVALE_CLIENT_ID');
    this.clientSecret = this.config.getOrThrow<string>('QUANTOVALE_CLIENT_SECRET');
    this.redirectUri = this.config.getOrThrow<string>('QUANTOVALE_REDIRECT_URI');
    this.authorizeUrl = this.config.get<string>(
      'QUANTOVALE_AUTHORIZE_URL',
      'https://quantovale.online/oauth/authorize',
    );
    this.tokenUrl = this.config.get<string>(
      'QUANTOVALE_TOKEN_URL',
      'https://quantovale.online/oauth/token',
    );
    this.apiUrl = this.config.get<string>(
      'QUANTOVALE_API_URL',
      'https://quantovale.online/api/v1',
    );
  }

  // ── Helper: headers padrão da API ─────────────────────────────────────────
  private _headers(token: string): Record<string, string> {
    return {
      Authorization: `Bearer ${token}`,
      'API-Version': QV_API_VERSION,
      'Content-Type': 'application/json',
    };
  }

  // v2 base URL derivado do v1
  private get apiUrlV2(): string {
    return this.apiUrl.replace('/api/v1', '/api/v2');
  }

  // ── Gera a URL de autorização para redirecionar o usuário ──────────────────

  getAuthorizeUrl(userId: string): string {
    const scopes = 'read:user read:valuations write:valuations read:pitch_decks read:plans';

    const params = new URLSearchParams({
      client_id: this.clientId,
      redirect_uri: this.redirectUri,
      response_type: 'code',
      scope: scopes,
      state: this._encodeState(userId),
    });

    return `${this.authorizeUrl}?${params.toString()}`;
  }

  // ── Troca o código de autorização por tokens e salva no banco ──────────────

  async exchangeCode(
    userId: string,
    code: string,
    redirectUri: string,
  ): Promise<{ ok: boolean; scopes: string[] }> {
    const body = {
      grant_type: 'authorization_code',
      code,
      redirect_uri: redirectUri,
      client_id: this.clientId,
      client_secret: this.clientSecret,
    };

    // Tenta múltiplas combinações de URL + Content-Type até uma funcionar
    const attempts = [
      { url: this.tokenUrl, ct: 'application/json', payload: JSON.stringify(body) },
      { url: this.tokenUrl, ct: 'application/x-www-form-urlencoded', payload: new URLSearchParams(body as any).toString() },
      { url: `${this.apiUrl}/oauth/token`, ct: 'application/json', payload: JSON.stringify(body) },
      { url: `${this.apiUrl}/oauth/token`, ct: 'application/x-www-form-urlencoded', payload: new URLSearchParams(body as any).toString() },
    ];

    let tokens: QuantovaleTokenResponse | null = null;
    let lastError = '';

    for (const attempt of attempts) {
      try {
        this.logger.log(`Token attempt → ${attempt.ct} @ ${attempt.url}`);

        const res = await fetch(attempt.url, {
          method: 'POST',
          headers: {
            'Content-Type': attempt.ct,
            Accept: 'application/json',
          },
          body: attempt.payload,
        });

        const rawBody = await res.text();
        const contentType = res.headers.get('content-type') ?? '';

        this.logger.log(`Token response [${res.status}] content-type=${contentType} body=${rawBody.substring(0, 500)}`);

        // Se retornou HTML, essa URL/formato não funciona — tenta próxima
        if (rawBody.trimStart().startsWith('<!') || rawBody.trimStart().startsWith('<html')) {
          lastError = `HTML response from ${attempt.url} (${attempt.ct})`;
          continue;
        }

        // Tenta parsear JSON
        let parsed: any;
        try {
          parsed = JSON.parse(rawBody);
        } catch {
          lastError = `Non-JSON response from ${attempt.url}: ${rawBody.substring(0, 200)}`;
          continue;
        }

        // Se tem um erro explícito do QuantoVale
        if (!res.ok || parsed.error || parsed.detail) {
          lastError = `QuantoVale error [${res.status}]: ${rawBody.substring(0, 500)}`;
          continue;
        }

        // Sucesso!
        tokens = parsed as QuantovaleTokenResponse;
        this.logger.log(`Token exchange succeeded via ${attempt.ct} @ ${attempt.url}`);
        break;
      } catch (err) {
        const errMsg = err instanceof Error ? err.message : String(err);
        lastError = `Fetch failed for ${attempt.url}: ${errMsg}`;
        this.logger.warn(lastError);
        continue;
      }
    }

    if (!tokens || !tokens.access_token) {
      this.logger.error(`All token exchange attempts failed. Last error: ${lastError}`);
      throw new BadRequestException(`Falha ao trocar código com o QuantoVale. ${lastError}`);
    }

    const expiresAt = tokens.expires_in
      ? new Date(Date.now() + tokens.expires_in * 1000)
      : null;

    const scopes = tokens.scopes ?? [];

    // Upsert — se o usuário já tinha conexão, atualiza
    await this.prisma.quantovaleConnection.upsert({
      where: { userId },
      update: {
        accessToken: tokens.access_token,
        refreshToken: tokens.refresh_token ?? null,
        expiresAt,
        scopes,
      },
      create: {
        userId,
        accessToken: tokens.access_token,
        refreshToken: tokens.refresh_token ?? null,
        expiresAt,
        scopes,
      },
    });

    this.logger.log(`QuantoVale connection saved for user ${userId}`);
    return { ok: true, scopes };
  }

  // ── Verifica se o usuário tem uma conexão ativa ────────────────────────────

  async getConnectionStatus(userId: string) {
    const conn = await this.prisma.quantovaleConnection.findUnique({
      where: { userId },
      select: { connectedAt: true, scopes: true, expiresAt: true },
    });

    if (!conn) return { connected: false };

    const isExpired = conn.expiresAt ? conn.expiresAt < new Date() : false;
    return {
      connected: true,
      connectedAt: conn.connectedAt,
      scopes: conn.scopes,
      tokenExpired: isExpired,
    };
  }

  // ── Busca valuations do QuantoVale usando o token armazenado ───────────────

  async getValuations(userId: string): Promise<{ data: QuantovaleValuation[]; pagination: unknown }> {
    const conn = await this._getActiveConnection(userId);
    const url = `${this.apiUrl}/public/valuations`;

    let res = await this._fetchWithRetry(userId, conn, url, 'GET');

    if (!res.ok) {
      const errBody = await res.text().catch(() => '<unreadable>');
      this.logger.error(`QuantoVale valuations failed [${res.status}] url=${url} body=${errBody}`);
      throw new BadRequestException('Erro ao buscar valuations no QuantoVale.');
    }

    const json = await res.json() as { data?: QuantovaleValuation[]; pagination?: unknown } | QuantovaleValuation[];
    if (Array.isArray(json)) return { data: json, pagination: null };
    return { data: json.data ?? [], pagination: json.pagination ?? null };
  }

  // ── Cria um novo valuation no QuantoVale ───────────────────────────────────

  async createValuation(userId: string, input: CreateValuationInput): Promise<QuantovaleValuation> {
    const conn = await this._getActiveConnection(userId);
    const url = `${this.apiUrl}/public/valuations`;

    let res = await this._fetchWithRetry(userId, conn, url, 'POST', input);

    if (!res.ok) {
      const errBody = await res.text().catch(() => '<unreadable>');
      this.logger.error(`QuantoVale createValuation failed [${res.status}] body=${errBody}`);
      throw new BadRequestException('Erro ao criar valuation no QuantoVale.');
    }

    const json = await res.json() as { data?: QuantovaleValuation } | QuantovaleValuation;
    return ('data' in json && json.data ? json.data : json) as QuantovaleValuation;
  }

  // ── Busca relatório detalhado de um valuation (API v2) ────────────────────

  async getValuationReport(userId: string, valuationId: string): Promise<QuantovaleReport> {
    const conn = await this._getActiveConnection(userId);
    const url = `${this.apiUrlV2}/valuations/${valuationId}/report`;

    let res = await this._fetchWithRetry(userId, conn, url, 'GET');

    if (!res.ok) {
      const errBody = await res.text().catch(() => '<unreadable>');
      this.logger.error(`QuantoVale getReport failed [${res.status}] url=${url} body=${errBody}`);
      throw new BadRequestException('Erro ao buscar relatório do QuantoVale.');
    }

    return res.json() as Promise<QuantovaleReport>;
  }

  // ── Desconecta o usuário (remove tokens do banco) ─────────────────────────

  async disconnect(userId: string): Promise<void> {
    await this.prisma.quantovaleConnection.deleteMany({ where: { userId } });
    this.logger.log(`QuantoVale connection removed for user ${userId}`);
  }

  // ── Helpers privados ───────────────────────────────────────────────────────

  private _encodeState(userId: string): string {
    return Buffer.from(userId).toString('base64url');
  }

  private async _getActiveConnection(userId: string) {
    const conn = await this.prisma.quantovaleConnection.findUnique({
      where: { userId },
    });
    if (!conn) {
      throw new NotFoundException(
        'Conta QuantoVale não conectada. Acesse Configurações → Integrações.',
      );
    }
    return conn;
  }

  /** Faz a chamada; se receber 401, renova o token e tenta uma vez mais. */
  private async _fetchWithRetry(
    userId: string,
    conn: { accessToken: string; refreshToken: string | null },
    url: string,
    method: string,
    body?: unknown,
  ): Promise<Response> {
    const opts: RequestInit = {
      method,
      headers: this._headers(conn.accessToken),
      ...(body ? { body: JSON.stringify(body) } : {}),
    };

    let res: Response;
    try {
      res = await fetch(url, opts);
    } catch (err) {
      const errMsg = err instanceof Error ? `${err.message}\n${err.stack}` : String(err);
      this.logger.error(`QuantoVale fetch error [${url}]: ${errMsg}`);
      throw new BadRequestException('Erro de comunicação com o QuantoVale.');
    }

    if (res.status === 401 && conn.refreshToken) {
      const newToken = await this._refreshAccessToken(userId, conn.refreshToken);
      opts.headers = this._headers(newToken);
      res = await fetch(url, opts);
    }

    return res;
  }

  private async _refreshAccessToken(userId: string, refreshToken: string): Promise<string> {
    const body = {
      grant_type: 'refresh_token',
      refresh_token: refreshToken,
      client_id: this.clientId,
      client_secret: this.clientSecret,
    };

    const tokens = await this._tokenRequest(body);

    await this.prisma.quantovaleConnection.update({
      where: { userId },
      data: {
        accessToken: tokens.access_token,
        refreshToken: tokens.refresh_token ?? refreshToken,
        expiresAt: tokens.expires_in
          ? new Date(Date.now() + tokens.expires_in * 1000)
          : null,
      },
    });

    return tokens.access_token;
  }

  /** Tenta POST no token endpoint com JSON e form-urlencoded, ambas URLs */
  private async _tokenRequest(body: Record<string, string>): Promise<QuantovaleTokenResponse> {
    const attempts = [
      { url: this.tokenUrl, ct: 'application/json', payload: JSON.stringify(body) },
      { url: this.tokenUrl, ct: 'application/x-www-form-urlencoded', payload: new URLSearchParams(body).toString() },
      { url: `${this.apiUrl}/oauth/token`, ct: 'application/json', payload: JSON.stringify(body) },
      { url: `${this.apiUrl}/oauth/token`, ct: 'application/x-www-form-urlencoded', payload: new URLSearchParams(body).toString() },
    ];

    let lastError = '';
    for (const attempt of attempts) {
      try {
        const res = await fetch(attempt.url, {
          method: 'POST',
          headers: { 'Content-Type': attempt.ct, Accept: 'application/json' },
          body: attempt.payload,
        });
        const raw = await res.text();

        if (raw.trimStart().startsWith('<!') || raw.trimStart().startsWith('<html')) {
          lastError = `HTML from ${attempt.url}`;
          continue;
        }

        let parsed: any;
        try { parsed = JSON.parse(raw); } catch { lastError = `Non-JSON from ${attempt.url}`; continue; }
        if (!res.ok || parsed.error || parsed.detail) { lastError = `Error [${res.status}]: ${raw.substring(0, 300)}`; continue; }

        return parsed as QuantovaleTokenResponse;
      } catch (err) {
        lastError = err instanceof Error ? err.message : String(err);
        continue;
      }
    }

    throw new BadRequestException(`Sessão QuantoVale expirada. ${lastError}`);
  }
}
