export interface IMatchResult {
  id: string;
  operationId: string;
  partnerId: string;
  matchScore: number;         // 0-100
  matchFactors: IMatchFactor[];
  rank: number;
  createdAt: Date;
}

export interface IMatchFactor {
  name: string;
  weight: number;
  score: number;
  description: string;
}

export interface IPartnerCriteria {
  minTicket: number;
  maxTicket: number;
  acceptedGuarantees: string[];
  acceptedCrops: string[];
  acceptedStates: string[];
  acceptedOperationTypes: string[];
  minScore: number;
  maxDebtRatio: number;
}
