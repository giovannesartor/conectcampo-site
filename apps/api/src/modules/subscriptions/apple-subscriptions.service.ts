import {
  BadRequestException,
  ConflictException,
  Injectable,
  Logger,
  ServiceUnavailableException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  AutoRenewStatus,
  Environment,
  JWSRenewalInfoDecodedPayload,
  JWSTransactionDecodedPayload,
  ResponseBodyV2DecodedPayload,
  SignedDataVerifier,
} from '@apple/app-store-server-library';
import { PaymentStatus, SubscriptionPlan } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';

const APPLE_PRODUCT_TO_PLAN: Record<string, SubscriptionPlan> = {
  'digital.conectcampo.start.monthly': SubscriptionPlan.START,
  'digital.conectcampo.pro.monthly': SubscriptionPlan.PRO,
  'digital.conectcampo.cooperative.monthly': SubscriptionPlan.COOPERATIVE,
};

type VerifiedTransaction = {
  transaction: JWSTransactionDecodedPayload;
  environment: Environment;
};

@Injectable()
export class AppleSubscriptionsService {
  private readonly logger = new Logger(AppleSubscriptionsService.name);
  private readonly bundleId: string;

  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
    private readonly notifications: NotificationsService,
  ) {
    this.bundleId = this.config.get<string>('APPLE_IAP_BUNDLE_ID', 'digital.conectcampo.app');
  }

  async getContext(userId: string) {
    const current = await this.prisma.subscription.findFirst({
      where: { userId, isActive: true },
      orderBy: { createdAt: 'desc' },
      select: { gateway: true, plan: true, paymentStatus: true },
    });

    const hasExternalPaidPlan = !!current &&
      current.gateway !== 'APPLE' &&
      current.gateway !== 'APP_REVIEW' &&
      current.plan !== SubscriptionPlan.CORPORATE &&
      (current.paymentStatus === PaymentStatus.ACTIVE ||
        current.paymentStatus === PaymentStatus.TRIALING);

    return {
      appAccountToken: userId,
      canPurchase: !hasExternalPaidPlan,
      reason: hasExternalPaidPlan
        ? 'Sua assinatura atual foi contratada fora da App Store e continua sendo gerenciada no canal original.'
        : null,
    };
  }

  async verifyForUser(userId: string, signedTransaction: string, source: 'PURCHASE' | 'RESTORE') {
    const verified = await this.verifyTransaction(signedTransaction);
    const transaction = verified.transaction;

    if (!transaction.appAccountToken || transaction.appAccountToken.toLowerCase() !== userId.toLowerCase()) {
      throw new UnauthorizedException('A compra não pertence a esta conta ConectCampo');
    }

    const result = await this.applyTransaction(transaction, verified.environment, userId, true);

    await this.prisma.webhookEvent
      .create({
        data: {
          provider: 'APPLE_TRANSACTION',
          externalId: transaction.transactionId!,
          type: source,
        },
      })
      .catch(() => undefined);

    return {
      verified: true,
      plan: result.plan,
      paymentStatus: result.paymentStatus,
      currentPeriodEnd: result.currentPeriodEnd,
      transactionId: transaction.transactionId,
    };
  }

  async processServerNotification(signedPayload: string) {
    const notification = await this.verifyNotification(signedPayload);
    const notificationId = notification.payload.notificationUUID;
    const notificationType = String(notification.payload.notificationType ?? 'UNKNOWN');

    if (notificationId) {
      const duplicate = await this.prisma.webhookEvent.findUnique({
        where: { provider_externalId: { provider: 'APPLE', externalId: notificationId } },
      });
      if (duplicate) return { received: true, deduped: true };
    }

    const signedTransaction = notification.payload.data?.signedTransactionInfo;
    if (!signedTransaction) {
      await this.recordNotification(notificationId, notificationType);
      return { received: true, type: notificationType };
    }

    const verified = await this.verifyTransaction(signedTransaction, notification.environment);
    const transaction = verified.transaction;
    const signedRenewalInfo = notification.payload.data?.signedRenewalInfo;
    const renewalInfo = signedRenewalInfo
      ? await this.verifyRenewalInfo(signedRenewalInfo, verified.environment)
      : undefined;
    const originalTransactionId = transaction.originalTransactionId;

    let userId = transaction.appAccountToken ?? null;
    if (!userId && originalTransactionId) {
      const existing = await this.prisma.subscription.findUnique({
        where: { appleOriginalTransactionId: originalTransactionId },
        select: { userId: true },
      });
      userId = existing?.userId ?? null;
    }

    if (!userId) {
      this.logger.warn(`Notificação Apple ${notificationType} sem vínculo de conta`);
      throw new BadRequestException('Transação Apple sem vínculo de conta');
    }

    const subscription = await this.applyTransaction(
      transaction,
      verified.environment,
      userId,
      false,
      notificationType,
      String(notification.payload.subtype ?? ''),
      renewalInfo,
    );

    await this.recordNotification(notificationId, notificationType);
    await this.notifyStatusChange(userId, notificationType, subscription.currentPeriodEnd);

    return { received: true, type: notificationType };
  }

  private async verifyTransaction(
    signedTransaction: string,
    expectedEnvironment?: Environment,
  ): Promise<VerifiedTransaction> {
    const environments = expectedEnvironment
      ? [expectedEnvironment]
      : [Environment.PRODUCTION, Environment.SANDBOX];

    let lastError: unknown;
    for (const environment of environments) {
      try {
        const verifier = this.createVerifier(environment);
        const transaction = await verifier.verifyAndDecodeTransaction(signedTransaction);
        return { transaction, environment };
      } catch (error) {
        lastError = error;
      }
    }

    this.logger.warn(`Falha na validação de transação StoreKit: ${this.safeError(lastError)}`);
    throw new UnauthorizedException('Não foi possível validar a compra com a Apple');
  }

  private async verifyNotification(signedPayload: string): Promise<{
    payload: ResponseBodyV2DecodedPayload;
    environment: Environment;
  }> {
    let lastError: unknown;
    for (const environment of [Environment.PRODUCTION, Environment.SANDBOX]) {
      try {
        const verifier = this.createVerifier(environment);
        const payload = await verifier.verifyAndDecodeNotification(signedPayload);
        return { payload, environment };
      } catch (error) {
        lastError = error;
      }
    }

    this.logger.warn(`Falha na validação de notificação Apple: ${this.safeError(lastError)}`);
    throw new UnauthorizedException('Notificação da Apple inválida');
  }

  private async verifyRenewalInfo(
    signedRenewalInfo: string,
    environment: Environment,
  ): Promise<JWSRenewalInfoDecodedPayload> {
    try {
      return await this.createVerifier(environment).verifyAndDecodeRenewalInfo(signedRenewalInfo);
    } catch (error) {
      this.logger.warn(`Falha na validação de renovação StoreKit: ${this.safeError(error)}`);
      throw new UnauthorizedException('Informações de renovação da Apple inválidas');
    }
  }

  private createVerifier(environment: Environment): SignedDataVerifier {
    const roots = this.rootCertificates();
    const appAppleIdRaw = this.config.get<string>('APPLE_IAP_APP_ID');
    const appAppleId = appAppleIdRaw ? Number(appAppleIdRaw) : undefined;

    if (environment === Environment.PRODUCTION && (!appAppleId || !Number.isSafeInteger(appAppleId))) {
      throw new ServiceUnavailableException('APPLE_IAP_APP_ID não configurado');
    }

    return new SignedDataVerifier(
      roots,
      true,
      environment,
      this.bundleId,
      environment === Environment.PRODUCTION ? appAppleId : undefined,
    );
  }

  private rootCertificates(): Buffer[] {
    const encoded = this.config.get<string>('APPLE_IAP_ROOT_CA_BASE64', '');
    const roots = encoded
      .split(',')
      .map((value) => value.trim())
      .filter(Boolean)
      .map((value) => Buffer.from(value, 'base64'))
      .filter((value) => value.length > 0);

    if (roots.length === 0) {
      throw new ServiceUnavailableException('Certificados raiz da Apple não configurados');
    }
    return roots;
  }

  private async applyTransaction(
    transaction: JWSTransactionDecodedPayload,
    environment: Environment,
    userId: string,
    requireActive: boolean,
    notificationType = '',
    notificationSubtype = '',
    renewalInfo?: JWSRenewalInfoDecodedPayload,
  ) {
    const productId = transaction.productId;
    const plan = productId ? APPLE_PRODUCT_TO_PLAN[productId] : undefined;
    if (!productId || !plan) throw new BadRequestException('Produto da App Store não reconhecido');

    if (!transaction.transactionId || !transaction.originalTransactionId) {
      throw new BadRequestException('Transação da Apple incompleta');
    }

    const expiresAt = transaction.expiresDate ? new Date(transaction.expiresDate) : null;
    const purchasedAt = transaction.purchaseDate ? new Date(transaction.purchaseDate) : new Date();
    const revokedAt = transaction.revocationDate ? new Date(transaction.revocationDate) : null;
    const now = new Date();
    const hasTime = !!expiresAt && expiresAt.getTime() > now.getTime();

    if (requireActive && (!hasTime || revokedAt)) {
      throw new BadRequestException('A assinatura não está ativa na App Store');
    }

    const normalizedType = notificationType.toUpperCase();
    const normalizedSubtype = notificationSubtype.toUpperCase();
    const revoked = !!revokedAt || ['REFUND', 'REVOKE'].includes(normalizedType);
    const expired = ['EXPIRED', 'GRACE_PERIOD_EXPIRED'].includes(normalizedType);
    const gracePeriodEnd = renewalInfo?.gracePeriodExpiresDate
      ? new Date(renewalInfo.gracePeriodExpiresDate)
      : null;
    const inGracePeriod = normalizedSubtype === 'GRACE_PERIOD' &&
      !!gracePeriodEnd && gracePeriodEnd.getTime() > now.getTime();
    const billingFailure = normalizedType === 'DID_FAIL_TO_RENEW' && !inGracePeriod;
    const hasAccessTime = hasTime || inGracePeriod;
    const effectivePeriodEnd = inGracePeriod ? gracePeriodEnd! : expiresAt ?? now;
    const isActive = !revoked && !expired && !billingFailure && hasAccessTime;
    const paymentStatus = revoked
      ? PaymentStatus.CANCELLED
      : isActive
        ? PaymentStatus.ACTIVE
        : PaymentStatus.OVERDUE;

    const owner = await this.prisma.subscription.findUnique({
      where: { appleOriginalTransactionId: transaction.originalTransactionId },
      select: { id: true, userId: true },
    });
    if (owner && owner.userId !== userId) {
      throw new ConflictException('Esta assinatura já está vinculada a outra conta');
    }

    const pendingApple = owner ?? await this.prisma.subscription.findFirst({
      where: {
        userId,
        gateway: { in: ['APPLE', 'APP_REVIEW'] },
        appleOriginalTransactionId: null,
      },
      orderBy: { createdAt: 'desc' },
      select: { id: true, userId: true },
    });

    const data = {
      plan,
      gateway: 'APPLE',
      invoiceUrl: null,
      paymentStatus,
      isActive,
      currentPeriodStart: purchasedAt,
      currentPeriodEnd: effectivePeriodEnd,
      cancelledAt: revoked ? revokedAt ?? now : null,
      appleOriginalTransactionId: transaction.originalTransactionId,
      appleLatestTransactionId: transaction.transactionId,
      appleProductId: productId,
      appleEnvironment: String(transaction.environment ?? environment),
      appleAutoRenewStatus: renewalInfo?.autoRenewStatus === undefined
        ? undefined
        : renewalInfo.autoRenewStatus === AutoRenewStatus.ON,
      appleRevokedAt: revokedAt,
    };

    const subscription = pendingApple
      ? await this.prisma.subscription.update({ where: { id: pendingApple.id }, data })
      : await this.prisma.subscription.create({ data: { userId, ...data } });

    if (isActive) {
      await this.prisma.user.update({ where: { id: userId }, data: { isActive: true } });
    }

    this.logger.log(`Assinatura Apple ${paymentStatus} para usuário ${userId} (${productId})`);
    return subscription;
  }

  private async recordNotification(notificationId: string | undefined, type: string) {
    if (!notificationId) return;
    await this.prisma.webhookEvent
      .create({ data: { provider: 'APPLE', externalId: notificationId, type } })
      .catch(() => undefined);
  }

  private async notifyStatusChange(userId: string, type: string, periodEnd: Date) {
    const messages: Record<string, { title: string; message: string; email: boolean }> = {
      SUBSCRIBED: {
        title: 'Assinatura ativada',
        message: 'Seu plano ConectCampo foi ativado com segurança pela App Store.',
        email: false,
      },
      DID_RENEW: {
        title: 'Assinatura renovada',
        message: `Seu acesso foi renovado até ${periodEnd.toLocaleDateString('pt-BR')}.`,
        email: false,
      },
      DID_FAIL_TO_RENEW: {
        title: 'Atenção à assinatura',
        message: 'A App Store informou uma falha na renovação. Revise sua forma de pagamento na Apple.',
        email: true,
      },
      EXPIRED: {
        title: 'Assinatura expirada',
        message: 'Sua assinatura pela App Store expirou. Você pode reativá-la na área Minha Assinatura.',
        email: true,
      },
      REFUND: {
        title: 'Assinatura reembolsada',
        message: 'A Apple informou o reembolso da assinatura e o acesso ao plano foi atualizado.',
        email: true,
      },
      REVOKE: {
        title: 'Assinatura revogada',
        message: 'A Apple informou a revogação da assinatura e o acesso ao plano foi atualizado.',
        email: true,
      },
    };
    const content = messages[type];
    if (!content) return;

    await this.notifications.notify({
      userId,
      type: 'subscription',
      title: content.title,
      message: content.message,
      link: '/dashboard/subscription',
      email: content.email,
    }).catch(() => undefined);
  }

  private safeError(error: unknown): string {
    if (error instanceof ServiceUnavailableException) return error.message;
    return error instanceof Error ? error.name : 'erro desconhecido';
  }
}
