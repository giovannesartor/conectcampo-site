import { IsInt, IsNumber, IsOptional, IsString, Min, Max } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateCarbonInventoryDto {
  @ApiProperty({ description: 'Ano de referência do inventário' })
  @IsInt()
  @Min(2000)
  @Max(2100)
  year: number;

  @ApiProperty({ description: 'Emissões medidas tCO₂e' })
  @IsNumber()
  @Min(0)
  measuredEmissions: number;

  @ApiProperty({ description: 'Emissões da linha de base tCO₂e' })
  @IsNumber()
  @Min(0)
  baselineEmissions: number;

  @ApiPropertyOptional({ description: 'Leakage (vazamento) tCO₂e', default: 0 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  leakage?: number;

  @ApiPropertyOptional({ description: 'Buffer de reserva tCO₂e', default: 0 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  buffer?: number;

  @ApiPropertyOptional({ description: 'Metodologia de medição' })
  @IsOptional()
  @IsString()
  methodology?: string;

  @ApiPropertyOptional({ description: 'Verificador responsável' })
  @IsOptional()
  @IsString()
  verifiedBy?: string;
}
