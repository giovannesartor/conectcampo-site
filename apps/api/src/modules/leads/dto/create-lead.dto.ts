import { IsEmail, IsOptional, IsString, IsNumber, MaxLength } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateLeadDto {
  @ApiProperty({ example: 'produtor@fazenda.com' })
  @IsEmail({}, { message: 'E-mail inválido' })
  email: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(150)
  name?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(30)
  phone?: string;

  @ApiPropertyOptional({ description: 'Valor simulado (R$)' })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  amount?: number;

  @ApiPropertyOptional({ description: 'Prazo em meses' })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  termMonths?: number;

  @ApiPropertyOptional({ example: 'simulador' })
  @IsOptional()
  @IsString()
  @MaxLength(40)
  source?: string;
}
