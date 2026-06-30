import { Injectable, Logger } from '@nestjs/common';
import axios from 'axios';

export interface ZapSignSignerInput {
  name: string;
  externalId: string; // 'emitente' | 'credor'
  email?: string;
  phoneCountry?: string;
  phoneNumber?: string;
  sendAutomaticEmail?: boolean;
  sendAutomaticWhatsapp?: boolean;
}

export interface ZapSignCreatedSigner {
  name: string;
  externalId: string;
  token: string;
  signUrl: string;
}

export interface ZapSignCreatedDoc {
  docToken: string;
  signers: ZapSignCreatedSigner[];
}

/**
 * Integração com a ZapSign para assinatura eletrônica.
 * Habilitada quando ZAPSIGN_API_KEY está definido. Sem a chave, o chamador
 * deve usar o fluxo de assinatura interno como fallback.
 */
@Injectable()
export class ZapSignService {
  private readonly logger = new Logger(ZapSignService.name);
  private readonly apiKey = process.env.ZAPSIGN_API_KEY || '';
  private readonly baseUrl = process.env.ZAPSIGN_BASE_URL || 'https://api.zapsign.com.br/api/v1';

  isEnabled(): boolean {
    return this.apiKey.length > 0;
  }

  /**
   * Cria um documento na ZapSign (a partir de um PDF base64 ou de markdown) e
   * retorna os links de assinatura por signatário. Retorna null em caso de falha.
   */
  async createDocument(params: {
    name: string;
    base64Pdf?: string;
    markdownText?: string;
    externalId: string;
    brandLogo?: string;
    brandPrimaryColor?: string;
    signers: ZapSignSignerInput[];
  }): Promise<ZapSignCreatedDoc | null> {
    if (!this.isEnabled()) return null;

    try {
      const { data } = await axios.post(
        `${this.baseUrl}/docs/`,
        {
          name: params.name,
          ...(params.base64Pdf
            ? { base64_pdf: params.base64Pdf }
            : { markdown_text: params.markdownText ?? '' }),
          external_id: params.externalId,
          lang: 'pt-br',
          ...(params.brandLogo ? { brand_logo: params.brandLogo } : {}),
          ...(params.brandPrimaryColor ? { brand_primary_color: params.brandPrimaryColor } : {}),
          signers: params.signers.map((s) => ({
            name: s.name,
            external_id: s.externalId,
            auth_mode: 'assinaturaTela',
            ...(s.email ? { email: s.email } : {}),
            ...(s.phoneCountry ? { phone_country: s.phoneCountry } : {}),
            ...(s.phoneNumber ? { phone_number: s.phoneNumber } : {}),
            ...(s.sendAutomaticEmail && s.email ? { send_automatic_email: true } : {}),
            ...(s.sendAutomaticWhatsapp && s.phoneNumber ? { send_automatic_whatsapp: true } : {}),
          })),
        },
        {
          headers: {
            Authorization: `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json',
          },
          timeout: 25000,
        },
      );

      const signers: ZapSignCreatedSigner[] = (data?.signers ?? []).map(
        (s: { name: string; external_id?: string; token: string; sign_url: string }) => ({
          name: s.name,
          externalId: s.external_id ?? '',
          token: s.token,
          signUrl: s.sign_url,
        }),
      );

      this.logger.log(`ZapSign: documento criado (token ${data?.token}) com ${signers.length} signatário(s)`);
      return { docToken: data?.token, signers };
    } catch (err) {
      const e = err as { response?: { status?: number; data?: unknown }; message?: string };
      this.logger.error(
        `ZapSign: falha ao criar documento (${e?.response?.status ?? ''}) — ${
          typeof e?.response?.data === 'string' ? e.response?.data : JSON.stringify(e?.response?.data ?? e?.message)
        }`,
      );
      return null;
    }
  }

  /**
   * Detalha um documento na ZapSign para obter o link (temporário) do arquivo
   * assinado mais recente. Retorna null em caso de falha.
   */
  async getDocument(docToken: string): Promise<{ status?: string; signedFile?: string } | null> {
    if (!this.isEnabled() || !docToken) return null;
    try {
      const { data } = await axios.get(`${this.baseUrl}/docs/${docToken}/`, {
        headers: { Authorization: `Bearer ${this.apiKey}` },
        timeout: 20000,
      });
      return { status: data?.status, signedFile: data?.signed_file ?? undefined };
    } catch (err) {
      const e = err as { response?: { status?: number }; message?: string };
      this.logger.warn(`ZapSign: falha ao detalhar documento (${e?.response?.status ?? e?.message})`);
      return null;
    }
  }
}
