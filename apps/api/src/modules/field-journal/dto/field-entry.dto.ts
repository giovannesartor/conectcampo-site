import {
  IsEnum,
  IsString,
  IsOptional,
  IsNumber,
  IsBoolean,
  IsDateString,
  IsUUID,
  MaxLength,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { FieldActivityType } from '@prisma/client';

export class CreateFieldEntryDto {
  @ApiProperty()
  @IsUUID()
  farmId: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  plotId?: string;

  @ApiProperty({ enum: FieldActivityType })
  @IsEnum(FieldActivityType)
  type: FieldActivityType;

  @ApiProperty()
  @IsString()
  @MaxLength(200)
  title: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty()
  @IsDateString()
  date: string;

  @ApiPropertyOptional({ description: 'Insumo aplicado' })
  @IsOptional()
  @IsString()
  @MaxLength(160)
  inputName?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  inputQuantity?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(20)
  inputUnit?: string;

  @ApiPropertyOptional({ description: 'Custo da atividade (R$)' })
  @IsOptional()
  @IsNumber()
  cost?: number;

  @ApiPropertyOptional({ description: 'Lançar o custo como despesa no fluxo de caixa' })
  @IsOptional()
  @IsBoolean()
  addToCashflow?: boolean;
}

export class UpdateFieldEntryDto {
  @ApiPropertyOptional({ enum: FieldActivityType })
  @IsOptional()
  @IsEnum(FieldActivityType)
  type?: FieldActivityType;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(200)
  title?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  date?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(160)
  inputName?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  inputQuantity?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(20)
  inputUnit?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  cost?: number;
}
