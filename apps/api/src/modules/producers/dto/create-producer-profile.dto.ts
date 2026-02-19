import {
  IsNumber,
  IsArray,
  IsEnum,
  IsString,
  IsOptional,
  IsBoolean,
  Min,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { CropType, BrazilianState } from '@prisma/client';

export class CreateProducerProfileDto {
  @ApiProperty({ example: 1200000 })
  @IsNumber()
  @Min(0)
  annualRevenue: number;

  @ApiProperty({ example: 500 })
  @IsNumber()
  @Min(0)
  totalArea: number;

  @ApiProperty({ enum: CropType, isArray: true, example: ['SOJA', 'MILHO'] })
  @IsArray()
  @IsEnum(CropType, { each: true })
  crops: CropType[];

  @ApiProperty({ enum: BrazilianState, example: 'MT' })
  @IsEnum(BrazilianState)
  state: BrazilianState;

  @ApiProperty({ example: 'Sorriso' })
  @IsString()
  city: string;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  hasIrrigation?: boolean;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  hasInsurance?: boolean;

  @ApiPropertyOptional({ example: 10 })
  @IsOptional()
  @IsNumber()
  yearsInActivity?: number;

  @ApiPropertyOptional({ example: 15 })
  @IsOptional()
  @IsNumber()
  numberOfEmployees?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  companyId?: string;
}
