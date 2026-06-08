// ─── Carbon Credits – enums locais ────────────────────────────────────────────
// Espelham os enums do schema Prisma.
// Após rodar `prisma generate` esses valores ficam disponíveis direto do
// @prisma/client; até lá usamos estas definições para manter o build verde.

export enum CarbonStandard {
  VERRA_VCS         = 'VERRA_VCS',
  GOLD_STANDARD     = 'GOLD_STANDARD',
  CERRADO_PROTOCOL  = 'CERRADO_PROTOCOL',
  AMAZON_FUND       = 'AMAZON_FUND',
  REDD_PLUS         = 'REDD_PLUS',
  CAR_REGISTRY      = 'CAR_REGISTRY',
  OUTRO             = 'OUTRO',
}

export enum CarbonProjectType {
  FLORESTA_NATIVA        = 'FLORESTA_NATIVA',
  REFLORESTATION         = 'REFLORESTATION',
  PASTAGEM_RECUPERADA    = 'PASTAGEM_RECUPERADA',
  INTEGRACAO_LAVOURA     = 'INTEGRACAO_LAVOURA',
  AGRICULTURA_CARBONO    = 'AGRICULTURA_CARBONO',
  BIODIGESTAO            = 'BIODIGESTAO',
  ENERGIA_RENOVAVEL      = 'ENERGIA_RENOVAVEL',
  MANEJO_SOLO            = 'MANEJO_SOLO',
  OUTRO                  = 'OUTRO',
}

export enum CarbonProjectStatus {
  DRAFT            = 'DRAFT',
  IN_VALIDATION    = 'IN_VALIDATION',
  VALIDATED        = 'VALIDATED',
  REGISTERED       = 'REGISTERED',
  MONITORING       = 'MONITORING',
  VERIFIED         = 'VERIFIED',
  ISSUING_CREDITS  = 'ISSUING_CREDITS',
  ACTIVE           = 'ACTIVE',
  SUSPENDED        = 'SUSPENDED',
  COMPLETED        = 'COMPLETED',
  CANCELLED        = 'CANCELLED',
}

export enum CarbonCreditStatus {
  PENDING     = 'PENDING',
  ISSUED      = 'ISSUED',
  RETIRED     = 'RETIRED',
  CANCELLED   = 'CANCELLED',
  TRANSFERRED = 'TRANSFERRED',
}

export enum CarbonTransactionType {
  ISSUANCE     = 'ISSUANCE',
  SALE         = 'SALE',
  RETIREMENT   = 'RETIREMENT',
  TRANSFER     = 'TRANSFER',
  CANCELLATION = 'CANCELLATION',
}
