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
import { CashFlowType, CashFlowCategory } from '@prisma/client';

export class CreateCashFlowDto {
  @ApiPropertyOptional({ description: 'Safra, ex: "2025/2026"' })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  safra?: string;

  @ApiProperty({ enum: CashFlowType })
  @IsEnum(CashFlowType)
  type: CashFlowType;

  @ApiProperty({ enum: CashFlowCategory })
  @IsEnum(CashFlowCategory)
  category: CashFlowCategory;

  @ApiProperty()
  @IsString()
  @MaxLength(200)
  description: string;

  @ApiProperty({ description: 'Valor (R$)' })
  @IsNumber()
  amount: number;

  @ApiProperty()
  @IsDateString()
  date: string;

  @ApiPropertyOptional({ description: 'Lançamento projetado (previsto)?', default: false })
  @IsOptional()
  @IsBoolean()
  isProjected?: boolean;
}

export class UpdateCashFlowDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(20)
  safra?: string;

  @ApiPropertyOptional({ enum: CashFlowType })
  @IsOptional()
  @IsEnum(CashFlowType)
  type?: CashFlowType;

  @ApiPropertyOptional({ enum: CashFlowCategory })
  @IsOptional()
  @IsEnum(CashFlowCategory)
  category?: CashFlowCategory;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(200)
  description?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  amount?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  date?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isProjected?: boolean;
}
