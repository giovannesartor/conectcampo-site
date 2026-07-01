import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import axios from 'axios';
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
    const project = await this.prisma.carbonProject.findUnique({
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

    return this.prisma.carbonProject.create({
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
      this.prisma.carbonProject.findMany({
        where,
        skip,
        take: perPage,
        orderBy: { createdAt: 'desc' },
        include: {
          producerProfile: { select: { user: { select: { name: true } } } },
          _count: { select: { credits: true, inventories: true } },
        },
      }),
      this.prisma.carbonProject.count({ where }),
    ]);

    return { data, meta: { total, page, perPage, totalPages: Math.ceil(total / perPage) } };
  }

  async findProjectById(projectId: string, userId: string, role: string) {
    const project = await this.assertProjectOwner(projectId, userId, role);
    const [inventories, credits] = await Promise.all([
      this.prisma.carbonInventory.findMany({
        where: { projectId },
        orderBy: { year: 'desc' },
      }),
      this.prisma.carbonCredit.findMany({
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
    return this.prisma.carbonProject.update({
      where: { id: projectId },
      data: { status },
    });
  }

  async deleteProject(projectId: string, userId: string, role: string) {
    await this.assertProjectOwner(projectId, userId, role);
    return this.prisma.carbonProject.update({
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

    return this.prisma.carbonInventory.create({
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
    return this.prisma.carbonInventory.findMany({
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

    return this.prisma.carbonCredit.create({
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
    return this.prisma.carbonCredit.findMany({
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
    const credit = await this.prisma.carbonCredit.findUnique({
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
      this.prisma.carbonTransaction.create({
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
      this.prisma.carbonCredit.update({
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
      this.prisma.carbonProject.findMany({
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
      this.prisma.carbonCredit.findMany({
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
    const user = await this.prisma.user.findUnique({
      where: { id: project.producerProfile.userId },
      select: { name: true, email: true, cpf: true, cnpj: true, phone: true },
    });

    if (!user) throw new NotFoundException('Usuário não encontrado');

    let paymentId: string | null = null;
    let invoiceUrl: string | null = null;

    try {
      // Obtém ou cria o cliente Asaas (reusa o mesmo ID do subscription, se existir)
      const subscription = await this.prisma.subscription.findFirst({
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
          cpfCnpj: user.cpf ?? user.cnpj ?? '00000000000',
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
    const updated = await this.prisma.carbonProject.update({
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
    const project = await this.prisma.carbonProject.findUnique({ where: { id: projectId } });
    if (!project) throw new NotFoundException('Projeto não encontrado');

    return this.prisma.carbonProject.update({
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
    return this.prisma.carbonProject.update({
      where: { id: projectId },
      data: { setupFeeStatus: 'WAIVED' },
    });
  }

  // ─── Preços de mercado (dados reais via Carbonmark + câmbio) ───────────────
  async getMarketPrices(): Promise<MarketPricesResult> {
    if (marketCache && Date.now() - marketCache.at < MARKET_TTL_MS) {
      return marketCache.data;
    }

    try {
      const fx = await this.getUsdBrl();

      // Categorias relevantes (mercado voluntário on-chain, endpoint público sem chave)
      const CATEGORIES = [
        'Renewable Energy',
        'Forestry and Land Use',
        'Agriculture',
        'Waste Management',
        'Energy Efficiency',
      ];
      const responses = await Promise.allSettled(
        CATEGORIES.map((category) =>
          axios.get('https://api.carbonmark.com/carbonProjects', {
            params: { country: 'Brazil', category },
            headers: { Accept: 'application/json' },
            timeout: 10000,
          }),
        ),
      );

      // Agrega por categoria, apenas projetos com preço e oferta ativa
      const byCat = new Map<string, { registry: string; sum: number; n: number; min: number }>();
      for (const r of responses) {
        if (r.status !== 'fulfilled') continue;
        const items: any[] = r.value.data?.items ?? (Array.isArray(r.value.data) ? r.value.data : []);
        for (const p of items) {
          const price = parseFloat(p?.price);
          if (!price || price <= 0 || !p?.hasSupply) continue;
          const cat = p?.methodologies?.[0]?.category || 'Outros';
          const cur = byCat.get(cat) ?? { registry: p?.registry || 'VCS', sum: 0, n: 0, min: price };
          cur.sum += price;
          cur.n += 1;
          cur.min = Math.min(cur.min, price);
          byCat.set(cat, cur);
        }
      }

      const CAT_PT: Record<string, string> = {
        'Renewable Energy': 'Energia Renovável',
        'Forestry and Land Use': 'Florestas e Uso da Terra',
        Agriculture: 'Agricultura',
        'Waste Management': 'Resíduos',
        'Energy Efficiency': 'Eficiência Energética',
      };

      const prices = Array.from(byCat.entries())
        .map(([type, v]) => {
          const usd = v.sum / v.n;
          return {
            standard: v.registry,
            type: CAT_PT[type] ?? type,
            priceUSD: Number(usd.toFixed(2)),
            priceBRL: Number((usd * fx).toFixed(2)),
            projects: v.n,
          };
        })
        .sort((a, b) => b.projects - a.projects)
        .slice(0, 8);

      if (prices.length === 0) throw new Error('nenhum projeto com preço/oferta');

      const result = {
        source: 'Carbonmark — mercado voluntário (projetos no Brasil)',
        updatedAt: new Date().toISOString(),
        usdBrl: Number(fx.toFixed(4)),
        note:
          'Preços reais de listagens/pools de créditos tokenizados (Carbonmark), projetos localizados no Brasil, ' +
          'com câmbio USD→BRL em tempo real. Créditos premium OTC/registro direto podem ter valores diferentes.',
        prices,
      };
      marketCache = { at: Date.now(), data: result };
      this.logger.log(`Preços de carbono atualizados (Carbonmark): ${prices.length} categorias, USD/BRL ${fx.toFixed(2)}`);
      return result;
    } catch (e) {
      this.logger.warn(`Falha ao obter preços reais de carbono — usando referência. (${(e as Error).message})`);
      if (marketCache) return marketCache.data; // último sucesso conhecido
      return this.referenceMarketPrices();
    }
  }

  /** Câmbio USD→BRL em tempo real (fonte pública gratuita), com fallback. */
  private async getUsdBrl(): Promise<number> {
    const fallback = Number(process.env.CARBON_USD_BRL) || 5.4;
    try {
      const { data } = await axios.get('https://open.er-api.com/v6/latest/USD', { timeout: 8000 });
      const brl = data?.rates?.BRL;
      return typeof brl === 'number' && brl > 0 ? brl : fallback;
    } catch {
      return fallback;
    }
  }

  /** Fallback ilustrativo quando a fonte externa está indisponível. */
  private referenceMarketPrices(): MarketPricesResult {
    return {
      source: 'Referência ilustrativa (fonte externa indisponível)',
      updatedAt: new Date().toISOString(),
      note: 'Não foi possível obter preços reais agora — exibindo referência ilustrativa.',
      prices: [
        { standard: 'VERRA_VCS', type: 'Agricultura/Pastagem', priceUSD: 12, priceBRL: 60 },
        { standard: 'VERRA_VCS', type: 'Floresta/REDD+', priceUSD: 18, priceBRL: 90 },
        { standard: 'GOLD_STANDARD', type: 'Energia Renovável', priceUSD: 25, priceBRL: 125 },
      ],
    };
  }
}

// Tipos e cache dos preços de mercado (TTL 6h)
export interface MarketPriceRow {
  standard: string;
  type: string;
  priceUSD: number;
  priceBRL: number;
  projects?: number;
}
export interface MarketPricesResult {
  source: string;
  updatedAt: string;
  usdBrl?: number;
  note: string;
  prices: MarketPriceRow[];
}
let marketCache: { at: number; data: MarketPricesResult } | null = null;
const MARKET_TTL_MS = 6 * 60 * 60 * 1000;
