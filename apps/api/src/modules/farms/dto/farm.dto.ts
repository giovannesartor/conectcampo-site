import {
  IsEnum,
  IsString,
  IsOptional,
  IsNumber,
  IsPositive,
  IsObject,
  MaxLength,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { BrazilianState } from '@prisma/client';

export class CreateFarmDto {
  @ApiProperty({ description: 'Nome da fazenda / propriedade' })
  @IsString()
  @MaxLength(200)
  name: string;

  @ApiPropertyOptional({ description: 'Número do Cadastro Ambiental Rural (CAR)' })
  @IsOptional()
  @IsString()
  @MaxLength(120)
  carNumero?: string;

  @ApiProperty({ enum: BrazilianState })
  @IsEnum(BrazilianState)
  state: BrazilianState;

  @ApiProperty()
  @IsString()
  @MaxLength(120)
  city: string;

  @ApiProperty({ description: 'Área total em hectares' })
  @IsNumber()
  @IsPositive()
  totalAreaHa: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  latitude?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  longitude?: number;

  @ApiPropertyOptional({ description: 'GeoJSON (Polygon/MultiPolygon)' })
  @IsOptional()
  @IsObject()
  geometry?: Record<string, unknown>;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;
}

export class UpdateFarmDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(200)
  name?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(120)
  carNumero?: string;

  @ApiPropertyOptional({ enum: BrazilianState })
  @IsOptional()
  @IsEnum(BrazilianState)
  state?: BrazilianState;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(120)
  city?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @IsPositive()
  totalAreaHa?: number;

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

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;
}
