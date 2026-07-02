import {
  IsEnum,
  IsString,
  IsOptional,
  IsNumber,
  IsDateString,
  MaxLength,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { BarterStatus } from '@prisma/client';

export class CreateBarterDto {
  @ApiPropertyOptional({ description: 'Fornecedor de insumo / revenda' })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  partnerName?: string;

  @ApiProperty({ description: 'Insumo (fertilizante, defensivo, semente...)' })
  @IsString()
  @MaxLength(160)
  inputProduct: string;

  @ApiProperty()
  @IsNumber()
  inputQuantity: number;

  @ApiProperty({ description: 'Unidade do insumo (kg, L, sc, t)' })
  @IsString()
  @MaxLength(20)
  inputUnit: string;

  @ApiPropertyOptional({ description: 'Valor do insumo (R$)' })
  @IsOptional()
  @IsNumber()
  inputValue?: number;

  @ApiProperty({ description: 'Grão de troca (soja, milho...)' })
  @IsString()
  @MaxLength(120)
  grainProduct: string;

  @ApiProperty()
  @IsNumber()
  grainQuantity: number;

  @ApiProperty({ description: 'Unidade do grão (sacas, toneladas)' })
  @IsString()
  @MaxLength(20)
  grainUnit: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(20)
  safra?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  deliveryDate?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;
}

export class UpdateBarterDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(200)
  partnerName?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(160)
  inputProduct?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  inputQuantity?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(20)
  inputUnit?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  inputValue?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(120)
  grainProduct?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  grainQuantity?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(20)
  grainUnit?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(20)
  safra?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  deliveryDate?: string;

  @ApiPropertyOptional({ enum: BarterStatus })
  @IsOptional()
  @IsEnum(BarterStatus)
  status?: BarterStatus;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;
}
