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

interface QuantovaleTokenResponse {
  access_token: string;
  refresh_token?: string;
  expires_in?: number;
  token_type: string;
  scopes?: string[];
}

interface QuantovaleValuation {
  id: string;
  company_name: string;
  valuation_result?: number;
  created_at: string;
  [key: string]: unknown;
}

// ──────────────────────────────────────────────────────────────────────────────

@Injectable()
export class QuantovaleService {
  private readonly logger = new Logger(QuantovaleService.name);

  private readonly clientId: string;
  private readonly clientSecret: string;
  private readonly redirectUri: string;
  private readonly authorizeUrl: string;
  private readonly apiUrl: string;

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
    this.apiUrl = this.config.get<string>(
      'QUANTOVALE_API_URL',
      'https://api.quantovale.online',
    );
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
    // Troca o código por tokens no QuantoVale
    const body = {
      grant_type: 'authorization_code',
      code,
      redirect_uri: redirectUri,
      client_id: this.clientId,
      client_secret: this.clientSecret,
    };

    let tokens: QuantovaleTokenResponse;
    try {
      const res = await fetch(`${this.apiUrl}/oauth/token`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const err = await res.text();
        this.logger.error(`QuantoVale token exchange failed: ${err}`);
        throw new BadRequestException('Falha ao trocar código com o QuantoVale.');
      }

      tokens = await res.json() as QuantovaleTokenResponse;
    } catch (err) {
      if (err instanceof BadRequestException) throw err;
      this.logger.error('Error calling QuantoVale token endpoint', err);
      throw new BadRequestException('Erro de comunicação com o QuantoVale.');
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

  async getValuations(userId: string): Promise<QuantovaleValuation[]> {
    const conn = await this._getActiveConnection(userId);

    let res: Response;
    try {
      res = await fetch(`${this.apiUrl}/valuations`, {
        headers: { Authorization: `Bearer ${conn.accessToken}` },
      });
    } catch {
      throw new BadRequestException('Erro de comunicação com o QuantoVale.');
    }

    // Token expirado: tenta renovar
    if (res.status === 401 && conn.refreshToken) {
      const newToken = await this._refreshAccessToken(userId, conn.refreshToken);
      res = await fetch(`${this.apiUrl}/valuations`, {
        headers: { Authorization: `Bearer ${newToken}` },
      });
    }

    if (!res.ok) {
      const errBody = await res.text().catch(() => '<unreadable>');
      this.logger.error(`QuantoVale valuations failed [${res.status}] url=${this.apiUrl}/valuations body=${errBody}`);
      throw new BadRequestException('Erro ao buscar valuations no QuantoVale.');
    }

    const data = await res.json() as { items?: QuantovaleValuation[] } | QuantovaleValuation[];
    return Array.isArray(data) ? data : (data.items ?? []);
  }

  // ── Desconecta o usuário (remove tokens do banco) ─────────────────────────

  async disconnect(userId: string): Promise<void> {
    await this.prisma.quantovaleConnection.deleteMany({ where: { userId } });
    this.logger.log(`QuantoVale connection removed for user ${userId}`);
  }

  // ── Helpers privados ───────────────────────────────────────────────────────

  private _encodeState(userId: string): string {
    // State simples: base64 do userId — add HMAC se quiser CSRF total
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

  private async _refreshAccessToken(userId: string, refreshToken: string): Promise<string> {
    const body = {
      grant_type: 'refresh_token',
      refresh_token: refreshToken,
      client_id: this.clientId,
      client_secret: this.clientSecret,
    };

    const res = await fetch(`${this.apiUrl}/oauth/token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    if (!res.ok) throw new BadRequestException('Sessão QuantoVale expirada. Reconecte.');

    const tokens = await res.json() as QuantovaleTokenResponse;

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
}
