import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { UserRole, Prisma, SalesContractStatus } from '@prisma/client';
import {
  CreateSalesContractDto,
  UpdateSalesContractDto,
} from './dto/sales-contract.dto';

@Injectable()
export class SalesContractsService {
  constructor(private readonly prisma: PrismaService) {}

  private async assertOwner(id: string, userId: string, role: string) {
    const contract = await this.prisma.salesContract.findUnique({ where: { id } });
    if (!contract || contract.deletedAt) throw new NotFoundException('Contrato não encontrado');
    if (role !== UserRole.ADMIN && contract.userId !== userId) {
      throw new ForbiddenException('Acesso negado');
    }
    return contract;
  }

  async create(userId: string, dto: CreateSalesContractDto) {
    const totalValue = dto.quantity * dto.pricePerUnit;
    return this.prisma.salesContract.create({
      data: {
        userId,
        buyerName: dto.buyerName,
        product: dto.product,
        quantity: dto.quantity,
        unit: dto.unit,
        pricePerUnit: dto.pricePerUnit,
        totalValue,
        deliveryType: dto.deliveryType,
        deliveryDate: dto.deliveryDate ? new Date(dto.deliveryDate) : undefined,
        deliveryLocation: dto.deliveryLocation,
        safra: dto.safra,
        priceLocked: dto.priceLocked ?? true,
        hedged: dto.hedged ?? false,
        hedgeReference: dto.hedgeReference,
        notes: dto.notes,
      },
    });
  }

  async findAll(userId: string, role: string) {
    const where: Prisma.SalesContractWhereInput = { deletedAt: null };
    if (role !== UserRole.ADMIN) where.userId = userId;
    return this.prisma.salesContract.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });
  }

  async getSummary(userId: string, role: string) {
    const where: Prisma.SalesContractWhereInput = { deletedAt: null };
    if (role !== UserRole.ADMIN) where.userId = userId;
    const contracts = await this.prisma.salesContract.findMany({ where });

    const total = contracts.length;
    const ativos = contracts.filter((c) => c.status === SalesContractStatus.ATIVO).length;
    const entregues = contracts.filter((c) => c.status === SalesContractStatus.ENTREGUE).length;
    const totalContratado = contracts
      .filter((c) => c.status !== SalesContractStatus.CANCELADO)
      .reduce((s, c) => s + Number(c.totalValue ?? 0), 0);
    const totalHedge = contracts.filter((c) => c.hedged).length;

    return { total, ativos, entregues, totalContratado, totalHedge };
  }

  async update(id: string, userId: string, role: string, dto: UpdateSalesContractDto) {
    const current = await this.assertOwner(id, userId, role);
    const quantity = dto.quantity ?? Number(current.quantity);
    const pricePerUnit = dto.pricePerUnit ?? Number(current.pricePerUnit);
    const totalValue =
      dto.quantity != null || dto.pricePerUnit != null
        ? quantity * pricePerUnit
        : undefined;

    return this.prisma.salesContract.update({
      where: { id },
      data: {
        ...dto,
        totalValue,
        deliveryDate: dto.deliveryDate ? new Date(dto.deliveryDate) : undefined,
      },
    });
  }

  async remove(id: string, userId: string, role: string) {
    await this.assertOwner(id, userId, role);
    await this.prisma.salesContract.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
    return { success: true };
  }
}
