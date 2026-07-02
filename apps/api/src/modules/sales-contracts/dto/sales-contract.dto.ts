import {
  IsEnum,
  IsString,
  IsOptional,
  IsNumber,
  IsBoolean,
  IsDateString,
  MaxLength,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  SalesContractStatus,
  SalesContractDeliveryType,
} from '@prisma/client';

export class CreateSalesContractDto {
  @ApiProperty({ description: 'Comprador / trading' })
  @IsString()
  @MaxLength(200)
  buyerName: string;

  @ApiProperty()
  @IsString()
  @MaxLength(160)
  product: string;

  @ApiProperty()
  @IsNumber()
  quantity: number;

  @ApiProperty({ description: 'Unidade (sacas, toneladas)' })
  @IsString()
  @MaxLength(20)
  unit: string;

  @ApiProperty({ description: 'Preço por unidade (R$)' })
  @IsNumber()
  pricePerUnit: number;

  @ApiPropertyOptional({ enum: SalesContractDeliveryType })
  @IsOptional()
  @IsEnum(SalesContractDeliveryType)
  deliveryType?: SalesContractDeliveryType;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  deliveryDate?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(200)
  deliveryLocation?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(20)
  safra?: string;

  @ApiPropertyOptional({ description: 'Preço travado?', default: true })
  @IsOptional()
  @IsBoolean()
  priceLocked?: boolean;

  @ApiPropertyOptional({ description: 'Possui hedge?', default: false })
  @IsOptional()
  @IsBoolean()
  hedged?: boolean;

  @ApiPropertyOptional({ description: 'Referência do hedge (ex: contrato B3)' })
  @IsOptional()
  @IsString()
  @MaxLength(120)
  hedgeReference?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;
}

export class UpdateSalesContractDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(200)
  buyerName?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(160)
  product?: string;

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

  @ApiPropertyOptional({ enum: SalesContractDeliveryType })
  @IsOptional()
  @IsEnum(SalesContractDeliveryType)
  deliveryType?: SalesContractDeliveryType;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  deliveryDate?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(200)
  deliveryLocation?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(20)
  safra?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  priceLocked?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  hedged?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(120)
  hedgeReference?: string;

  @ApiPropertyOptional({ enum: SalesContractStatus })
  @IsOptional()
  @IsEnum(SalesContractStatus)
  status?: SalesContractStatus;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;
}
