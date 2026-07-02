import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { UserRole, Prisma, CashFlowType } from '@prisma/client';
import { CreateCashFlowDto, UpdateCashFlowDto } from './dto/cashflow.dto';

@Injectable()
export class CashflowService {
  constructor(private readonly prisma: PrismaService) {}

  private async assertOwner(id: string, userId: string, role: string) {
    const entry = await this.prisma.cashFlowEntry.findUnique({ where: { id } });
    if (!entry || entry.deletedAt) throw new NotFoundException('Lançamento não encontrado');
    if (role !== UserRole.ADMIN && entry.userId !== userId) {
      throw new ForbiddenException('Acesso negado');
    }
    return entry;
  }

  async create(userId: string, dto: CreateCashFlowDto) {
    return this.prisma.cashFlowEntry.create({
      data: {
        userId,
        safra: dto.safra,
        type: dto.type,
        category: dto.category,
        description: dto.description,
        amount: dto.amount,
        date: new Date(dto.date),
        isProjected: dto.isProjected ?? false,
      },
    });
  }

  async findAll(userId: string, role: string, safra?: string) {
    const where: Prisma.CashFlowEntryWhereInput = { deletedAt: null };
    if (role !== UserRole.ADMIN) where.userId = userId;
    if (safra) where.safra = safra;

    return this.prisma.cashFlowEntry.findMany({
      where,
      orderBy: { date: 'desc' },
    });
  }

  async getSummary(userId: string, role: string, safra?: string) {
    const where: Prisma.CashFlowEntryWhereInput = { deletedAt: null };
    if (role !== UserRole.ADMIN) where.userId = userId;
    if (safra) where.safra = safra;

    const entries = await this.prisma.cashFlowEntry.findMany({ where });

    let totalReceita = 0;
    let totalDespesa = 0;
    let projReceita = 0;
    let projDespesa = 0;
    const monthly: Record<string, { receita: number; despesa: number }> = {};

    for (const e of entries) {
      const amount = Number(e.amount);
      const key = e.date.toISOString().slice(0, 7); // YYYY-MM
      monthly[key] ??= { receita: 0, despesa: 0 };
      if (e.type === CashFlowType.RECEITA) {
        monthly[key].receita += amount;
        if (e.isProjected) projReceita += amount;
        else totalReceita += amount;
      } else {
        monthly[key].despesa += amount;
        if (e.isProjected) projDespesa += amount;
        else totalDespesa += amount;
      }
    }

    const monthlySeries = Object.entries(monthly)
      .map(([month, v]) => ({ month, ...v, saldo: v.receita - v.despesa }))
      .sort((a, b) => a.month.localeCompare(b.month));

    return {
      totalReceita,
      totalDespesa,
      saldoRealizado: totalReceita - totalDespesa,
      projReceita,
      projDespesa,
      saldoProjetado: totalReceita + projReceita - totalDespesa - projDespesa,
      monthlySeries,
    };
  }

  async update(id: string, userId: string, role: string, dto: UpdateCashFlowDto) {
    await this.assertOwner(id, userId, role);
    return this.prisma.cashFlowEntry.update({
      where: { id },
      data: {
        ...dto,
        date: dto.date ? new Date(dto.date) : undefined,
      },
    });
  }

  async remove(id: string, userId: string, role: string) {
    await this.assertOwner(id, userId, role);
    await this.prisma.cashFlowEntry.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
    return { success: true };
  }
}
