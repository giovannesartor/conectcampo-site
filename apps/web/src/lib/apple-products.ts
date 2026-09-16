export const APPLE_SUBSCRIPTION_PRODUCTS = {
  START: 'digital.conectcampo.start.monthly',
  PRO: 'digital.conectcampo.pro.monthly',
  COOPERATIVE: 'digital.conectcampo.cooperative.monthly',
} as const;

export type ApplePaidPlan = keyof typeof APPLE_SUBSCRIPTION_PRODUCTS;

export const APPLE_PRODUCT_TO_PLAN = Object.fromEntries(
  Object.entries(APPLE_SUBSCRIPTION_PRODUCTS).map(([plan, productId]) => [productId, plan]),
) as Record<string, ApplePaidPlan>;

/** IDs são estáveis; o preço apresentado deve sempre vir do StoreKit. */
export const APPLE_SUBSCRIPTION_PRODUCT_IDS = Object.values(APPLE_SUBSCRIPTION_PRODUCTS);
