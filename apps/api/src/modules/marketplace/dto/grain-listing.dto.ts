import {
  IsEnum,
  IsString,
  IsOptional,
  IsNumber,
  IsDateString,
  MaxLength,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  GrainListingType,
  GrainListingStatus,
  CropType,
  BrazilianState,
} from '@prisma/client';

export class CreateGrainListingDto {
  @ApiPropertyOptional({ enum: GrainListingType, default: GrainListingType.VENDA })
  @IsOptional()
  @IsEnum(GrainListingType)
  type?: GrainListingType;

  @ApiProperty({ description: 'Produto (ex: Soja em grão)' })
  @IsString()
  @MaxLength(160)
  product: string;

  @ApiPropertyOptional({ enum: CropType })
  @IsOptional()
  @IsEnum(CropType)
  cropType?: CropType;

  @ApiProperty()
  @IsNumber()
  quantity: number;

  @ApiProperty({ description: 'Unidade (sacas, toneladas)' })
  @IsString()
  @MaxLength(20)
  unit: string;

  @ApiPropertyOptional({ description: 'Preço por unidade (R$)' })
  @IsOptional()
  @IsNumber()
  pricePerUnit?: number;

  @ApiPropertyOptional({ enum: BrazilianState })
  @IsOptional()
  @IsEnum(BrazilianState)
  state?: BrazilianState;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(120)
  city?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(20)
  safra?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  availableFrom?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ description: 'Telefone de contato' })
  @IsOptional()
  @IsString()
  @MaxLength(30)
  contactPhone?: string;
}

export class UpdateGrainListingDto {
  @ApiPropertyOptional({ enum: GrainListingType })
  @IsOptional()
  @IsEnum(GrainListingType)
  type?: GrainListingType;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(160)
  product?: string;

  @ApiPropertyOptional({ enum: CropType })
  @IsOptional()
  @IsEnum(CropType)
  cropType?: CropType;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  quantity?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(20)
  unit?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  pricePerUnit?: number;

  @ApiPropertyOptional({ enum: BrazilianState })
  @IsOptional()
  @IsEnum(BrazilianState)
  state?: BrazilianState;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(120)
  city?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(20)
  safra?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  availableFrom?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(30)
  contactPhone?: string;

  @ApiPropertyOptional({ enum: GrainListingStatus })
  @IsOptional()
  @IsEnum(GrainListingStatus)
  status?: GrainListingStatus;
}
