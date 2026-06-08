import {
  IsString,
  IsOptional,
  IsEnum,
  IsNumber,
  IsInt,
  IsPositive,
  Min,
  Max,
  IsDecimal,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { BrazilianState } from '@prisma/client';
import { CarbonProjectType, CarbonStandard } from '../carbon-enums';

export class CreateCarbonProjectDto {
  @ApiProperty({ description: 'Nome do projeto de carbono' })
  @IsString()
  name: string;

  @ApiPropertyOptional({ description: 'Descrição detalhada do projeto' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ enum: CarbonProjectType })
  @IsEnum(CarbonProjectType)
  projectType: CarbonProjectType;

  @ApiProperty({ enum: CarbonStandard })
  @IsEnum(CarbonStandard)
  standard: CarbonStandard;

  @ApiProperty({ enum: BrazilianState })
  @IsEnum(BrazilianState)
  state: BrazilianState;

  @ApiProperty()
  @IsString()
  city: string;

  @ApiPropertyOptional({ description: 'Latitude GPS' })
  @IsOptional()
  @IsNumber()
  latitude?: number;

  @ApiPropertyOptional({ description: 'Longitude GPS' })
  @IsOptional()
  @IsNumber()
  longitude?: number;

  @ApiProperty({ description: 'Área total do projeto em hectares' })
  @IsNumber()
  @IsPositive()
  totalAreaHa: number;

  @ApiProperty({ description: 'Área elegível para crédito em hectares' })
  @IsNumber()
  @IsPositive()
  eligibleAreaHa: number;

  @ApiProperty({ description: 'Emissões da linha de base tCO₂e/ano' })
  @IsNumber()
  @Min(0)
  baselineEmissions: number;

  @ApiProperty({ description: 'Redução projetada tCO₂e/ano' })
  @IsNumber()
  @Min(0)
  projectedReduction: number;

  @ApiPropertyOptional({ description: 'Duração do projeto em anos', default: 20 })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(100)
  projectDurationYears?: number;

  @ApiPropertyOptional({ description: 'Entidade verificadora' })
  @IsOptional()
  @IsString()
  verificationBody?: string;

  @ApiPropertyOptional({ description: 'Preço estimado por crédito R$/tCO₂e' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  estimatedCreditPrice?: number;
}
