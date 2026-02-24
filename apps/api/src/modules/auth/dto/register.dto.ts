import {
  IsEmail,
  IsString,
  MinLength,
  IsEnum,
  IsOptional,
  Matches,
  ValidateIf,
  IsNotEmpty,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { UserRole, SubscriptionPlan } from '@prisma/client';
import { IsCPF } from '../../../common/validators/is-cpf.validator';
import { IsCNPJ } from '../../../common/validators/is-cnpj.validator';

export class RegisterDto {
  @ApiProperty({ example: 'joao@agro.com' })
  @IsEmail({}, { message: 'Email inválido' })
  email: string;

  @ApiProperty({ example: 'Senha@123' })
  @IsString()
  @MinLength(8, { message: 'Senha deve ter no mínimo 8 caracteres' })
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#])[A-Za-z\d@$!%*?&#]+$/, {
    message: 'Senha deve conter ao menos 1 maiúscula, 1 minúscula, 1 número e 1 caractere especial (@$!%*?&#)',
  })
  password: string;

  @ApiProperty({ example: 'João Silva' })
  @IsString()
  @MinLength(3, { message: 'Nome deve ter no mínimo 3 caracteres' })
  name: string;

  @ApiProperty({ enum: UserRole, example: UserRole.PRODUCER })
  @IsEnum(UserRole, { message: 'Role inválida' })
  role: UserRole;

  @ApiProperty({ enum: SubscriptionPlan, example: SubscriptionPlan.START })
  @IsEnum(SubscriptionPlan, { message: 'Plano inválido' })
  plan: SubscriptionPlan;

  @ApiPropertyOptional({ example: '11999999999' })
  @IsOptional()
  @IsString()
  phone?: string;

  /**
   * Obrigatório para Produtor Rural (PRODUCER).
   */
  @ApiPropertyOptional({ example: '12345678909' })
  @ValidateIf((o) => o.role === UserRole.PRODUCER)
  @IsNotEmpty({ message: 'CPF é obrigatório para Produtor Rural' })
  @IsCPF({ message: 'CPF inválido' })
  cpf?: string;

  /**
   * Obrigatório para Empresa, Cooperativa e Instituição Financeira.
   */
  @ApiPropertyOptional({ example: '54079299000140' })
  @ValidateIf(
    (o) =>
      o.role === UserRole.COMPANY ||
      o.role === UserRole.FINANCIAL_INSTITUTION ||
      o.role === UserRole.CREDIT_ANALYST,
  )
  @IsNotEmpty({ message: 'CNPJ é obrigatório para este tipo de conta' })
  @IsCNPJ({ message: 'CNPJ inválido' })
  cnpj?: string;
}
