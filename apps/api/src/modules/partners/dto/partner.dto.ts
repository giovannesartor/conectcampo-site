import {
  IsEnum,
  IsString,
  IsNumber,
  IsOptional,
  IsArray,
  IsEmail,
  Min,
  MinLength,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  PartnerType,
  GuaranteeType,
  CropType,
  BrazilianState,
  OperationType,
} from '@prisma/client';

export class CreatePartnerDto {
  @ApiProperty({ example: 'Banco Agro S.A.' })
  @IsString()
  @MinLength(3, { message: 'Nome deve ter no mínimo 3 caracteres' })
  name: string;

  @ApiProperty({ enum: PartnerType, example: 'BANCO' })
  @IsEnum(PartnerType, { message: 'Tipo de parceiro inválido' })
  type: PartnerType;

  @ApiProperty({ example: '12345678000199' })
  @IsString()
  @MinLength(14, { message: 'CNPJ inválido' })
  cnpj: string;

  @ApiProperty({ example: 'contato@bancoagro.com.br' })
  @IsEmail({}, { message: 'Email de contato inválido' })
  contactEmail: string;

  @ApiPropertyOptional({ example: '11999998888' })
  @IsOptional()
  @IsString()
  contactPhone?: string;

  @ApiPropertyOptional({ example: 'https://cdn.example.com/logo.png' })
  @IsOptional()
  @IsString()
  logoUrl?: string;

  @ApiPropertyOptional({ example: 100000, description: 'Ticket mínimo em reais' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  minTicket?: number;

  @ApiPropertyOptional({ example: 50000000, description: 'Ticket máximo em reais' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  maxTicket?: number;

  @ApiPropertyOptional({ enum: GuaranteeType, isArray: true })
  @IsOptional()
  @IsArray()
  @IsEnum(GuaranteeType, { each: true })
  acceptedGuarantees?: GuaranteeType[];

  @ApiPropertyOptional({ enum: CropType, isArray: true })
  @IsOptional()
  @IsArray()
  @IsEnum(CropType, { each: true })
  acceptedCrops?: CropType[];

  @ApiPropertyOptional({ enum: BrazilianState, isArray: true })
  @IsOptional()
  @IsArray()
  @IsEnum(BrazilianState, { each: true })
  acceptedStates?: BrazilianState[];

  @ApiPropertyOptional({ enum: OperationType, isArray: true })
  @IsOptional()
  @IsArray()
  @IsEnum(OperationType, { each: true })
  acceptedOperations?: OperationType[];

  @ApiPropertyOptional({ example: 40, description: 'Score mínimo aceito (0-100)' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  minScore?: number;
}

export class UpdatePartnerDto {
  @ApiPropertyOptional({ example: 'Banco Agro S.A.' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ example: 'contato@bancoagro.com.br' })
  @IsOptional()
  @IsEmail()
  contactEmail?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  contactPhone?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  logoUrl?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(0)
  minTicket?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(0)
  maxTicket?: number;

  @ApiPropertyOptional({ enum: GuaranteeType, isArray: true })
  @IsOptional()
  @IsArray()
  @IsEnum(GuaranteeType, { each: true })
  acceptedGuarantees?: GuaranteeType[];

  @ApiPropertyOptional({ enum: CropType, isArray: true })
  @IsOptional()
  @IsArray()
  @IsEnum(CropType, { each: true })
  acceptedCrops?: CropType[];

  @ApiPropertyOptional({ enum: BrazilianState, isArray: true })
  @IsOptional()
  @IsArray()
  @IsEnum(BrazilianState, { each: true })
  acceptedStates?: BrazilianState[];

  @ApiPropertyOptional({ enum: OperationType, isArray: true })
  @IsOptional()
  @IsArray()
  @IsEnum(OperationType, { each: true })
  acceptedOperations?: OperationType[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(0)
  minScore?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  isActive?: boolean;
}
