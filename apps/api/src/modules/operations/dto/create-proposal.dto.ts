import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNumber, IsString, IsUUID, Max, Min, IsOptional, MaxLength } from 'class-validator';

export class CreateProposalDto {
  @ApiProperty({ description: 'ID da operação alvo da proposta' })
  @IsUUID()
  operationId: string;

  @ApiProperty({ description: 'Valor proposto (R$)', example: 500000 })
  @IsNumber()
  @Min(1000)
  amount: number;

  @ApiProperty({ description: 'Taxa de juros (% a.a.)', example: 12.5 })
  @IsNumber()
  @Min(0)
  @Max(1000)
  interestRate: number;

  @ApiProperty({ description: 'Prazo em meses', example: 24 })
  @IsNumber()
  @Min(1)
  @Max(360)
  termMonths: number;

  @ApiPropertyOptional({ description: 'Condições / observações' })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  notes?: string;
}
