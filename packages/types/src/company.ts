import { BrazilianState, CropType, ProducerTier } from './enums';

export interface ICompany {
  id: string;
  cnpj: string;
  razaoSocial: string;
  nomeFantasia?: string;
  inscricaoEstadual?: string;
  state: BrazilianState;
  city: string;
  address?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface IProducerProfile {
  id: string;
  userId: string;
  companyId?: string;
  tier: ProducerTier;
  annualRevenue: number;
  totalArea: number;           // hectares
  crops: CropType[];
  state: BrazilianState;
  city: string;
  hasIrrigation: boolean;
  hasInsurance: boolean;
  yearsInActivity: number;
  numberOfEmployees?: number;
}

export interface IFinancialProfile {
  id: string;
  producerProfileId: string;
  annualRevenue: number;
  totalDebt: number;
  debtToRevenueRatio: number;
  cashFlowMonthly: number[];    // 12 months
  guaranteeValue: number;
  hasNegativeRecords: boolean;
  creditHistoryYears: number;
  lastUpdated: Date;
}
