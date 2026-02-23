import {
  IsNumber,
  IsBoolean,
  IsOptional,
  IsArray,
  Min,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateFinancialProfileDto {
  @ApiProperty({ example: 1200000, description: 'Receita anual bruta' })
  @IsNumber()
  @Min(0)
  annualRevenue: number;

  @ApiPropertyOptional({ example: 200000, description: 'Dívida total' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  totalDebt?: number;

  @ApiPropertyOptional({
    example: [100000, 120000, 90000],
    description: 'Fluxo de caixa mensal (últimos 12 meses)',
  })
  @IsOptional()
  @IsArray()
  @IsNumber({}, { each: true })
  cashFlowMonthly?: number[];

  @ApiPropertyOptional({ example: 500000, description: 'Valor das garantias' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  guaranteeValue?: number;

  @ApiPropertyOptional({ example: false })
  @IsOptional()
  @IsBoolean()
  hasNegativeRecords?: boolean;

  @ApiPropertyOptional({ example: 5, description: 'Anos de histórico de crédito' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  creditHistoryYears?: number;
}
