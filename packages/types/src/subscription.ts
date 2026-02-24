import { SubscriptionPlan, PaymentStatus } from './enums';

export interface ISubscription {
  id: string;
  userId: string;
  plan: SubscriptionPlan;
  asaasCustomerId?: string;
  asaasSubscriptionId?: string;
  invoiceUrl?: string;
  paymentStatus: PaymentStatus;
  isActive: boolean;
  currentPeriodStart: Date;
  currentPeriodEnd: Date;
  cancelledAt?: Date;
  createdAt: Date;
}

export interface ICommission {
  id: string;
  operationId: string;
  partnerId: string;
  contractedAmount: number;
  commissionRate: number;       // percentage
  commissionValue: number;      // R$
  status: string;
  paidAt?: Date;
  createdAt: Date;
}

export interface IPlanFeatures {
  plan: SubscriptionPlan;
  maxActiveOperations: number;
  multiCnpj: boolean;
  dataRoomFull: boolean;
  prioritySupport: boolean;
  apiAccess: boolean;
  customReports: boolean;
  monthlyPrice: number;         // R$
}
