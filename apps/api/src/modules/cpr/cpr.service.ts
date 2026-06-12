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

const CONECTCAMPO_FEE_RATE = 0.06; // 6%

@Injectable()
export class CprService {
  private readonly logger = new Logger(CprService.name);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private get db(): any { return this.prisma; }

  constructor(private readonly prisma: PrismaService) {}

  // ─── Helpers ────────────────────────────────────────────────────────────────

  private async assertOwner(cprId: string, userId: string, role: string) {
    const cpr = await this.db.cprDocument.findUnique({ where: { id: cprId } });
    if (!cpr || cpr.deletedAt) throw new NotFoundException('CPR não encontrada');
    if (role !== UserRole.ADMIN && cpr.userId !== userId) {
      throw new ForbiddenException('Acesso negado');
    }
    return cpr;
  }

  private generateNumeroCpr(): string {
    const year = new Date().getFullYear();
    const seq = Math.floor(Math.random() * 900000) + 100000; // 6 dígitos
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

    const conectcampoFeeValue =
      valorTotal != null ? valorTotal * CONECTCAMPO_FEE_RATE : null;

    const cpr = await this.db.cprDocument.create({
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
        emitenteEstado: dto.emitenteEstado,
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

        // Garantia
        garantiaTipo: dto.garantiaTipo,
        garantiaDescricao: dto.garantiaDescricao,
        garantiaValor: dto.garantiaValor,

        // Captação
        finalidade: dto.finalidade,
        valorCaptacao: dto.valorCaptacao,

        // ConectCampo fee
        conectcampoFeeRate: CONECTCAMPO_FEE_RATE,
        conectcampoFeeValue,

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
      this.db.cprDocument.findMany({
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
      this.db.cprDocument.count({ where }),
    ]);

    return {
      data,
      meta: { total, page, perPage, totalPages: Math.ceil(total / perPage) },
    };
  }

  async findOne(cprId: string, userId: string, role: string) {
    return this.assertOwner(cprId, userId, role);
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

    return this.db.cprDocument.update({
      where: { id: cprId },
      data: {
        ...dto,
        dataVencimento: dto.dataVencimento ? new Date(dto.dataVencimento) : undefined,
        dataEntrega: dto.dataEntrega ? new Date(dto.dataEntrega) : undefined,
        ...(valorTotal != null && { valorTotal }),
        ...(conectcampoFeeValue != null && { conectcampoFeeValue }),
      },
    });
  }

  async delete(cprId: string, userId: string, role: string) {
    await this.assertOwner(cprId, userId, role);
    return this.db.cprDocument.update({
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

    const updated = await this.db.cprDocument.update({
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

    return this.db.cprDocument.update({
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

    return this.db.cprDocument.update({
      where: { id: cprId },
      data: { status: 'LIQUIDADA' },
    });
  }

  // ─── Resumo (dashboard) ──────────────────────────────────────────────────────

  async getSummary(userId: string, role: string) {
    const where =
      role === UserRole.ADMIN ? { deletedAt: null } : { deletedAt: null, userId };

    const all = await this.db.cprDocument.findMany({
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
