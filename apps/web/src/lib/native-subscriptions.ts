import { Capacitor } from '@capacitor/core';
import { NativePurchases, PURCHASE_TYPE, type Product } from '@capgo/native-purchases';
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
