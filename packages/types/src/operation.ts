import { OperationType, OperationStatus, GuaranteeType, DocumentType } from './enums';

export interface IOperationRequest {
  id: string;
  producerProfileId: string;
  type: OperationType;
  status: OperationStatus;
  requestedAmount: number;
  termMonths: number;
  purpose: string;
  guarantees: GuaranteeType[];
  guaranteeValue: number;
  requiredDocuments: DocumentType[];
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface IDocument {
  id: string;
  operationId?: string;
  userId: string;
  type: DocumentType;
  fileName: string;
  fileUrl: string;
  fileSize: number;
  mimeType: string;
  version: number;
  isVerified: boolean;
  verifiedBy?: string;
  verifiedAt?: Date;
  expiresAt?: Date;
  createdAt: Date;
}

export interface IProposal {
  id: string;
  operationId: string;
  partnerId: string;
  amount: number;
  interestRate: number;       // % ao ano
  termMonths: number;
  conditions: string;
  requiredGuarantees: GuaranteeType[];
  validUntil: Date;
  status: string;
  createdAt: Date;
}
