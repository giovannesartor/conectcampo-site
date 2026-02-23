import {
  IsEnum,
  IsNumber,
  IsString,
  IsOptional,
  IsArray,
  Min,
  Max,
  MinLength,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { OperationType, GuaranteeType } from '@prisma/client';

export class CreateOperationDto {
  @ApiProperty({ enum: OperationType, example: 'CUSTEIO' })
  @IsEnum(OperationType, { message: 'Tipo de operação inválido' })
  type: OperationType;

  @ApiProperty({ example: 500000, description: 'Valor solicitado em reais' })
  @IsNumber({}, { message: 'Valor deve ser numérico' })
  @Min(1000, { message: 'Valor mínimo: R$ 1.000' })
  requestedAmount: number;

  @ApiProperty({ example: 12, description: 'Prazo em meses' })
  @IsNumber()
  @Min(1, { message: 'Prazo mínimo: 1 mês' })
  @Max(360, { message: 'Prazo máximo: 360 meses' })
  termMonths: number;

  @ApiProperty({ example: 'Custeio de safra 2026/2027' })
  @IsString()
  @MinLength(5, { message: 'Descreva a finalidade (mínimo 5 caracteres)' })
  purpose: string;

  @ApiPropertyOptional({ enum: GuaranteeType, isArray: true, example: ['PENHOR_SAFRA', 'IMOVEL_RURAL'] })
  @IsOptional()
  @IsArray()
  @IsEnum(GuaranteeType, { each: true, message: 'Tipo de garantia inválido' })
  guarantees?: GuaranteeType[];

  @ApiPropertyOptional({ example: 800000, description: 'Valor total das garantias' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  guaranteeValue?: number;

  @ApiPropertyOptional({ example: 'Observações adicionais sobre a operação' })
  @IsOptional()
  @IsString()
  notes?: string;
}
