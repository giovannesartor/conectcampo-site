import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import axios from 'axios';

/**
 * Enriquecimento de dados públicos. Fonte inicial GRÁTIS e sem chave:
 * BrasilAPI (dados da Receita Federal). Fallback: OpenCNPJ.
 */
@Injectable()
export class EnrichmentService {
  private readonly logger = new Logger(EnrichmentService.name);

  async lookupCnpj(cnpjRaw: string) {
    const cnpj = String(cnpjRaw || '').replace(/\D/g, '');
    if (cnpj.length !== 14) {
      throw new BadRequestException('CNPJ inválido');
    }

    try {
      const { data } = await axios.get(`https://brasilapi.com.br/api/cnpj/v1/${cnpj}`, {
        timeout: 10000,
      });
      return {
        source: 'BrasilAPI (Receita Federal)',
        cnpj,
        razaoSocial: data?.razao_social ?? null,
        nomeFantasia: data?.nome_fantasia ?? null,
        situacao: data?.descricao_situacao_cadastral ?? null,
        dataAbertura: data?.data_inicio_atividade ?? null,
        cnaePrincipal: data?.cnae_fiscal_descricao ?? null,
        naturezaJuridica: data?.natureza_juridica ?? null,
        municipio: data?.municipio ?? null,
        uf: data?.uf ?? null,
        capitalSocial: data?.capital_social ?? null,
        telefone: data?.ddd_telefone_1 ?? null,
        email: data?.email ?? null,
      };
    } catch (e) {
      this.logger.warn(`Falha na consulta de CNPJ ${cnpj}: ${(e as Error).message}`);
      throw new BadRequestException('Não foi possível consultar o CNPJ agora.');
    }
  }
}
