import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { UserRole, Prisma, BarterStatus } from '@prisma/client';
import { CreateBarterDto, UpdateBarterDto } from './dto/barter.dto';

@Injectable()
export class BarterService {
  constructor(private readonly prisma: PrismaService) {}

  private async assertOwner(id: string, userId: string, role: string) {
    const offer = await this.prisma.barterOffer.findUnique({ where: { id } });
    if (!offer || offer.deletedAt) throw new NotFoundException('Operação de barter não encontrada');
    if (role !== UserRole.ADMIN && offer.userId !== userId) {
      throw new ForbiddenException('Acesso negado');
    }
    return offer;
  }

  async create(userId: string, dto: CreateBarterDto) {
    return this.prisma.barterOffer.create({
      data: {
        userId,
        partnerName: dto.partnerName,
        inputProduct: dto.inputProduct,
        inputQuantity: dto.inputQuantity,
        inputUnit: dto.inputUnit,
        inputValue: dto.inputValue,
        grainProduct: dto.grainProduct,
        grainQuantity: dto.grainQuantity,
        grainUnit: dto.grainUnit,
        safra: dto.safra,
        deliveryDate: dto.deliveryDate ? new Date(dto.deliveryDate) : undefined,
        notes: dto.notes,
      },
    });
  }

  async findAll(userId: string, role: string) {
    const where: Prisma.BarterOfferWhereInput = { deletedAt: null };
    if (role !== UserRole.ADMIN) where.userId = userId;
    return this.prisma.barterOffer.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });
  }

  async getSummary(userId: string, role: string) {
    const where: Prisma.BarterOfferWhereInput = { deletedAt: null };
    if (role !== UserRole.ADMIN) where.userId = userId;
    const offers = await this.prisma.barterOffer.findMany({ where });

    const total = offers.length;
    const abertas = offers.filter((o) => o.status === BarterStatus.ABERTA).length;
    const fechadas = offers.filter((o) => o.status === BarterStatus.FECHADA).length;
    const totalInsumoValor = offers.reduce((s, o) => s + Number(o.inputValue ?? 0), 0);

    return { total, abertas, fechadas, totalInsumoValor };
  }

  async update(id: string, userId: string, role: string, dto: UpdateBarterDto) {
    await this.assertOwner(id, userId, role);
    return this.prisma.barterOffer.update({
      where: { id },
      data: {
        ...dto,
        deliveryDate: dto.deliveryDate ? new Date(dto.deliveryDate) : undefined,
      },
    });
  }

  async remove(id: string, userId: string, role: string) {
    await this.assertOwner(id, userId, role);
    await this.prisma.barterOffer.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
    return { success: true };
  }
}
