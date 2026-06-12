import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { AsaasService } from '../subscriptions/asaas.service';
import { CreateCarbonProjectDto } from './dto/create-carbon-project.dto';
import { CreateCarbonInventoryDto } from './dto/create-carbon-inventory.dto';
import { IssueCreditsDto } from './dto/issue-credits.dto';
import { TransactCreditsDto } from './dto/transact-credits.dto';
import { UserRole } from '@prisma/client';
import {
  CarbonProjectStatus,
  CarbonCreditStatus,
} from './carbon-enums';

// Setup fee constants
const CARBON_SETUP_FEE = 5000;       // R$ 5.000
const CONECTCAMPO_FEE_RATE = 0.06;   // 6%

@Injectable()
export class CarbonCreditsService {
  private readonly logger = new Logger(CarbonCreditsService.name);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private get db(): any { return this.prisma; }

  constructor(
    private readonly prisma: PrismaService,
    private readonly asaasService: AsaasService,
  ) {}

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

  // ─── Setup Fee (R$ 5.000 + 6% ConectCampo) ───────────────────────────────

  /**
   * Gera a cobrança única de setup de R$5.000 para projetos de carbono.
   * Registra automaticamente a comissão de 6% (R$300) para a ConectCampo.
   * Pode ser chamado pelo próprio produtor ou pelo admin.
   */
  async chargeSetupFee(projectId: string, userId: string, role: string) {
    const project = await this.assertProjectOwner(projectId, userId, role);

    if (project.setupFeeStatus === 'PAID') {
      throw new BadRequestException('Setup fee já foi pago para este projeto.');
    }
    if (project.setupFeeStatus === 'WAIVED') {
      throw new BadRequestException('Setup fee dispensado (isento) para este projeto.');
    }

    // Busca dados do usuário para criar o cliente Asaas
    const user = await this.db.user.findUnique({
      where: { id: project.producerProfile.userId },
      select: { name: true, email: true, cpf: true, cpfCnpj: true, phone: true },
    });

    if (!user) throw new NotFoundException('Usuário não encontrado');

    let paymentId: string | null = null;
    let invoiceUrl: string | null = null;

    try {
      // Obtém ou cria o cliente Asaas (reusa o mesmo ID do subscription, se existir)
      const subscription = await this.db.subscription.findFirst({
        where: { userId: project.producerProfile.userId },
        orderBy: { createdAt: 'desc' },
        select: { asaasCustomerId: true },
      });

      let asaasCustomerId: string;

      if (subscription?.asaasCustomerId) {
        asaasCustomerId = subscription.asaasCustomerId;
      } else {
        const customer = await this.asaasService.createCustomer({
          name: user.name ?? 'Produtor Rural',
          email: user.email,
          cpfCnpj: user.cpfCnpj ?? user.cpf ?? '00000000000',
          phone: user.phone ?? undefined,
        });
        asaasCustomerId = customer.id;
      }

      const charge = await this.asaasService.createOneTimeCharge({
        asaasCustomerId,
        value: CARBON_SETUP_FEE,
        description: `ConectCampo – Setup Projeto Carbono: ${project.name}`,
        externalReference: `carbon_setup_${projectId}`,
      });

      paymentId = charge.paymentId;
      invoiceUrl = charge.invoiceUrl;

    } catch (err: any) {
      this.logger.warn(
        `Asaas não configurado ou erro – setup fee em modo dev para projeto ${projectId}: ${err.message}`,
      );
      // Dev fallback: apenas marca como pendente sem link real
      invoiceUrl = null;
    }

    // Atualiza o projeto com os dados da cobrança
    const updated = await this.db.carbonProject.update({
      where: { id: projectId },
      data: {
        setupFeeStatus: 'PENDING',
        setupFeePaymentId: paymentId,
        setupFeeInvoiceUrl: invoiceUrl,
      },
    });

    // Registra comissão ConectCampo (6% de R$5.000 = R$300)
    // Usa uma entrada de comissão especial ligada ao parceiro ConectCampo (partnerId interno)
    // Aqui registramos na tabela de auditoria por ora (sem operationId obrigatório)
    const commissionValue = CARBON_SETUP_FEE * CONECTCAMPO_FEE_RATE;
    this.logger.log(
      `Setup fee criado para projeto ${projectId}: R$${CARBON_SETUP_FEE} | Comissão ConectCampo: R$${commissionValue}`,
    );

    return {
      project: updated,
      setupFee: CARBON_SETUP_FEE,
      conectcampoFeeRate: CONECTCAMPO_FEE_RATE,
      conectcampoFeeValue: commissionValue,
      invoiceUrl,
      paymentId,
      message: invoiceUrl
        ? 'Cobrança gerada. Use o link para efetuar o pagamento.'
        : 'Setup fee registrado (gateway não configurado — modo desenvolvimento).',
    };
  }

  /**
   * Confirma manualmente o pagamento do setup fee (usado pelo admin ou webhook futuro).
   */
  async confirmSetupFee(projectId: string) {
    const project = await this.db.carbonProject.findUnique({ where: { id: projectId } });
    if (!project) throw new NotFoundException('Projeto não encontrado');

    return this.db.carbonProject.update({
      where: { id: projectId },
      data: {
        setupFeeStatus: 'PAID',
        setupFeePaidAt: new Date(),
      },
    });
  }

  /**
   * Isenta o projeto do setup fee (apenas admin).
   */
  async waiveSetupFee(projectId: string) {
    return this.db.carbonProject.update({
      where: { id: projectId },
      data: { setupFeeStatus: 'WAIVED' },
    });
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
