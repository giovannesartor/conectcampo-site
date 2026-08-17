import { IsUUID } from 'class-validator';

export class ResendVerificationDto {
  @IsUUID('4', { message: 'Token de verificação inválido' })
  token: string;
}
