import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../../prisma/prisma.service';
import { ValsaService } from '../subscriptions/valsa.service';
import { NotificationsService } from '../notifications/notifications.service';
import {
  UserRole,
  Prisma,
  MarketplaceOrderStatus,
  GrainListingStatus,
  GrainListingType,
} from '@prisma/client';
import { CreateOrderDto } from './dto/order.dto';

/** Taxa ConectCampo: 1% total, dividida em 0,5% para cada parte. */
export const PLATFORM_FEE_RATE = 0.01;
export const PARTY_FEE_RATE = 0.005;

/** Dias após o envio para liberar automaticamente ao vendedor (sem contestação). */
const AUTO_CONFIRM_DAYS = Number(process.env.MARKETPLACE_AUTO_CONFIRM_DAYS ?? 7);

@Injectable()
export class MarketplaceOrdersService {
  private readonly logger = new Logger(MarketplaceOrdersService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly valsa: ValsaService,
    private readonly notifications: NotificationsService,
  ) {}

  private round(n: number): number {
    return Math.round(n * 100) / 100;
  }

  private inStatus(status: MarketplaceOrderStatus, allowed: MarketplaceOrderStatus[]): boolean {
    return allowed.includes(status);
  }

  private notify(userId: string, title: string, message: string) {
    this.notifications
      .create({ userId, type: 'MARKETPLACE', title, message, link: '/dashboard/marketplace' })
      .catch(() => null);
  }

  /** Retorna o detalhamento de taxas para um subtotal (usado no "como funciona"/preview). */
  computeFees(subtotal: number) {
    const buyerFee = this.round(subtotal * PARTY_FEE_RATE);
    const sellerFee = this.round(subtotal * PARTY_FEE_RATE);
    return {
      subtotal: this.round(subtotal),
      buyerFee,
      sellerFee,
      platformFee: this.round(buyerFee + sellerFee),
      buyerTotal: this.round(subtotal + buyerFee),
      sellerNet: this.round(subtotal - sellerFee),
      feeRatePct: PLATFORM_FEE_RATE * 100,
      partyRatePct: PARTY_FEE_RATE * 100,
    };
  }

  // ─── Criação do pedido + checkout ─────────────────────────────────────────────

  async createOrder(buyerId: string, dto: CreateOrderDto) {
    const listing = await this.prisma.grainListing.findUnique({
      where: { id: dto.listingId },
      include: { user: { select: { id: true, email: true } } },
    });
    if (!listing || listing.deletedAt) throw new NotFoundException('Oferta não encontrada');
    if (listing.type !== GrainListingType.VENDA) {
      throw new BadRequestException('Só é possível comprar ofertas do tipo VENDA');
    }
    if (listing.status !== GrainListingStatus.ATIVA) {
      throw new BadRequestException('Oferta não está ativa');
    }
    if (listing.userId === buyerId) {
      throw new BadRequestException('Você não pode comprar sua própria oferta');
    }
    if (listing.pricePerUnit == null) {
      throw new BadRequestException('Oferta sem preço definido — negocie diretamente com o vendedor');
    }
    if (dto.quantity > Number(listing.quantity)) {
      throw new BadRequestException('Quantidade acima do disponível na oferta');
    }

    const unitPrice = Number(listing.pricePerUnit);
    const subtotal = this.round(unitPrice * dto.quantity);
    const fees = this.computeFees(subtotal);

    const order = await this.prisma.marketplaceOrder.create({
      data: {
        listingId: listing.id,
        buyerId,
        sellerId: listing.userId,
        product: listing.product,
        quantity: dto.quantity,
        unit: listing.unit,
        unitPrice,
        subtotal,
        buyerFee: fees.buyerFee,
        sellerFee: fees.sellerFee,
        platformFee: fees.platformFee,
        buyerTotal: fees.buyerTotal,
        sellerNet: fees.sellerNet,
        status: MarketplaceOrderStatus.AGUARDANDO_PAGAMENTO,
      },
    });

    // Checkout ValsaPay (sem taxas de gateway) — comprador paga buyerTotal.
    const buyer = await this.prisma.user.findUnique({
      where: { id: buyerId },
      select: { email: true },
    });
    const { invoiceUrl } = this.valsa.buildGenericCheckoutUrl({
      amount: fees.buyerTotal,
      description: `Compra: ${listing.product} (${dto.quantity} ${listing.unit})`,
      metadata: { type: 'marketplace', orderId: order.id, source: 'ConectCampo' },
      email: buyer?.email,
    });

    const updated = await this.prisma.marketplaceOrder.update({
      where: { id: order.id },
      data: { paymentUrl: invoiceUrl },
    });

    return { order: updated, paymentUrl: invoiceUrl };
  }

  // ─── Confirmação de pagamento (via webhook) ───────────────────────────────────

  /** Idempotente: chamado pelo webhook da Valsa quando o pagamento é confirmado. */
  async confirmPayment(orderId: string, valsaPaymentId?: string): Promise<boolean> {
    const order = await this.prisma.marketplaceOrder.findUnique({ where: { id: orderId } });
    if (!order) {
      this.logger.warn(`Marketplace webhook: pedido ${orderId} não encontrado`);
      return false;
    }
    if (order.status !== MarketplaceOrderStatus.AGUARDANDO_PAGAMENTO) {
      this.logger.log(`Pedido ${orderId} já processado (status ${order.status}) — ignorando`);
      return true;
    }
    await this.prisma.marketplaceOrder.update({
      where: { id: orderId },
      data: {
        status: MarketplaceOrderStatus.PAGO_EM_CUSTODIA,
        paidAt: new Date(),
        valsaPaymentId,
      },
    });
    this.logger.log(`Pedido ${orderId} pago e em custódia (escrow)`);
    this.notify(order.sellerId, 'Pagamento recebido (em custódia)', `O comprador pagou "${order.product}". Envie o produto e marque como enviado para prosseguir.`);
    this.notify(order.buyerId, 'Pagamento confirmado', `Seu pagamento de "${order.product}" está em custódia segura até a entrega.`);
    return true;
  }

  // ─── Consultas ────────────────────────────────────────────────────────────────

  async getOwned(id: string, userId: string, role: string) {
    const order = await this.prisma.marketplaceOrder.findUnique({
      where: { id },
      include: {
        buyer: { select: { id: true, name: true } },
        seller: { select: { id: true, name: true } },
      },
    });
    if (!order) throw new NotFoundException('Pedido não encontrado');
    if (role !== UserRole.ADMIN && order.buyerId !== userId && order.sellerId !== userId) {
      throw new ForbiddenException('Acesso negado');
    }
    return order;
  }

  async listMine(userId: string) {
    const [purchases, sales] = await Promise.all([
      this.prisma.marketplaceOrder.findMany({
        where: { buyerId: userId },
        orderBy: { createdAt: 'desc' },
        include: { seller: { select: { id: true, name: true } }, reviews: { select: { raterId: true } } },
      }),
      this.prisma.marketplaceOrder.findMany({
        where: { sellerId: userId },
        orderBy: { createdAt: 'desc' },
        include: { buyer: { select: { id: true, name: true } }, reviews: { select: { raterId: true } } },
      }),
    ]);

    const counterpartIds = Array.from(
      new Set([...purchases.map((o) => o.sellerId), ...sales.map((o) => o.buyerId)]),
    );
    const repMap = await this.getReputationMap(counterpartIds);

    const mapOrder = (o: any, counterpartId: string) => ({
      ...o,
      reviewed: o.reviews.some((r: { raterId: string }) => r.raterId === userId),
      counterpartRating: repMap[counterpartId] ?? { average: 0, count: 0 },
    });

    return {
      purchases: purchases.map((o) => mapOrder(o, o.sellerId)),
      sales: sales.map((o) => mapOrder(o, o.buyerId)),
    };
  }

  async summary(userId: string) {
    const orders = await this.prisma.marketplaceOrder.findMany({
      where: { OR: [{ buyerId: userId }, { sellerId: userId }] },
    });
    const held = orders
      .filter((o) => o.sellerId === userId && this.inStatus(o.status, [MarketplaceOrderStatus.PAGO_EM_CUSTODIA, MarketplaceOrderStatus.ENVIADO]))
      .reduce((s, o) => s + Number(o.sellerNet), 0);
    const received = orders
      .filter((o) => o.sellerId === userId && this.inStatus(o.status, [MarketplaceOrderStatus.RECEBIDO_LIBERADO, MarketplaceOrderStatus.REPASSADO]))
      .reduce((s, o) => s + Number(o.sellerNet), 0);
    const spent = orders
      .filter((o) => o.buyerId === userId && o.status !== MarketplaceOrderStatus.AGUARDANDO_PAGAMENTO && o.status !== MarketplaceOrderStatus.CANCELADO)
      .reduce((s, o) => s + Number(o.buyerTotal), 0);
    return {
      totalPurchases: orders.filter((o) => o.buyerId === userId).length,
      totalSales: orders.filter((o) => o.sellerId === userId).length,
      heldForYou: this.round(held),
      received: this.round(received),
      spent: this.round(spent),
    };
  }

  // ─── Ações do ciclo de vida ───────────────────────────────────────────────────

  async markShipped(id: string, userId: string, role: string, shippingInfo?: string) {
    const order = await this.getOwned(id, userId, role);
    if (role !== UserRole.ADMIN && order.sellerId !== userId) {
      throw new ForbiddenException('Apenas o vendedor pode marcar como enviado');
    }
    if (order.status !== MarketplaceOrderStatus.PAGO_EM_CUSTODIA) {
      throw new BadRequestException('O pedido precisa estar pago (em custódia) para ser enviado');
    }
    const updated = await this.prisma.marketplaceOrder.update({
      where: { id },
      data: { status: MarketplaceOrderStatus.ENVIADO, shippedAt: new Date(), shippingInfo },
    });
    this.notify(order.buyerId, 'Pedido enviado', `"${order.product}" foi marcado como enviado. Após receber, confirme o recebimento para liberar o pagamento ao vendedor.`);
    return updated;
  }

  async confirmReceipt(id: string, userId: string, role: string) {
    const order = await this.getOwned(id, userId, role);
    if (role !== UserRole.ADMIN && order.buyerId !== userId) {
      throw new ForbiddenException('Apenas o comprador pode confirmar o recebimento');
    }
    if (!this.inStatus(order.status, [MarketplaceOrderStatus.ENVIADO, MarketplaceOrderStatus.PAGO_EM_CUSTODIA])) {
      throw new BadRequestException('Pedido não está em condição de confirmação');
    }
    // Libera o valor ao vendedor (sai da custódia).
    const updated = await this.prisma.marketplaceOrder.update({
      where: { id },
      data: { status: MarketplaceOrderStatus.RECEBIDO_LIBERADO, confirmedAt: new Date() },
    });
    this.notify(order.sellerId, 'Valor liberado 🎉', `O comprador confirmou o recebimento de "${order.product}". O repasse de ${this.round(Number(order.sellerNet))} será processado.`);
    return updated;
  }

  async openDispute(id: string, userId: string, role: string, reason: string) {
    const order = await this.getOwned(id, userId, role);
    if (role !== UserRole.ADMIN && order.buyerId !== userId) {
      throw new ForbiddenException('Apenas o comprador pode abrir disputa');
    }
    if (!this.inStatus(order.status, [MarketplaceOrderStatus.PAGO_EM_CUSTODIA, MarketplaceOrderStatus.ENVIADO])) {
      throw new BadRequestException('Só é possível abrir disputa de um pedido em custódia');
    }
    return this.prisma.marketplaceOrder.update({
      where: { id },
      data: { status: MarketplaceOrderStatus.DISPUTA, disputeReason: reason },
    }).then((updated) => {
      this.notify(order.sellerId, 'Disputa aberta', `O comprador abriu uma disputa no pedido "${order.product}". Nossa equipe será acionada.`);
      return updated;
    });
  }

  async cancel(id: string, userId: string, role: string) {
    const order = await this.getOwned(id, userId, role);
    if (order.status !== MarketplaceOrderStatus.AGUARDANDO_PAGAMENTO) {
      throw new BadRequestException('Só é possível cancelar um pedido ainda não pago');
    }
    return this.prisma.marketplaceOrder.update({
      where: { id },
      data: { status: MarketplaceOrderStatus.CANCELADO, cancelledAt: new Date() },
    });
  }

  /** Admin: confirma o repasse do valor ao vendedor. */
  async markPaidOut(id: string) {
    const order = await this.prisma.marketplaceOrder.findUnique({ where: { id } });
    if (!order) throw new NotFoundException('Pedido não encontrado');
    if (order.status !== MarketplaceOrderStatus.RECEBIDO_LIBERADO) {
      throw new BadRequestException('O pedido precisa estar liberado para repasse');
    }
    return this.prisma.marketplaceOrder.update({
      where: { id },
      data: { status: MarketplaceOrderStatus.REPASSADO, payoutAt: new Date() },
    });
  }

  /** Admin: reembolsa o comprador (em disputa). */
  async refund(id: string) {
    const order = await this.prisma.marketplaceOrder.findUnique({ where: { id } });
    if (!order) throw new NotFoundException('Pedido não encontrado');
    if (!this.inStatus(order.status, [MarketplaceOrderStatus.DISPUTA, MarketplaceOrderStatus.PAGO_EM_CUSTODIA, MarketplaceOrderStatus.ENVIADO])) {
      throw new BadRequestException('Pedido não pode ser reembolsado neste estado');
    }
    const updated = await this.prisma.marketplaceOrder.update({
      where: { id },
      data: { status: MarketplaceOrderStatus.REEMBOLSADO },
    });
    this.notify(order.buyerId, 'Reembolso processado', `Seu pagamento de "${order.product}" foi devolvido.`);
    return updated;
  }

  // ─── Auto-confirmação por prazo ───────────────────────────────────────────────

  /**
   * Libera automaticamente ao vendedor os pedidos ENVIADO há mais de N dias
   * sem confirmação nem disputa do comprador. Roda de hora em hora.
   */
  @Cron(CronExpression.EVERY_HOUR)
  async autoConfirmDeliveredOrders() {
    const cutoff = new Date(Date.now() - AUTO_CONFIRM_DAYS * 86400000);
    const pending = await this.prisma.marketplaceOrder.findMany({
      where: {
        status: MarketplaceOrderStatus.ENVIADO,
        shippedAt: { lte: cutoff },
      },
    });
    if (pending.length === 0) return;

    this.logger.log(`Auto-confirmando ${pending.length} pedido(s) após ${AUTO_CONFIRM_DAYS} dias`);
    for (const order of pending) {
      await this.prisma.marketplaceOrder.update({
        where: { id: order.id },
        data: { status: MarketplaceOrderStatus.RECEBIDO_LIBERADO, confirmedAt: new Date() },
      });
      this.notify(order.sellerId, 'Valor liberado automaticamente', `O prazo de ${AUTO_CONFIRM_DAYS} dias passou sem contestação em "${order.product}". O valor foi liberado.`);
      this.notify(order.buyerId, 'Pedido concluído automaticamente', `O pedido "${order.product}" foi confirmado automaticamente após ${AUTO_CONFIRM_DAYS} dias.`);
    }
  }

  // ─── Reputação / avaliações ───────────────────────────────────────────────────

  private readonly COMPLETED_STATUSES = [
    MarketplaceOrderStatus.RECEBIDO_LIBERADO,
    MarketplaceOrderStatus.REPASSADO,
  ];

  async createReview(
    orderId: string,
    raterId: string,
    role: string,
    dto: { rating: number; comment?: string },
  ) {
    const order = await this.prisma.marketplaceOrder.findUnique({ where: { id: orderId } });
    if (!order) throw new NotFoundException('Pedido não encontrado');
    if (role !== UserRole.ADMIN && order.buyerId !== raterId && order.sellerId !== raterId) {
      throw new ForbiddenException('Acesso negado');
    }
    if (!this.inStatus(order.status, this.COMPLETED_STATUSES)) {
      throw new BadRequestException('Só é possível avaliar pedidos concluídos');
    }
    if (dto.rating < 1 || dto.rating > 5) {
      throw new BadRequestException('A nota deve ser entre 1 e 5');
    }

    const isBuyer = order.buyerId === raterId;
    const ratedId = isBuyer ? order.sellerId : order.buyerId;

    const existing = await this.prisma.marketplaceReview.findUnique({
      where: { orderId_raterId: { orderId, raterId } },
    });
    if (existing) throw new BadRequestException('Você já avaliou este pedido');

    const review = await this.prisma.marketplaceReview.create({
      data: {
        orderId,
        raterId,
        ratedId,
        raterRole: isBuyer ? 'BUYER' : 'SELLER',
        rating: dto.rating,
        comment: dto.comment,
      },
    });
    this.notify(ratedId, 'Você recebeu uma avaliação', `Você recebeu ${dto.rating}★ em uma transação do marketplace.`);
    return review;
  }

  /** Avaliações e reputação (média + total) recebidas por um usuário. */
  async getReputation(userId: string) {
    const reviews = await this.prisma.marketplaceReview.findMany({
      where: { ratedId: userId },
      orderBy: { createdAt: 'desc' },
      include: { rater: { select: { name: true } } },
    });
    const count = reviews.length;
    const average = count ? this.round(reviews.reduce((s, r) => s + r.rating, 0) / count) : 0;
    return {
      average,
      count,
      reviews: reviews.map((r) => ({
        id: r.id,
        rating: r.rating,
        comment: r.comment,
        raterName: r.rater.name,
        raterRole: r.raterRole,
        createdAt: r.createdAt,
      })),
    };
  }

  /** Mapa userId → { average, count } para um conjunto de usuários (usado na vitrine). */
  async getReputationMap(userIds: string[]): Promise<Record<string, { average: number; count: number }>> {
    if (userIds.length === 0) return {};
    const grouped = await this.prisma.marketplaceReview.groupBy({
      by: ['ratedId'],
      where: { ratedId: { in: userIds } },
      _avg: { rating: true },
      _count: { rating: true },
    });
    const map: Record<string, { average: number; count: number }> = {};
    for (const g of grouped) {
      map[g.ratedId] = {
        average: this.round(g._avg.rating ?? 0),
        count: g._count.rating,
      };
    }
    return map;
  }
}
