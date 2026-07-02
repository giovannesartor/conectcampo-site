import {
  IsEnum,
  IsString,
  IsOptional,
  MaxLength,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { DocExtractionType } from '@prisma/client';

export class CreateExtractionDto {
  @ApiProperty({ description: 'Nome do arquivo / documento' })
  @IsString()
  @MaxLength(200)
  fileName: string;

  @ApiPropertyOptional({ enum: DocExtractionType })
  @IsOptional()
  @IsEnum(DocExtractionType)
  docType?: DocExtractionType;

  @ApiPropertyOptional({ description: 'Texto do documento (OCR/colado) para extração' })
  @IsOptional()
  @IsString()
  rawText?: string;
}
