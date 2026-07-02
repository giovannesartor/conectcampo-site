import { UserRole } from '@prisma/client';

/** Todos os perfis autenticados — usado nos módulos agro (dados escopados por usuário). */
export const ALL_ROLES: UserRole[] = [
  UserRole.PRODUCER,
  UserRole.COMPANY,
  UserRole.FINANCIAL_INSTITUTION,
  UserRole.CREDIT_ANALYST,
  UserRole.ADMIN,
];
