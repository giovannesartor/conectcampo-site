import { Injectable, Logger } from '@nestjs/common';
import axios from 'axios';

/**
 * AiService — abstração fina sobre um provedor de LLM (Anthropic por padrão).
 *
 * - Habilitado quando `ANTHROPIC_API_KEY` está definido no ambiente.
 * - Quando não há chave (ou a chamada falha), `isEnabled()` retorna false e o
 *   chamador deve usar seu fallback determinístico. Isso mantém a feature
 *   funcionando out-of-the-box e a transforma em IA real ao setar a chave.
 */
@Injectable()
export class AiService {
  private readonly logger = new Logger(AiService.name);
  private readonly apiKey = process.env.ANTHROPIC_API_KEY || '';
  private readonly model = process.env.AI_MODEL || 'claude-haiku-4-5-20251001';
  private readonly baseUrl = 'https://api.anthropic.com/v1/messages';

  isEnabled(): boolean {
    return this.apiKey.length > 0;
  }

  /**
   * Completa um prompt e retorna o texto da resposta, ou `null` em caso de falha.
   */
  async complete(params: {
    system: string;
    prompt: string;
    maxTokens?: number;
    temperature?: number;
  }): Promise<string | null> {
    if (!this.isEnabled()) return null;

    try {
      const { data } = await axios.post(
        this.baseUrl,
        {
          model: this.model,
          max_tokens: params.maxTokens ?? 700,
          temperature: params.temperature ?? 0.3,
          system: params.system,
          messages: [{ role: 'user', content: params.prompt }],
        },
        {
          headers: {
            'x-api-key': this.apiKey,
            'anthropic-version': '2023-06-01',
            'content-type': 'application/json',
          },
          timeout: 20000,
        },
      );

      const text = Array.isArray(data?.content)
        ? data.content.map((c: { text?: string }) => c?.text ?? '').join('').trim()
        : '';

      return text || null;
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      this.logger.warn(`Falha na chamada ao provedor de IA — usando fallback. (${msg})`);
      return null;
    }
  }

  /**
   * Extrai o primeiro objeto JSON de um texto (modelos às vezes envolvem em prosa
   * ou em blocos de código). Retorna `null` se não for possível parsear.
   */
  parseJson<T = unknown>(text: string | null): T | null {
    if (!text) return null;
    const cleaned = text.replace(/```json/gi, '').replace(/```/g, '').trim();
    const start = cleaned.indexOf('{');
    const end = cleaned.lastIndexOf('}');
    if (start === -1 || end === -1 || end <= start) return null;
    try {
      return JSON.parse(cleaned.slice(start, end + 1)) as T;
    } catch {
      return null;
    }
  }
}
