import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { UserRole, Prisma } from '@prisma/client';
import { CreateFieldEntryDto, UpdateFieldEntryDto } from './dto/field-entry.dto';

@Injectable()
export class FieldJournalService {
  constructor(private readonly prisma: PrismaService) {}

  private async assertFarmOwner(farmId: string, userId: string, role: string) {
    const farm = await this.prisma.farm.findUnique({ where: { id: farmId } });
    if (!farm || farm.deletedAt) throw new NotFoundException('Fazenda não encontrada');
    if (role !== UserRole.ADMIN && farm.userId !== userId) {
      throw new ForbiddenException('Acesso negado');
    }
    return farm;
  }

  private async assertEntryOwner(id: string, userId: string, role: string) {
    const entry = await this.prisma.fieldJournalEntry.findUnique({ where: { id } });
    if (!entry || entry.deletedAt) throw new NotFoundException('Registro não encontrado');
    if (role !== UserRole.ADMIN && entry.userId !== userId) {
      throw new ForbiddenException('Acesso negado');
    }
    return entry;
  }

  async create(userId: string, role: string, dto: CreateFieldEntryDto) {
    await this.assertFarmOwner(dto.farmId, userId, role);
    const entry = await this.prisma.fieldJournalEntry.create({
      data: {
        userId,
        farmId: dto.farmId,
        plotId: dto.plotId,
        type: dto.type,
        title: dto.title,
        description: dto.description,
        date: new Date(dto.date),
        inputName: dto.inputName,
        inputQuantity: dto.inputQuantity,
        inputUnit: dto.inputUnit,
        cost: dto.cost,
      },
    });

    // Integração: lança o custo como despesa no fluxo de caixa, se solicitado.
    if (dto.addToCashflow && dto.cost && dto.cost > 0) {
      await this.prisma.cashFlowEntry.create({
        data: {
          userId,
          type: 'DESPESA',
          category: dto.type === 'PLANTIO' || dto.type === 'ADUBACAO' || dto.type === 'PULVERIZACAO' ? 'INSUMOS' : 'CUSTEIO',
          description: `${dto.title}${dto.inputName ? ` (${dto.inputName})` : ''}`,
          amount: dto.cost,
          date: new Date(dto.date),
        },
      });
    }

    return entry;
  }

  async findAll(userId: string, role: string, farmId?: string) {
    const where: Prisma.FieldJournalEntryWhereInput = { deletedAt: null };
    if (role !== UserRole.ADMIN) where.userId = userId;
    if (farmId) where.farmId = farmId;

    return this.prisma.fieldJournalEntry.findMany({
      where,
      orderBy: { date: 'desc' },
      take: 500,
      include: {
        farm: { select: { id: true, name: true } },
        plot: { select: { id: true, name: true } },
      },
    });
  }

  async getSummary(userId: string, role: string) {
    const where: Prisma.FieldJournalEntryWhereInput = { deletedAt: null };
    if (role !== UserRole.ADMIN) where.userId = userId;

    const entries = await this.prisma.fieldJournalEntry.findMany({
      where,
      select: { type: true, cost: true, date: true },
    });

    const totalEntries = entries.length;
    const totalCost = entries.reduce((s, e) => s + Number(e.cost ?? 0), 0);
    const byType: Record<string, number> = {};
    for (const e of entries) byType[e.type] = (byType[e.type] ?? 0) + 1;

    return { totalEntries, totalCost, byType };
  }

  async update(id: string, userId: string, role: string, dto: UpdateFieldEntryDto) {
    await this.assertEntryOwner(id, userId, role);
    return this.prisma.fieldJournalEntry.update({
      where: { id },
      data: {
        ...dto,
        date: dto.date ? new Date(dto.date) : undefined,
      },
    });
  }

  async remove(id: string, userId: string, role: string) {
    await this.assertEntryOwner(id, userId, role);
    await this.prisma.fieldJournalEntry.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
    return { success: true };
  }
}
