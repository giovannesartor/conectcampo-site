import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import {
  UserRole,
  Prisma,
  GrainListingStatus,
  GrainListingType,
} from '@prisma/client';
import {
  CreateGrainListingDto,
  UpdateGrainListingDto,
} from './dto/grain-listing.dto';

@Injectable()
export class MarketplaceService {
  constructor(private readonly prisma: PrismaService) {}

  private async assertOwner(id: string, userId: string, role: string) {
    const listing = await this.prisma.grainListing.findUnique({ where: { id } });
    if (!listing || listing.deletedAt) throw new NotFoundException('Oferta não encontrada');
    if (role !== UserRole.ADMIN && listing.userId !== userId) {
      throw new ForbiddenException('Acesso negado');
    }
    return listing;
  }

  async create(userId: string, dto: CreateGrainListingDto) {
    return this.prisma.grainListing.create({
      data: {
        userId,
        type: dto.type ?? GrainListingType.VENDA,
        product: dto.product,
        cropType: dto.cropType,
        quantity: dto.quantity,
        unit: dto.unit,
        pricePerUnit: dto.pricePerUnit,
        state: dto.state,
        city: dto.city,
        safra: dto.safra,
        availableFrom: dto.availableFrom ? new Date(dto.availableFrom) : undefined,
        description: dto.description,
        contactPhone: dto.contactPhone,
      },
    });
  }

  /** Vitrine pública: todas as ofertas ativas de todos os produtores. */
  async browse(filters: { type?: string; product?: string; state?: string }) {
    const where: Prisma.GrainListingWhereInput = {
      deletedAt: null,
      status: GrainListingStatus.ATIVA,
    };
    if (filters.type) where.type = filters.type as GrainListingType;
    if (filters.product) where.product = { contains: filters.product, mode: 'insensitive' };
    if (filters.state) where.state = filters.state as any;

    const listings = await this.prisma.grainListing.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: 100,
      include: { user: { select: { id: true, name: true } } },
    });

    // Reputação do vendedor (média/total de avaliações) para exibir na vitrine.
    const sellerIds = Array.from(new Set(listings.map((l) => l.userId)));
    const reputation = sellerIds.length
      ? await this.prisma.marketplaceReview.groupBy({
          by: ['ratedId'],
          where: { ratedId: { in: sellerIds } },
          _avg: { rating: true },
          _count: { rating: true },
        })
      : [];
    const repMap: Record<string, { average: number; count: number }> = {};
    for (const r of reputation) {
      repMap[r.ratedId] = {
        average: Math.round((r._avg.rating ?? 0) * 100) / 100,
        count: r._count.rating,
      };
    }

    return listings.map((l) => ({
      ...l,
      sellerRating: repMap[l.userId] ?? { average: 0, count: 0 },
    }));
  }

  async findMine(userId: string, role: string) {
    const where: Prisma.GrainListingWhereInput = { deletedAt: null };
    if (role !== UserRole.ADMIN) where.userId = userId;
    return this.prisma.grainListing.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });
  }

  async update(id: string, userId: string, role: string, dto: UpdateGrainListingDto) {
    await this.assertOwner(id, userId, role);
    return this.prisma.grainListing.update({
      where: { id },
      data: {
        ...dto,
        availableFrom: dto.availableFrom ? new Date(dto.availableFrom) : undefined,
      },
    });
  }

  async remove(id: string, userId: string, role: string) {
    await this.assertOwner(id, userId, role);
    await this.prisma.grainListing.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
    return { success: true };
  }
}
