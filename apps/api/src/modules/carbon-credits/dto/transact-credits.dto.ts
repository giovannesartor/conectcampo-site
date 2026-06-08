import {
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { CarbonTransactionType } from '../carbon-enums';

export class TransactCreditsDto {
  @ApiProperty({ enum: CarbonTransactionType })
  @IsEnum(CarbonTransactionType)
  type: CarbonTransactionType;

  @ApiProperty({ description: 'Quantidade de créditos tCO₂e' })
  @IsNumber()
  @Min(0.0001)
  quantity: number;

  @ApiPropertyOptional({ description: 'Preço por crédito R$/tCO₂e' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  pricePerCredit?: number;

  @ApiPropertyOptional({ description: 'Nome do comprador/destinatário' })
  @IsOptional()
  @IsString()
  buyerName?: string;

  @ApiPropertyOptional({ description: 'CPF/CNPJ do comprador' })
  @IsOptional()
  @IsString()
  buyerDocument?: string;

  @ApiPropertyOptional({ description: 'Observações da transação' })
  @IsOptional()
  @IsString()
  notes?: string;
}
