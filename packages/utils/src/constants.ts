import { SubscriptionPlan } from '@conectcampo/types';
import type { IPlanFeatures } from '@conectcampo/types';

export const PLAN_FEATURES: Record<SubscriptionPlan, IPlanFeatures> = {
  [SubscriptionPlan.START]: {
    plan: SubscriptionPlan.START,
    maxActiveOperations: 2,
    multiCnpj: false,
    dataRoomFull: false,
    prioritySupport: false,
    apiAccess: false,
    customReports: false,
    monthlyPrice: 299,
  },
  [SubscriptionPlan.PRO]: {
    plan: SubscriptionPlan.PRO,
    maxActiveOperations: -1, // unlimited
    multiCnpj: true,
    dataRoomFull: true,
    prioritySupport: true,
    apiAccess: false,
    customReports: true,
    monthlyPrice: 799,
  },
  [SubscriptionPlan.COOPERATIVE]: {
    plan: SubscriptionPlan.COOPERATIVE,
    maxActiveOperations: -1, // unlimited
    multiCnpj: true,
    dataRoomFull: true,
    prioritySupport: true,
    apiAccess: true,
    customReports: true,
    monthlyPrice: 2890,
  },
  [SubscriptionPlan.CORPORATE]: {
    plan: SubscriptionPlan.CORPORATE,
    maxActiveOperations: -1, // unlimited
    multiCnpj: true,
    dataRoomFull: true,
    prioritySupport: true,
    apiAccess: true,
    customReports: true,
    monthlyPrice: 0,
  },
};

/**
 * Scoring weights
 */
export const SCORE_WEIGHTS = {
  annualRevenue: 0.20,
  productionHistory: 0.15,
  guarantees: 0.20,
  debtRatio: 0.15,
  cashFlow: 0.15,
  creditHistory: 0.10,
  insurance: 0.05,
} as const;

/**
 * Match weights
 */
export const MATCH_WEIGHTS = {
  ticketFit: 0.25,
  guaranteeFit: 0.20,
  regionFit: 0.15,
  cropFit: 0.15,
  scoreFit: 0.15,
  operationTypeFit: 0.10,
} as const;
