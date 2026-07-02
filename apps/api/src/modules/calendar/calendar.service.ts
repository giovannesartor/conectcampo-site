import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { UserRole, Prisma, FinancialEventStatus } from '@prisma/client';
import {
  CreateFinancialEventDto,
  UpdateFinancialEventDto,
} from './dto/financial-event.dto';

@Injectable()
export class CalendarService {
  constructor(private readonly prisma: PrismaService) {}

  private async assertOwner(id: string, userId: string, role: string) {
    const event = await this.prisma.financialEvent.findUnique({ where: { id } });
    if (!event || event.deletedAt) throw new NotFoundException('Evento não encontrado');
    if (role !== UserRole.ADMIN && event.userId !== userId) {
      throw new ForbiddenException('Acesso negado');
    }
    return event;
  }

  async create(userId: string, dto: CreateFinancialEventDto) {
    return this.prisma.financialEvent.create({
      data: {
        userId,
        title: dto.title,
        type: dto.type,
        amount: dto.amount,
        dueDate: new Date(dto.dueDate),
        notes: dto.notes,
        reminderDays: dto.reminderDays ?? 3,
      },
    });
  }

  async findAll(userId: string, role: string) {
    const where: Prisma.FinancialEventWhereInput = { deletedAt: null };
    if (role !== UserRole.ADMIN) where.userId = userId;

    const events = await this.prisma.financialEvent.findMany({
      where,
      orderBy: { dueDate: 'asc' },
    });

    // Marca como ATRASADO quem venceu e ainda está pendente (derivado em memória)
    const now = new Date();
    return events.map((e) => ({
      ...e,
      status:
        e.status === FinancialEventStatus.PENDENTE && e.dueDate < now
          ? FinancialEventStatus.ATRASADO
          : e.status,
    }));
  }

  async getSummary(userId: string, role: string) {
    const where: Prisma.FinancialEventWhereInput = { deletedAt: null };
    if (role !== UserRole.ADMIN) where.userId = userId;

    const events = await this.prisma.financialEvent.findMany({ where });
    const now = new Date();
    const in30 = new Date(now.getTime() + 30 * 86400000);

    let totalPendente = 0;
    let totalAtrasado = 0;
    let countAtrasado = 0;
    let countProximos30 = 0;
    let totalProximos30 = 0;

    for (const e of events) {
      const amount = Number(e.amount ?? 0);
      if (e.status === FinancialEventStatus.PAGO) continue;
      if (e.dueDate < now) {
        totalAtrasado += amount;
        countAtrasado += 1;
      } else {
        totalPendente += amount;
        if (e.dueDate <= in30) {
          countProximos30 += 1;
          totalProximos30 += amount;
        }
      }
    }

    return {
      total: events.length,
      totalPendente,
      totalAtrasado,
      countAtrasado,
      countProximos30,
      totalProximos30,
    };
  }

  async update(id: string, userId: string, role: string, dto: UpdateFinancialEventDto) {
    await this.assertOwner(id, userId, role);
    return this.prisma.financialEvent.update({
      where: { id },
      data: {
        ...dto,
        dueDate: dto.dueDate ? new Date(dto.dueDate) : undefined,
        paidAt: dto.status === FinancialEventStatus.PAGO ? new Date() : undefined,
      },
    });
  }

  async markPaid(id: string, userId: string, role: string) {
    await this.assertOwner(id, userId, role);
    return this.prisma.financialEvent.update({
      where: { id },
      data: { status: FinancialEventStatus.PAGO, paidAt: new Date() },
    });
  }

  async remove(id: string, userId: string, role: string) {
    await this.assertOwner(id, userId, role);
    await this.prisma.financialEvent.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
    return { success: true };
  }
}
