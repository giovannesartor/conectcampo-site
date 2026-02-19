import { UserRole } from './enums';

export interface IUser {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  phone?: string;
  cpf?: string;
  avatarUrl?: string;
  emailVerified: boolean;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface IAuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export interface ILoginRequest {
  email: string;
  password: string;
}

export interface IRegisterRequest {
  email: string;
  password: string;
  name: string;
  role: UserRole;
  phone?: string;
  cpf?: string;
}

export interface IJwtPayload {
  sub: string;       // user id
  email: string;
  role: UserRole;
  tenantId?: string;
  iat?: number;
  exp?: number;
}
