import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateCarbonProjectDto } from './dto/create-carbon-project.dto';
import { CreateCarbonInventoryDto } from './dto/create-carbon-inventory.dto';
import { IssueCreditsDto } from './dto/issue-credits.dto';
import { TransactCreditsDto } from './dto/transact-credits.dto';
import { UserRole } from '@prisma/client';
import {
  CarbonProjectStatus,
  CarbonCreditStatus,
} from './carbon-enums';

@Injectable()
export class CarbonCreditsService {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private get db(): any { return this.prisma; }

  constructor(private readonly prisma: PrismaService) {}

  // ─── Helpers ──────────────────────────────────────────────────────────────

  private async getProducerProfile(userId: string) {
    const profile = await this.prisma.producerProfile.findUnique({
      where: { userId },
    });
    if (!profile) {
      throw new BadRequestException(
        'Perfil de produtor não encontrado. Complete seu cadastro antes de criar projetos de carbono.',
      );
    }
    return profile;
  }

  private async assertProjectOwner(projectId: string, userId: string, role: string) {
    const project = await this.db.carbonProject.findUnique({
      where: { id: projectId },
      include: { producerProfile: true },
    });
    if (!project || project.deletedAt) throw new NotFoundException('Projeto não encontrado');
    if (role !== UserRole.ADMIN && project.producerProfile.userId !== userId) {
      throw new ForbiddenException('Acesso negado');
    }
    return project;
  }

  // ─── Projects ─────────────────────────────────────────────────────────────

  async createProject(userId: string, dto: CreateCarbonProjectDto) {
    const profile = await this.getProducerProfile(userId);

    const totalRevenue =
      dto.estimatedCreditPrice && dto.projectedReduction
        ? dto.estimatedCreditPrice * dto.projectedReduction * (dto.projectDurationYears ?? 20)
        : null;

    return this.db.carbonProject.create({
      data: {
        producerProfileId: profile.id,
        name: dto.name,
        description: dto.description,
        projectType: dto.projectType,
        standard: dto.standard,
        state: dto.state,
        city: dto.city,
        latitude: dto.latitude,
        longitude: dto.longitude,
        totalAreaHa: dto.totalAreaHa,
        eligibleAreaHa: dto.eligibleAreaHa,
        baselineEmissions: dto.baselineEmissions,
        projectedReduction: dto.projectedReduction,
        projectDurationYears: dto.projectDurationYears ?? 20,
        verificationBody: dto.verificationBody,
        estimatedCreditPrice: dto.estimatedCreditPrice,
        totalEstimatedRevenue: totalRevenue,
      },
    });
  }

  async findAllProjects(
    userId: string,
    role: string,
    page = 1,
    perPage = 10,
  ) {
    const skip = (page - 1) * perPage;
    const where =
      role === UserRole.ADMIN
        ? { deletedAt: null }
        : {
            deletedAt: null,
            producerProfile: { userId },
          };

    const [data, total] = await Promise.all([
      this.db.carbonProject.findMany({
        where,
        skip,
        take: perPage,
        orderBy: { createdAt: 'desc' },
        include: {
          producerProfile: { select: { user: { select: { name: true } } } },
          _count: { select: { credits: true, inventories: true } },
        },
      }),
      this.db.carbonProject.count({ where }),
    ]);

    return { data, meta: { total, page, perPage, totalPages: Math.ceil(total / perPage) } };
  }

  async findProjectById(projectId: string, userId: string, role: string) {
    const project = await this.assertProjectOwner(projectId, userId, role);
    const [inventories, credits] = await Promise.all([
      this.db.carbonInventory.findMany({
        where: { projectId },
        orderBy: { year: 'desc' },
      }),
      this.db.carbonCredit.findMany({
        where: { projectId },
        orderBy: { vintage: 'desc' },
        include: { transactions: true },
      }),
    ]);
    return { ...project, inventories, credits };
  }

  async updateProjectStatus(
    projectId: string,
    userId: string,
    role: string,
    status: CarbonProjectStatus,
  ) {
    await this.assertProjectOwner(projectId, userId, role);
    return this.db.carbonProject.update({
      where: { id: projectId },
      data: { status },
    });
  }

  async deleteProject(projectId: string, userId: string, role: string) {
    await this.assertProjectOwner(projectId, userId, role);
    return this.db.carbonProject.update({
      where: { id: projectId },
      data: { deletedAt: new Date() },
    });
  }

  // ─── Inventory ────────────────────────────────────────────────────────────

  async addInventory(
    projectId: string,
    userId: string,
    role: string,
    dto: CreateCarbonInventoryDto,
  ) {
    await this.assertProjectOwner(projectId, userId, role);

    const netReduction = dto.baselineEmissions - dto.measuredEmissions;
    const leakage = dto.leakage ?? 0;
    const buffer = dto.buffer ?? 0;
    const creditsEligible = Math.max(0, netReduction - leakage - buffer);

    return this.db.carbonInventory.create({
      data: {
        projectId,
        year: dto.year,
        measuredEmissions: dto.measuredEmissions,
        baselineEmissions: dto.baselineEmissions,
        netReduction,
        leakage,
        buffer,
        creditsEligible,
        methodology: dto.methodology,
        verifiedBy: dto.verifiedBy,
      },
    });
  }

  async getInventories(projectId: string, userId: string, role: string) {
    await this.assertProjectOwner(projectId, userId, role);
    return this.db.carbonInventory.findMany({
      where: { projectId },
      orderBy: { year: 'desc' },
    });
  }

  // ─── Credits ──────────────────────────────────────────────────────────────

  async issueCredits(
    projectId: string,
    userId: string,
    role: string,
    dto: IssueCreditsDto,
  ) {
    const project = await this.assertProjectOwner(projectId, userId, role);

    if (
      ![
        CarbonProjectStatus.VALIDATED,
        CarbonProjectStatus.REGISTERED,
        CarbonProjectStatus.MONITORING,
        CarbonProjectStatus.VERIFIED,
        CarbonProjectStatus.ACTIVE,
      ].includes(project.status as CarbonProjectStatus)
    ) {
      throw new BadRequestException(
        'O projeto precisa estar validado/registrado para emitir créditos.',
      );
    }

    const totalValue =
      dto.pricePerCredit ? dto.quantity * dto.pricePerCredit : null;

    return this.db.carbonCredit.create({
      data: {
        projectId,
        vintage: dto.vintage,
        quantity: dto.quantity,
        serialNumber: dto.serialNumber,
        pricePerCredit: dto.pricePerCredit,
        totalValue,
        status: CarbonCreditStatus.ISSUED,
        issuedAt: new Date(),
      },
    });
  }

  async getCredits(projectId: string, userId: string, role: string) {
    await this.assertProjectOwner(projectId, userId, role);
    return this.db.carbonCredit.findMany({
      where: { projectId },
      orderBy: { vintage: 'desc' },
      include: { transactions: { orderBy: { transactionDate: 'desc' } } },
    });
  }

  async transactCredit(
    creditId: string,
    userId: string,
    role: string,
    dto: TransactCreditsDto,
  ) {
    const credit = await this.db.carbonCredit.findUnique({
      where: { id: creditId },
      include: { project: { include: { producerProfile: true } } },
    });
    if (!credit) throw new NotFoundException('Crédito não encontrado');
    if (
      role !== UserRole.ADMIN &&
      credit.project.producerProfile.userId !== userId
    ) {
      throw new ForbiddenException('Acesso negado');
    }
    if (credit.status === CarbonCreditStatus.RETIRED) {
      throw new BadRequestException('Crédito já foi aposentado.');
    }
    if (credit.status === CarbonCreditStatus.CANCELLED) {
      throw new BadRequestException('Crédito cancelado não pode ser transacionado.');
    }

    const totalValue =
      dto.pricePerCredit ? dto.quantity * dto.pricePerCredit : null;

    const [transaction, updatedCredit] = await this.prisma.$transaction([
      this.db.carbonTransaction.create({
        data: {
          creditId,
          type: dto.type,
          quantity: dto.quantity,
          pricePerCredit: dto.pricePerCredit,
          totalValue,
          buyerName: dto.buyerName,
          buyerDocument: dto.buyerDocument,
          notes: dto.notes,
        },
      }),
      this.db.carbonCredit.update({
        where: { id: creditId },
        data: {
          status:
            dto.type === 'RETIREMENT'
              ? CarbonCreditStatus.RETIRED
              : dto.type === 'CANCELLATION'
              ? CarbonCreditStatus.CANCELLED
              : dto.type === 'TRANSFER'
              ? CarbonCreditStatus.TRANSFERRED
              : credit.status,
          retiredAt: dto.type === 'RETIREMENT' ? new Date() : undefined,
          retirementReason: dto.type === 'RETIREMENT' ? dto.notes : undefined,
          retiredByEntity: dto.type === 'RETIREMENT' ? dto.buyerName : undefined,
          pricePerCredit: dto.pricePerCredit ?? credit.pricePerCredit,
          totalValue: totalValue ?? credit.totalValue,
        },
      }),
    ]);

    return { transaction, credit: updatedCredit };
  }

  // ─── Dashboard / Summary ──────────────────────────────────────────────────

  async getDashboardSummary(userId: string, role: string) {
    const where =
      role === UserRole.ADMIN
        ? { deletedAt: null }
        : { deletedAt: null, producerProfile: { userId } };

    const [projects, credits] = await Promise.all([
      this.db.carbonProject.findMany({
        where,
        select: {
          id: true,
          name: true,
          status: true,
          projectType: true,
          standard: true,
          eligibleAreaHa: true,
          projectedReduction: true,
          estimatedCreditPrice: true,
          totalEstimatedRevenue: true,
          _count: { select: { credits: true } },
        },
      }),
      this.db.carbonCredit.findMany({
        where: { project: where },
        select: {
          quantity: true,
          status: true,
          totalValue: true,
          vintage: true,
        },
      }),
    ]);

    const totalProjects = projects.length;
    const activeProjects = (projects as any[]).filter(
      (p: any) =>
        ![
          CarbonProjectStatus.DRAFT,
          CarbonProjectStatus.CANCELLED,
          CarbonProjectStatus.COMPLETED,
        ].includes(p.status as CarbonProjectStatus),
    ).length;

    const totalCreditsIssued = (credits as any[])
      .filter((c: any) => c.status === CarbonCreditStatus.ISSUED)
      .reduce((sum: number, c: any) => sum + Number(c.quantity), 0);

    const totalCreditsRetired = (credits as any[])
      .filter((c: any) => c.status === CarbonCreditStatus.RETIRED)
      .reduce((sum: number, c: any) => sum + Number(c.quantity), 0);

    const totalRevenueEstimated = (projects as any[]).reduce(
      (sum: number, p: any) => sum + Number(p.totalEstimatedRevenue ?? 0),
      0,
    );

    const totalCO2Projected = (projects as any[]).reduce(
      (sum: number, p: any) => sum + Number(p.projectedReduction),
      0,
    );

    return {
      totalProjects,
      activeProjects,
      totalCreditsIssued,
      totalCreditsRetired,
      totalRevenueEstimated,
      totalCO2ProjectedPerYear: totalCO2Projected,
      projects,
    };
  }

  // ─── Market price reference (mock) ────────────────────────────────────────
  async getMarketPrices() {
    // Referências de mercado (dados ilustrativos — em produção integrar com API externa)
    return {
      updatedAt: new Date().toISOString(),
      note: 'Preços de referência ilustrativos. Integre com Verra, Gold Standard ou B3 para dados reais.',
      prices: [
        { standard: 'VERRA_VCS', type: 'Agricultura/Pastagem', priceUSD: 12, priceBRL: 60 },
        { standard: 'VERRA_VCS', type: 'Floresta/REDD+', priceUSD: 18, priceBRL: 90 },
        { standard: 'GOLD_STANDARD', type: 'Energia Renovável', priceUSD: 25, priceBRL: 125 },
        { standard: 'CERRADO_PROTOCOL', type: 'Cerrado', priceUSD: 15, priceBRL: 75 },
        { standard: 'ABC_PLUS', type: 'Baixo Carbono Agro', priceUSD: 10, priceBRL: 50 },
      ],
    };
  }
}
