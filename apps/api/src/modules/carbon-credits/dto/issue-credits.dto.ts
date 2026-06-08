import { IsInt, IsNumber, IsOptional, IsString, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class IssueCreditsDto {
  @ApiProperty({ description: 'Ano de referência (vintage) dos créditos' })
  @IsInt()
  @Min(2000)
  vintage: number;

  @ApiProperty({ description: 'Quantidade de créditos tCO₂e' })
  @IsNumber()
  @Min(0.0001)
  quantity: number;

  @ApiPropertyOptional({ description: 'Preço por crédito R$/tCO₂e' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  pricePerCredit?: number;

  @ApiPropertyOptional({ description: 'Número de série no registro externo' })
  @IsOptional()
  @IsString()
  serialNumber?: string;
}
