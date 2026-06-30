import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateCprDto } from './dto/create-cpr.dto';
import { UpdateCprDto } from './dto/update-cpr.dto';
import { UserRole } from '@prisma/client';

const CONECTCAMPO_FEE_RATE = 0.06; // 6% — aplicado apenas na Captação
const CUSTO_EMISSAO_CPR_FISICA = 2500; // R$ 2.500 (pagamento único) na emissão de CPR Física

@Injectable()
export class CprService {
  private readonly logger = new Logger(CprService.name);

  constructor(private readonly prisma: PrismaService) {}

  // ─── Helpers ────────────────────────────────────────────────────────────────

  private async assertOwner(cprId: string, userId: string, role: string) {
    const cpr = await this.prisma.cprDocument.findUnique({ where: { id: cprId } });
    if (!cpr || cpr.deletedAt) throw new NotFoundException('CPR não encontrada');
    if (role !== UserRole.ADMIN && cpr.userId !== userId) {
      throw new ForbiddenException('Acesso negado');
    }
    return cpr;
  }

  private generateNumeroCpr(): string {
    const year = new Date().getFullYear();
    // Use crypto-safe random to avoid collision-prone Math.random()
    const bytes = crypto.getRandomValues(new Uint32Array(1));
    const seq = (bytes[0] % 900000) + 100000; // 6 dígitos
    return `CPR-${year}-${seq}`;
  }

  // ─── CRUD ────────────────────────────────────────────────────────────────────

  async create(userId: string, dto: CreateCprDto) {
    // Busca perfil do produtor (opcional — usuários COMPANY/ADMIN podem não ter)
    const producerProfile = await this.prisma.producerProfile.findUnique({
      where: { userId },
    });

    const valorTotal =
      dto.precoUnitario != null
        ? dto.quantidade * dto.precoUnitario
        : null;

    const isEmissao = dto.purpose === 'EMISSAO';
    const isFisica = (dto.type ?? 'FINANCEIRA') === 'FISICA';

    // Fee de 6% aplica-se apenas na Captação de Crédito.
    const conectcampoFeeValue =
      !isEmissao && valorTotal != null ? valorTotal * CONECTCAMPO_FEE_RATE : null;

    // Custo de emissão (pagamento único): CPR Física = R$ 2.500.
    // CPR Financeira: a definir (sem custo fixo por enquanto).
    const custoEmissao = isEmissao && isFisica ? CUSTO_EMISSAO_CPR_FISICA : null;

    const cpr = await this.prisma.cprDocument.create({
      data: {
        userId,
        producerProfileId: producerProfile?.id ?? null,
        purpose: dto.purpose,
        type: dto.type ?? 'FINANCEIRA',
        status: 'RASCUNHO',

        // Emitente
        emitenteNome: dto.emitenteNome,
        emitenteCpfCnpj: dto.emitenteCpfCnpj,
        emitenteEndereco: dto.emitenteEndereco,
        emitenteCidade: dto.emitenteCidade,
        emitenteEstado: dto.emitenteEstado as import('@prisma/client').BrazilianState | undefined,
        emitenteCarNumero: dto.emitenteCarNumero,

        // Credor
        credorNome: dto.credorNome,
        credorCpfCnpj: dto.credorCpfCnpj,
        credorTipo: dto.credorTipo,

        // Produto
        produto: dto.produto,
        quantidade: dto.quantidade,
        unidade: dto.unidade,
        safraAno: dto.safraAno,
        precoUnitario: dto.precoUnitario,
        valorTotal,
        localEntrega: dto.localEntrega,
        dataEntrega: dto.dataEntrega ? new Date(dto.dataEntrega) : null,

        // Vencimento
        dataVencimento: new Date(dto.dataVencimento),
        prazoMeses: dto.prazoMeses,
        carenciaMeses: dto.carenciaMeses,

        // Garantia
        garantiaTipo: dto.garantiaTipo,
        garantiaDescricao: dto.garantiaDescricao,
        garantiaValor: dto.garantiaValor,

        // Captação
        finalidade: dto.finalidade,
        valorCaptacao: dto.valorCaptacao,

        // ConectCampo fee (6% — só Captação) e custo de emissão (R$2.500 — CPR Física)
        conectcampoFeeRate: CONECTCAMPO_FEE_RATE,
        conectcampoFeeValue,
        custoEmissao,

        observacoes: dto.observacoes,
      },
    });

    this.logger.log(`CPR criada: ${cpr.id} | ${dto.purpose} | Usuário: ${userId}`);
    return cpr;
  }

  async findAll(userId: string, role: string, page = 1, perPage = 10) {
    const skip = (page - 1) * perPage;
    const where =
      role === UserRole.ADMIN
        ? { deletedAt: null }
        : { deletedAt: null, userId };

    const [data, total] = await Promise.all([
      this.prisma.cprDocument.findMany({
        where,
        skip,
        take: perPage,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          numeroCpr: true,
          purpose: true,
          type: true,
          status: true,
          produto: true,
          quantidade: true,
          unidade: true,
          valorTotal: true,
          dataVencimento: true,
          emitenteNome: true,
          credorNome: true,
          safraAno: true,
          pdfUrl: true,
          conectcampoFeeValue: true,
          createdAt: true,
        },
      }),
      this.prisma.cprDocument.count({ where }),
    ]);

    return {
      data,
      meta: { total, page, perPage, totalPages: Math.ceil(total / perPage) },
    };
  }

  async findOne(cprId: string, userId: string, role: string) {
    return this.assertOwner(cprId, userId, role);
  }

  // ─── Documento (minuta imprimível da CPR) ────────────────────────────────────

  async getDocumentHtml(cprId: string, userId: string, role: string) {
    const cpr = await this.assertOwner(cprId, userId, role);
    return { html: this.renderCprHtml(cpr) };
  }

  private renderCprHtml(c: any): string {
    const esc = (v: unknown) =>
      v == null
        ? '—'
        : String(v).replace(/[&<>"]/g, (ch) =>
            ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' } as Record<string, string>)[ch],
          );
    const brl = (v: unknown) =>
      v == null || v === ''
        ? '—'
        : Number(v).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
    const date = (v: unknown) =>
      v ? new Date(v as string).toLocaleDateString('pt-BR') : '—';
    const meses = (m: number | null | undefined) => {
      if (m == null) return '—';
      const anos = Math.floor(m / 12);
      const r = m % 12;
      const parts: string[] = [];
      if (anos > 0) parts.push(`${anos} ${anos === 1 ? 'ano' : 'anos'}`);
      if (r > 0) parts.push(`${r} ${r === 1 ? 'mês' : 'meses'}`);
      return parts.length ? `${parts.join(' e ')} (${m} meses)` : `${m} meses`;
    };

    const tipoLabel = c.type === 'FISICA' ? 'CPR Física' : 'CPR Financeira';
    const purposeLabel = c.purpose === 'EMISSAO' ? 'Emissão de CPR' : 'Captação de Crédito';
    const safras = c.safraAno ? esc(c.safraAno) : '—';

    const row = (label: string, value: string) =>
      `<tr><td class="lbl">${label}</td><td class="val">${value}</td></tr>`;

    return `<!DOCTYPE html><html lang="pt-BR"><head><meta charset="UTF-8"/>
<title>CPR ${esc(c.numeroCpr ?? 'Rascunho')}</title>
<style>
  @page{size:A4;margin:18mm}
  *{box-sizing:border-box}
  body{font-family:'Segoe UI',Arial,sans-serif;color:#0a0f0c;font-size:12px;line-height:1.5;margin:0}
  .head{display:flex;justify-content:space-between;align-items:flex-start;border-bottom:3px solid #008c3c;padding-bottom:12px;margin-bottom:18px}
  .brand{font-size:20px;font-weight:800;color:#003c28;letter-spacing:-.02em}
  .brand small{display:block;font-size:10px;font-weight:600;color:#008c3c;letter-spacing:.08em;text-transform:uppercase}
  .docmeta{text-align:right;font-size:11px;color:#5b6b5e}
  .docmeta b{color:#0a0f0c}
  h1{font-size:16px;color:#003c28;margin:0 0 2px}
  .sub{font-size:11px;color:#5b6b5e;margin-bottom:16px}
  .badge{display:inline-block;font-size:10px;font-weight:700;padding:2px 8px;border-radius:999px;background:#f0fdf5;color:#006830;border:1px solid #d0f9e4}
  section{margin-bottom:14px;break-inside:avoid}
  h2{font-size:11px;text-transform:uppercase;letter-spacing:.06em;color:#008c3c;border-bottom:1px solid #e6ece7;padding-bottom:4px;margin:0 0 6px}
  table{width:100%;border-collapse:collapse}
  td{padding:4px 6px;vertical-align:top}
  td.lbl{width:34%;color:#5b6b5e}
  td.val{color:#0a0f0c;font-weight:600}
  .grid2{display:flex;gap:18px}
  .grid2>div{flex:1}
  .totais{background:#f6faf7;border:1px solid #e6ece7;border-radius:8px;padding:10px 12px}
  .disc{margin-top:18px;font-size:10px;color:#7d8c80;border-top:1px solid #e6ece7;padding-top:10px}
  .sign{display:flex;gap:40px;margin-top:40px}
  .sign>div{flex:1;text-align:center;border-top:1px solid #0a0f0c;padding-top:6px;font-size:11px}
  .print{margin:16px 0;text-align:center}
  .print button{background:#008c3c;color:#fff;border:none;border-radius:8px;padding:9px 18px;font-size:13px;font-weight:600;cursor:pointer}
  @media print{.print{display:none}}
</style></head><body>
  <div class="print"><button onclick="window.print()">Imprimir / Salvar em PDF</button></div>

  <div class="head">
    <div class="brand">ConectCampo<small>Cédula de Produto Rural</small></div>
    <div class="docmeta">
      <div><b>Nº ${esc(c.numeroCpr ?? '—')}</b></div>
      <div>${tipoLabel}</div>
      <div>Status: <b>${esc(c.status)}</b></div>
      <div>Emitida em ${date(c.createdAt)}</div>
    </div>
  </div>

  <h1>${tipoLabel} — ${purposeLabel}</h1>
  <div class="sub"><span class="badge">${esc(c.produto)}${safras !== '—' ? ' · Safra(s): ' + safras : ''}</span></div>

  <div class="grid2">
    <section>
      <h2>Emitente (Produtor Rural)</h2>
      <table>
        ${row('Nome', esc(c.emitenteNome))}
        ${row('CPF / CNPJ', esc(c.emitenteCpfCnpj))}
        ${row('Cidade / UF', `${esc(c.emitenteCidade)} ${c.emitenteEstado ? '/ ' + esc(c.emitenteEstado) : ''}`)}
        ${row('CAR', esc(c.emitenteCarNumero))}
      </table>
    </section>
    <section>
      <h2>Credor</h2>
      <table>
        ${row('Nome', esc(c.credorNome))}
        ${row('CPF / CNPJ', esc(c.credorCpfCnpj))}
        ${row('Tipo', esc(c.credorTipo))}
      </table>
    </section>
  </div>

  <section>
    <h2>Produto e Entrega</h2>
    <table>
      ${row('Produto', esc(c.produto))}
      ${row('Quantidade', `${Number(c.quantidade).toLocaleString('pt-BR')} ${esc(c.unidade)}`)}
      ${row('Safra(s)', safras)}
      ${row('Preço unitário', brl(c.precoUnitario))}
      ${row('Local de entrega', esc(c.localEntrega))}
      ${row('Data de entrega', date(c.dataEntrega))}
    </table>
  </section>

  <section>
    <h2>Prazo, Carência e Vencimento</h2>
    <table>
      ${row('Prazo total', meses(c.prazoMeses))}
      ${row('Carência', meses(c.carenciaMeses))}
      ${row('Data de vencimento', date(c.dataVencimento))}
    </table>
  </section>

  ${
    c.purpose === 'CAPTACAO'
      ? `<section><h2>Captação de Crédito</h2><table>
          ${row('Finalidade', esc(c.finalidade))}
          ${row('Valor a captar', brl(c.valorCaptacao))}
          ${row('Garantia adicional', esc(c.garantiaTipo))}
          ${row('Descrição da garantia', esc(c.garantiaDescricao))}
          ${row('Valor da garantia', brl(c.garantiaValor))}
        </table></section>`
      : ''
  }

  <section class="totais">
    <h2>Valores</h2>
    <table>
      ${row('Valor total da CPR', brl(c.valorTotal))}
      ${
        c.purpose === 'EMISSAO' && c.type === 'FISICA'
          ? row('Custo de emissão (CPR Física)', `${brl(c.custoEmissao ?? 2500)} · pagamento único`)
          : ''
      }
      ${
        c.purpose === 'CAPTACAO'
          ? row('Fee ConectCampo (6%)', brl(c.conectcampoFeeValue))
          : ''
      }
    </table>
  </section>

  ${c.observacoes ? `<section><h2>Observações</h2><div>${esc(c.observacoes)}</div></section>` : ''}

  <div class="sign">
    <div>Emitente<br/><span style="color:#5b6b5e">${esc(c.emitenteNome)}</span></div>
    <div>Credor<br/><span style="color:#5b6b5e">${esc(c.credorNome)}</span></div>
  </div>

  <div class="disc">
    <strong>Minuta / pré-visualização.</strong> Este documento é uma representação dos dados cadastrados na plataforma ConectCampo
    e <strong>não constitui</strong>, por si só, título executivo registrado. A eficácia plena da Cédula de Produto Rural depende
    de emissão e, quando aplicável, registro no cartório competente e na entidade registradora, nos termos da Lei nº 8.929/1994
    e da Lei nº 13.986/2020. Confira todos os dados antes de assinar.
  </div>
</body></html>`;
  }

  async update(cprId: string, userId: string, role: string, dto: UpdateCprDto) {
    const cpr = await this.assertOwner(cprId, userId, role);

    if (['REGISTRADA', 'LIQUIDADA', 'CANCELADA'].includes(cpr.status)) {
      throw new BadRequestException(
        `CPR com status "${cpr.status}" não pode ser editada.`,
      );
    }

    const valorTotal =
      dto.precoUnitario != null && dto.quantidade != null
        ? dto.quantidade * dto.precoUnitario
        : dto.precoUnitario != null
        ? Number(cpr.quantidade) * dto.precoUnitario
        : null;

    const conectcampoFeeValue =
      valorTotal != null ? valorTotal * CONECTCAMPO_FEE_RATE : null;

    return this.prisma.cprDocument.update({
      where: { id: cprId },
      data: {
        ...dto,
        emitenteEstado: dto.emitenteEstado as import('@prisma/client').BrazilianState | undefined,
        dataVencimento: dto.dataVencimento ? new Date(dto.dataVencimento) : undefined,
        dataEntrega: dto.dataEntrega ? new Date(dto.dataEntrega) : undefined,
        ...(valorTotal != null && { valorTotal }),
        ...(conectcampoFeeValue != null && { conectcampoFeeValue }),
      },
    });
  }

  async delete(cprId: string, userId: string, role: string) {
    await this.assertOwner(cprId, userId, role);
    return this.prisma.cprDocument.update({
      where: { id: cprId },
      data: { deletedAt: new Date(), status: 'CANCELADA' },
    });
  }

  // ─── Emissão (muda status para EMITIDA e gera número) ────────────────────────

  async emit(cprId: string, userId: string, role: string) {
    const cpr = await this.assertOwner(cprId, userId, role);

    if (cpr.status !== 'RASCUNHO') {
      throw new BadRequestException(
        `Apenas CPRs em rascunho podem ser emitidas. Status atual: ${cpr.status}`,
      );
    }

    const numeroCpr = this.generateNumeroCpr();

    const updated = await this.prisma.cprDocument.update({
      where: { id: cprId },
      data: {
        status: 'EMITIDA',
        numeroCpr,
      },
    });

    this.logger.log(`CPR emitida: ${numeroCpr} | ID: ${cprId}`);
    return updated;
  }

  // ─── Registrar em cartório ───────────────────────────────────────────────────

  async register(
    cprId: string,
    userId: string,
    role: string,
    cartorioNome: string,
    cartorioRegistroNum: string,
  ) {
    const cpr = await this.assertOwner(cprId, userId, role);

    if (!['EMITIDA'].includes(cpr.status)) {
      throw new BadRequestException('Apenas CPRs emitidas podem ser registradas em cartório.');
    }

    return this.prisma.cprDocument.update({
      where: { id: cprId },
      data: {
        status: 'REGISTRADA',
        cartorioNome,
        cartorioRegistroNum,
        cartorioRegistradoEm: new Date(),
      },
    });
  }

  // ─── Liquidar ────────────────────────────────────────────────────────────────

  async liquidate(cprId: string, userId: string, role: string) {
    const cpr = await this.assertOwner(cprId, userId, role);

    if (!['EMITIDA', 'REGISTRADA'].includes(cpr.status)) {
      throw new BadRequestException('CPR não pode ser liquidada neste status.');
    }

    return this.prisma.cprDocument.update({
      where: { id: cprId },
      data: { status: 'LIQUIDADA' },
    });
  }

  // ─── Resumo (dashboard) ──────────────────────────────────────────────────────

  async getSummary(userId: string, role: string) {
    const where =
      role === UserRole.ADMIN ? { deletedAt: null } : { deletedAt: null, userId };

    const all = await this.prisma.cprDocument.findMany({
      where,
      select: {
        status: true,
        purpose: true,
        valorTotal: true,
        valorCaptacao: true,
        dataVencimento: true,
        conectcampoFeeValue: true,
      },
    });

    const total = all.length;
    const emitidas = all.filter((c: any) => c.status === 'EMITIDA').length;
    const registradas = all.filter((c: any) => c.status === 'REGISTRADA').length;
    const liquidadas = all.filter((c: any) => c.status === 'LIQUIDADA').length;
    const emissoes = all.filter((c: any) => c.purpose === 'EMISSAO').length;
    const captacoes = all.filter((c: any) => c.purpose === 'CAPTACAO').length;

    const totalValor = all.reduce(
      (s: number, c: any) => s + Number(c.valorTotal ?? 0),
      0,
    );
    const totalCaptacao = all.reduce(
      (s: number, c: any) => s + Number(c.valorCaptacao ?? 0),
      0,
    );
    const totalFeeConectCampo = all.reduce(
      (s: number, c: any) => s + Number(c.conectcampoFeeValue ?? 0),
      0,
    );

    return {
      total,
      emitidas,
      registradas,
      liquidadas,
      emissoes,
      captacoes,
      totalValor,
      totalCaptacao,
      totalFeeConectCampo,
    };
  }
}
