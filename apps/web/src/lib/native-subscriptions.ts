import { Capacitor } from '@capacitor/core';
import { NativePurchases, PURCHASE_TYPE, type Product, type Transaction } from '@capgo/native-purchases';
import { api } from './api';
import {
  APPLE_PRODUCT_TO_PLAN,
  APPLE_SUBSCRIPTION_PRODUCT_IDS,
  type ApplePaidPlan,
} from './apple-products';

export type AppleSubscriptionOffer = {
  plan: ApplePaidPlan;
  productId: string;
  priceString: string;
  title: string;
  description: string;
};

export type AppleSubscriptionContext = {
  appAccountToken: string;
  canPurchase: boolean;
  reason: string | null;
};

export type AppleSubscriptionResult = {
  verified: boolean;
  plan: ApplePaidPlan;
  paymentStatus: string;
  currentPeriodEnd: string;
  transactionId: string;
};

function toOffer(product: Product): AppleSubscriptionOffer | null {
  const plan = APPLE_PRODUCT_TO_PLAN[product.identifier];
  if (!plan || !product.priceString) return null;
  return {
    plan,
    productId: product.identifier,
    priceString: product.priceString,
    title: product.title,
    description: product.description,
  };
}

/** Catálogo somente leitura. Compra e restauração exigem validação no backend. */
export async function loadAppleSubscriptionOffers(): Promise<AppleSubscriptionOffer[]> {
  if (!Capacitor.isNativePlatform() || Capacitor.getPlatform() !== 'ios') return [];
  const support = await NativePurchases.isBillingSupported();
  if (!support.isBillingSupported) return [];
  const { products } = await NativePurchases.getProducts({
    productIdentifiers: [...APPLE_SUBSCRIPTION_PRODUCT_IDS],
    productType: PURCHASE_TYPE.SUBS,
  });
  return products.map(toOffer).filter((offer): offer is AppleSubscriptionOffer => !!offer);
}

export async function openAppleSubscriptionManagement(): Promise<void> {
  if (!Capacitor.isNativePlatform() || Capacitor.getPlatform() !== 'ios') return;
  await NativePurchases.manageSubscriptions();
}

export async function loadAppleSubscriptionContext(): Promise<AppleSubscriptionContext> {
  const { data } = await api.get<AppleSubscriptionContext>('/subscriptions/apple/context');
  return data;
}

async function verifyTransaction(
  transaction: Transaction,
  source: 'PURCHASE' | 'RESTORE',
): Promise<AppleSubscriptionResult> {
  if (!transaction.jwsRepresentation) {
    throw new Error('A App Store não forneceu a transação assinada necessária para validar esta compra.');
  }
  const { data } = await api.post<AppleSubscriptionResult>('/subscriptions/apple/verify', {
    signedTransaction: transaction.jwsRepresentation,
    source,
  });
  return data;
}

export async function purchaseAppleSubscription(
  offer: AppleSubscriptionOffer,
  context: AppleSubscriptionContext,
): Promise<AppleSubscriptionResult> {
  if (!Capacitor.isNativePlatform() || Capacitor.getPlatform() !== 'ios') {
    throw new Error('Esta compra só está disponível no aplicativo para iPhone.');
  }
  if (!context.canPurchase) throw new Error(context.reason ?? 'Assinatura indisponível para esta conta.');

  const transaction = await NativePurchases.purchaseProduct({
    productIdentifier: offer.productId,
    productType: PURCHASE_TYPE.SUBS,
    quantity: 1,
    appAccountToken: context.appAccountToken,
    autoAcknowledgePurchases: false,
  });
  const result = await verifyTransaction(transaction, 'PURCHASE');

  await NativePurchases.acknowledgePurchase({
    purchaseToken: transaction.transactionId,
  });
  return result;
}

export async function restoreAppleSubscriptions(
  context: AppleSubscriptionContext,
): Promise<AppleSubscriptionResult[]> {
  if (!Capacitor.isNativePlatform() || Capacitor.getPlatform() !== 'ios') return [];

  await NativePurchases.restorePurchases();
  const { purchases } = await NativePurchases.getPurchases({
    productType: PURCHASE_TYPE.SUBS,
    appAccountToken: context.appAccountToken,
    onlyCurrentEntitlements: true,
  });

  const allowed = purchases.filter((purchase) =>
    APPLE_SUBSCRIPTION_PRODUCT_IDS.includes(
      purchase.productIdentifier as (typeof APPLE_SUBSCRIPTION_PRODUCT_IDS)[number],
    ),
  );
  const restored: AppleSubscriptionResult[] = [];
  for (const transaction of allowed) {
    restored.push(await verifyTransaction(transaction, 'RESTORE'));
  }
  return restored;
}
