// ============================================
// Enums compartilhados entre frontend e backend
// ============================================

export enum UserRole {
  PRODUCER = 'PRODUCER',
  COMPANY = 'COMPANY',
  FINANCIAL_INSTITUTION = 'FINANCIAL_INSTITUTION',
  CREDIT_ANALYST = 'CREDIT_ANALYST',
  ADMIN = 'ADMIN',
}

export enum ProducerTier {
  FAIXA_A = 'FAIXA_A', // Até R$ 500k
  FAIXA_B = 'FAIXA_B', // R$ 500k a R$ 5M
  FAIXA_C = 'FAIXA_C', // R$ 5M a R$ 50M
  FAIXA_D = 'FAIXA_D', // R$ 50M+
}

export enum OperationType {
  CUSTEIO = 'CUSTEIO',
  INVESTIMENTO = 'INVESTIMENTO',
  GIRO = 'GIRO',
  MERCADO_CAPITAIS = 'MERCADO_CAPITAIS',
}

export enum OperationStatus {
  DRAFT = 'DRAFT',
  SUBMITTED = 'SUBMITTED',
  SCORING = 'SCORING',
  MATCHING = 'MATCHING',
  PROPOSALS_RECEIVED = 'PROPOSALS_RECEIVED',
  ACCEPTED = 'ACCEPTED',
  IN_ANALYSIS = 'IN_ANALYSIS',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  CONTRACTED = 'CONTRACTED',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
}

export enum DocumentType {
  CPF = 'CPF',
  CNPJ = 'CNPJ',
  CAR = 'CAR',               // Cadastro Ambiental Rural
  ITR = 'ITR',               // Imposto Territorial Rural
  CCIR = 'CCIR',             // Certificado de Cadastro de Imóvel Rural
  ESCRITURA = 'ESCRITURA',
  BALANCO = 'BALANCO',
  DRE = 'DRE',
  IR = 'IR',                 // Imposto de Renda
  NOTA_FISCAL = 'NOTA_FISCAL',
  CPR = 'CPR',               // Cédula de Produto Rural
  CONTRATO_SOCIAL = 'CONTRATO_SOCIAL',
  PROCURACAO = 'PROCURACAO',
  LAUDO_AVALIACAO = 'LAUDO_AVALIACAO',
  CERTIDAO_NEGATIVA = 'CERTIDAO_NEGATIVA',
  OUTRO = 'OUTRO',
}

export enum GuaranteeType {
  IMOVEL_RURAL = 'IMOVEL_RURAL',
  PENHOR_SAFRA = 'PENHOR_SAFRA',
  ALIENACAO_FIDUCIARIA = 'ALIENACAO_FIDUCIARIA',
  AVAL = 'AVAL',
  RECEBIVEIS = 'RECEBIVEIS',
  CPR_FINANCEIRA = 'CPR_FINANCEIRA',
  SEGURO = 'SEGURO',
  FUNDO_GARANTIDOR = 'FUNDO_GARANTIDOR',
  OUTRO = 'OUTRO',
}

export enum PartnerType {
  BANCO = 'BANCO',
  COOPERATIVA = 'COOPERATIVA',
  FIDC = 'FIDC',
  SECURITIZADORA = 'SECURITIZADORA',   // CRA
  FIAGRO = 'FIAGRO',
  MERCADO_CAPITAIS = 'MERCADO_CAPITAIS',
  ESTRUTURADOR = 'ESTRUTURADOR',
}

export enum SubscriptionPlan {
  START = 'START',
  PRO = 'PRO',
  COOPERATIVE = 'COOPERATIVE',
  CORPORATE = 'CORPORATE',
}

export enum RiskProfile {
  CONSERVADOR = 'CONSERVADOR',
  MODERADO = 'MODERADO',
  ESTRUTURADO = 'ESTRUTURADO',
}

export enum ProposalStatus {
  PENDING = 'PENDING',
  SENT = 'SENT',
  VIEWED = 'VIEWED',
  ACCEPTED = 'ACCEPTED',
  REJECTED = 'REJECTED',
  EXPIRED = 'EXPIRED',
  NEGOTIATING = 'NEGOTIATING',
}

export enum CommissionStatus {
  PENDING = 'PENDING',
  CALCULATED = 'CALCULATED',
  INVOICED = 'INVOICED',
  PAID = 'PAID',
}

export enum CropType {
  SOJA = 'SOJA',
  MILHO = 'MILHO',
  CAFE = 'CAFE',
  ALGODAO = 'ALGODAO',
  CANA = 'CANA',
  ARROZ = 'ARROZ',
  TRIGO = 'TRIGO',
  FEIJAO = 'FEIJAO',
  PECUARIA_CORTE = 'PECUARIA_CORTE',
  PECUARIA_LEITE = 'PECUARIA_LEITE',
  AVICULTURA = 'AVICULTURA',
  SUINOCULTURA = 'SUINOCULTURA',
  FRUTICULTURA = 'FRUTICULTURA',
  SILVICULTURA = 'SILVICULTURA',
  OUTRO = 'OUTRO',
}

export enum BrazilianState {
  AC = 'AC', AL = 'AL', AP = 'AP', AM = 'AM', BA = 'BA',
  CE = 'CE', DF = 'DF', ES = 'ES', GO = 'GO', MA = 'MA',
  MT = 'MT', MS = 'MS', MG = 'MG', PA = 'PA', PB = 'PB',
  PR = 'PR', PE = 'PE', PI = 'PI', RJ = 'RJ', RN = 'RN',
  RS = 'RS', RO = 'RO', RR = 'RR', SC = 'SC', SP = 'SP',
  SE = 'SE', TO = 'TO',
}
