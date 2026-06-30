import {
  IsEnum,
  IsString,
  IsOptional,
  IsNumber,
  IsDateString,
  IsPositive,
  MaxLength,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export enum CprPurpose {
  EMISSAO = 'EMISSAO',
  CAPTACAO = 'CAPTACAO',
}

export enum CprType {
  FISICA = 'FISICA',
  FINANCEIRA = 'FINANCEIRA',
}

export class CreateCprDto {
  // ─── Finalidade ─────────────────────────────────────────────────────────────

  @ApiProperty({ enum: CprPurpose, description: 'EMISSAO = emitir CPR | CAPTACAO = usar CPR como garantia' })
  @IsEnum(CprPurpose)
  purpose: CprPurpose;

  @ApiPropertyOptional({ enum: CprType, default: CprType.FINANCEIRA })
  @IsOptional()
  @IsEnum(CprType)
  type?: CprType;

  // ─── Emitente ────────────────────────────────────────────────────────────────

  @ApiProperty({ description: 'Nome completo do emitente (produtor rural)' })
  @IsString()
  @MaxLength(200)
  emitenteNome: string;

  @ApiProperty({ description: 'CPF ou CNPJ do emitente' })
  @IsString()
  @MaxLength(20)
  emitenteCpfCnpj: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  emitenteEndereco?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  emitenteCidade?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  emitenteEstado?: string;

  @ApiPropertyOptional({ description: 'Número do CAR (Cadastro Ambiental Rural)' })
  @IsOptional()
  @IsString()
  emitenteCarNumero?: string;

  @ApiPropertyOptional({ description: 'E-mail do emitente (envio automático do link de assinatura)' })
  @IsOptional()
  @IsString()
  emitenteEmail?: string;

  @ApiPropertyOptional({ description: 'Telefone do emitente (DDD + número)' })
  @IsOptional()
  @IsString()
  emitenteTelefone?: string;

  // ─── Credor ──────────────────────────────────────────────────────────────────

  @ApiProperty({ description: 'Nome do credor (banco, cooperativa ou pessoa)' })
  @IsString()
  @MaxLength(200)
  credorNome: string;

  @ApiProperty({ description: 'CPF ou CNPJ do credor' })
  @IsString()
  @MaxLength(20)
  credorCpfCnpj: string;

  @ApiPropertyOptional({ description: 'Tipo do credor: banco, cooperativa, pessoa_fisica, etc.' })
  @IsOptional()
  @IsString()
  credorTipo?: string;

  @ApiPropertyOptional({ description: 'E-mail do credor (envio automático do link de assinatura)' })
  @IsOptional()
  @IsString()
  credorEmail?: string;

  @ApiPropertyOptional({ description: 'Telefone do credor (DDD + número)' })
  @IsOptional()
  @IsString()
  credorTelefone?: string;

  // ─── Produto ─────────────────────────────────────────────────────────────────

  @ApiProperty({ description: 'Produto agrícola: soja, milho, boi gordo, etc.' })
  @IsString()
  @MaxLength(100)
  produto: string;

  @ApiProperty({ description: 'Quantidade do produto' })
  @IsNumber()
  @IsPositive()
  @Type(() => Number)
  quantidade: number;

  @ApiProperty({ description: 'Unidade: sacas, toneladas, arrobas, litros, etc.' })
  @IsString()
  @MaxLength(30)
  unidade: string;

  @ApiPropertyOptional({ description: 'Safra de referência, ex: 2025/2026' })
  @IsOptional()
  @IsString()
  safraAno?: string;

  @ApiPropertyOptional({ description: 'Preço unitário referência (R$)' })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  precoUnitario?: number;

  @ApiPropertyOptional({ description: 'Local de entrega do produto' })
  @IsOptional()
  @IsString()
  localEntrega?: string;

  @ApiPropertyOptional({ description: 'Data de entrega do produto (ISO 8601)' })
  @IsOptional()
  @IsDateString()
  dataEntrega?: string;

  // ─── Vencimento ──────────────────────────────────────────────────────────────

  @ApiProperty({ description: 'Data de vencimento da CPR (ISO 8601)' })
  @IsDateString()
  dataVencimento: string;

  @ApiPropertyOptional({ description: 'Prazo em meses (até 180 = 15 anos)' })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  prazoMeses?: number;

  @ApiPropertyOptional({ description: 'Carência em meses (até 60 = 5 anos)' })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  carenciaMeses?: number;

  // ─── Garantia ────────────────────────────────────────────────────────────────

  @ApiPropertyOptional({ description: 'Tipo de garantia adicional: imovel_rural, penhor_safra, aval, etc.' })
  @IsOptional()
  @IsString()
  garantiaTipo?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  garantiaDescricao?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  garantiaValor?: number;

  // ─── Captação ────────────────────────────────────────────────────────────────

  @ApiPropertyOptional({ description: 'Finalidade do crédito: custeio, investimento, giro, etc.' })
  @IsOptional()
  @IsString()
  finalidade?: string;

  @ApiPropertyOptional({ description: 'Valor a captar (apenas para CAPTACAO, R$)' })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  valorCaptacao?: number;

  // ─── Extras ──────────────────────────────────────────────────────────────────

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  observacoes?: string;
}
