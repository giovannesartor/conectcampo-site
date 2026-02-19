import { RiskProfile } from './enums';

export interface IRiskScore {
  id: string;
  producerProfileId: string;
  score: number;              // 0-100
  profile: RiskProfile;
  factors: IRiskFactor[];
  eligibility: IEligibility[];
  calculatedAt: Date;
  validUntil: Date;
}

export interface IRiskFactor {
  name: string;
  weight: number;
  value: number;
  maxValue: number;
  description: string;
}

export interface IEligibility {
  partnerType: string;
  eligible: boolean;
  reason?: string;
  maxAmount?: number;
}
