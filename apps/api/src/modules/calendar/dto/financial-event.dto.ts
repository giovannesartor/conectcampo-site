import {
  IsEnum,
  IsString,
  IsOptional,
  IsNumber,
  IsInt,
  IsDateString,
  Min,
  MaxLength,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { FinancialEventType, FinancialEventStatus } from '@prisma/client';

export class CreateFinancialEventDto {
  @ApiProperty()
  @IsString()
  @MaxLength(200)
  title: string;

  @ApiProperty({ enum: FinancialEventType })
  @IsEnum(FinancialEventType)
  type: FinancialEventType;

  @ApiPropertyOptional({ description: 'Valor (R$)' })
  @IsOptional()
  @IsNumber()
  amount?: number;

  @ApiProperty()
  @IsDateString()
  dueDate: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiPropertyOptional({ description: 'Dias de antecedência do lembrete', default: 3 })
  @IsOptional()
  @IsInt()
  @Min(0)
  reminderDays?: number;
}

export class UpdateFinancialEventDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(200)
  title?: string;

  @ApiPropertyOptional({ enum: FinancialEventType })
  @IsOptional()
  @IsEnum(FinancialEventType)
  type?: FinancialEventType;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  amount?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  dueDate?: string;

  @ApiPropertyOptional({ enum: FinancialEventStatus })
  @IsOptional()
  @IsEnum(FinancialEventStatus)
  status?: FinancialEventStatus;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Min(0)
  reminderDays?: number;
}
