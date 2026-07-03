import {
  IsEnum,
  IsString,
  IsOptional,
  IsNumber,
  IsPositive,
  IsObject,
  IsDateString,
  MaxLength,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { CropType, PlotStatus } from '@prisma/client';

export class CreatePlotDto {
  @ApiProperty()
  @IsString()
  @MaxLength(160)
  name: string;

  @ApiProperty({ enum: CropType })
  @IsEnum(CropType)
  crop: CropType;

  @ApiProperty({ description: 'Área do talhão em hectares' })
  @IsNumber()
  @IsPositive()
  areaHa: number;

  @ApiPropertyOptional({ description: 'Safra, ex: "2025/2026"' })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  safra?: string;

  @ApiPropertyOptional({ enum: PlotStatus })
  @IsOptional()
  @IsEnum(PlotStatus)
  status?: PlotStatus;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  plantingDate?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  harvestDate?: string;

  @ApiPropertyOptional({ description: 'Produtividade esperada (sacas/ha)' })
  @IsOptional()
  @IsNumber()
  expectedYield?: number;

  @ApiPropertyOptional({ description: 'Latitude do centro do talhão' })
  @IsOptional()
  @IsNumber()
  latitude?: number;

  @ApiPropertyOptional({ description: 'Longitude do centro do talhão' })
  @IsOptional()
  @IsNumber()
  longitude?: number;

  @ApiPropertyOptional({ description: 'GeoJSON do talhão' })
  @IsOptional()
  @IsObject()
  geometry?: Record<string, unknown>;
}

export class UpdatePlotDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(160)
  name?: string;

  @ApiPropertyOptional({ enum: CropType })
  @IsOptional()
  @IsEnum(CropType)
  crop?: CropType;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @IsPositive()
  areaHa?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(20)
  safra?: string;

  @ApiPropertyOptional({ enum: PlotStatus })
  @IsOptional()
  @IsEnum(PlotStatus)
  status?: PlotStatus;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  plantingDate?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  harvestDate?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  expectedYield?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  latitude?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  longitude?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsObject()
  geometry?: Record<string, unknown>;
}
