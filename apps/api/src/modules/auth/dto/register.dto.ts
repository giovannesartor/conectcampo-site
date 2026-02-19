import { IsEmail, IsString, MinLength, IsEnum, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';

export class RegisterDto {
  @ApiProperty({ example: 'joao@agro.com' })
  @IsEmail({}, { message: 'Email inválido' })
  email: string;

  @ApiProperty({ example: 'Senha@123' })
  @IsString()
  @MinLength(8, { message: 'Senha deve ter no mínimo 8 caracteres' })
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
  @IsString()
  cpf?: string;
}
