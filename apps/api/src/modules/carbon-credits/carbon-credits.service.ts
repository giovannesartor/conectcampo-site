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

      // Categorias reais do Carbonmark (mercado voluntário on-chain, endpoint público sem chave)
      const CAT_PT: Record<string, string> = {
        'Renewable Energy': 'Energia Renovável',
        Forestry: 'Florestas / REDD+',
        Agriculture: 'Agricultura',
        'Blue Carbon': 'Carbono Azul',
        Biochar: 'Biochar',
        'Energy Efficiency': 'Eficiência Energética',
        'Waste Disposal': 'Resíduos',
        'Industrial Processing': 'Processos Industriais',
        Other: 'Outros',
      };
      const CATEGORIES = Object.keys(CAT_PT);

      // Busca global por categoria (mercado completo). Só precisamos de price/registry/country/supply.
      const responses = await Promise.allSettled(
        CATEGORIES.map((category) =>
          axios.get('https://api.carbonmark.com/carbonProjects', {
            params: { category, limit: 500 },
            headers: { Accept: 'application/json' },
            timeout: 20000,
          }),
        ),
      );

      interface Agg {
        registryCount: Record<string, number>;
        sum: number;
        n: number;
        min: number;
        max: number;
        brazil: number;
      }
      const byCat = new Map<string, Agg>();
      let totalProjects = 0;

      CATEGORIES.forEach((category, i) => {
        const r = responses[i];
        if (r.status !== 'fulfilled') return;
        const items: any[] = r.value.data?.items ?? (Array.isArray(r.value.data) ? r.value.data : []);
        for (const p of items) {
          const price = parseFloat(p?.price);
          if (!price || price <= 0 || !p?.hasSupply) continue;
          const cur =
            byCat.get(category) ??
            ({ registryCount: {}, sum: 0, n: 0, min: price, max: price, brazil: 0 } as Agg);
          const reg = p?.registry || 'VCS';
          cur.registryCount[reg] = (cur.registryCount[reg] ?? 0) + 1;
          cur.sum += price;
          cur.n += 1;
          cur.min = Math.min(cur.min, price);
          cur.max = Math.max(cur.max, price);
          if (p?.country === 'Brazil') cur.brazil += 1;
          byCat.set(category, cur);
          totalProjects += 1;
        }
      });

      const prices = Array.from(byCat.entries())
        .map(([category, v]) => {
          const usd = v.sum / v.n;
          const registry =
            Object.entries(v.registryCount).sort((a, b) => b[1] - a[1])[0]?.[0] ?? 'VCS';
          return {
            standard: registry,
            type: CAT_PT[category] ?? category,
            priceUSD: Number(usd.toFixed(2)),
            priceBRL: Number((usd * fx).toFixed(2)),
            minUSD: Number(v.min.toFixed(2)),
            maxUSD: Number(v.max.toFixed(2)),
            projects: v.n,
            brazil: v.brazil,
          };
        })
        .sort((a, b) => b.projects - a.projects);

      if (prices.length === 0) throw new Error('nenhum projeto com preço/oferta');

      const avgUsd = prices.reduce((s, p) => s + p.priceUSD * p.projects, 0) / totalProjects;
      const brazilTotal = prices.reduce((s, p) => s + p.brazil, 0);

      const result: MarketPricesResult = {
        source: 'Carbonmark — mercado voluntário',
        updatedAt: new Date().toISOString(),
        usdBrl: Number(fx.toFixed(4)),
        summary: {
          categories: prices.length,
          projects: totalProjects,
          brazilProjects: brazilTotal,
          avgUSD: Number(avgUsd.toFixed(2)),
          avgBRL: Number((avgUsd * fx).toFixed(2)),
        },
        note:
          'Preços reais de créditos com oferta ativa no mercado voluntário on-chain (Carbonmark), ' +
          'agregados por categoria, com câmbio USD→BRL em tempo real. Créditos premium negociados em ' +
          'balcão (OTC) ou direto no registro podem ter valores superiores.',
        prices,
      };
      marketCache = { at: Date.now(), data: result };
      this.logger.log(
        `Preços de carbono atualizados (Carbonmark): ${prices.length} categorias, ${totalProjects} projetos, USD/BRL ${fx.toFixed(2)}`,
      );
      return result;
    } catch (e) {
      this.logger.warn(`Falha ao obter preços reais de carbono — usando referência. (${(e as Error).message})`);
      if (marketCache) return marketCache.data; // último sucesso conhecido
      return this.referenceMarketPrices();
    }
  }

  /** Projetos brasileiros em destaque com imagem de satélite (Carbonmark). */
  async getFeaturedProjects() {
    if (featuredCache && Date.now() - featuredCache.at < MARKET_TTL_MS) {
      return featuredCache.data;
    }
    try {
      const { data } = await axios.get('https://api.carbonmark.com/carbonProjects', {
        params: { country: 'Brazil', limit: 60 },
        headers: { Accept: 'application/json' },
        timeout: 15000,
      });
      const items: any[] = data?.items ?? (Array.isArray(data) ? data : []);
      const projects = items
        .filter((p) => p?.satelliteImage?.url)
        .slice(0, 6)
        .map((p) => ({
          key: p.key,
          name: p.name,
          registry: p.registry ?? 'VCS',
          category: p?.methodologies?.[0]?.category ?? '—',
          region: p.region ?? null,
          image: p.satelliteImage.url as string,
          url: p.url ?? null,
          priceUSD: parseFloat(p.price) > 0 ? Number(parseFloat(p.price).toFixed(2)) : null,
          hasSupply: !!p.hasSupply,
        }));
      const result = { updatedAt: new Date().toISOString(), projects };
      featuredCache = { at: Date.now(), data: result };
      return result;
    } catch (e) {
      this.logger.warn(`Falha ao buscar projetos em destaque: ${(e as Error).message}`);
      return featuredCache?.data ?? { updatedAt: new Date().toISOString(), projects: [] };
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
  minUSD?: number;
  maxUSD?: number;
  projects?: number;
  brazil?: number;
}
export interface MarketPricesResult {
  source: string;
  updatedAt: string;
  usdBrl?: number;
  note: string;
  summary?: {
    categories: number;
    projects: number;
    brazilProjects: number;
    avgUSD: number;
    avgBRL: number;
  };
  prices: MarketPriceRow[];
}
let marketCache: { at: number; data: MarketPricesResult } | null = null;
let featuredCache: { at: number; data: { updatedAt: string; projects: unknown[] } } | null = null;
const MARKET_TTL_MS = 6 * 60 * 60 * 1000;
