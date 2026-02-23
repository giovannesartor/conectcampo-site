import { IsEmail, IsString, MinLength, IsEnum, IsOptional, Matches } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { IsCPF } from '../../../common/validators/is-cpf.validator';

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

  @ApiPropertyOptional({ example: '11999999999' })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiPropertyOptional({ example: '12345678909' })
  @IsOptional()
  @IsCPF({ message: 'CPF inválido' })
  cpf?: string;
}
