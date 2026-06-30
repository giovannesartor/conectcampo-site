import {
  IsEnum,
  IsString,
  IsNumber,
  IsOptional,
  IsUUID,
  IsIn,
  Min,
  Max,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { DocumentType } from '@prisma/client';

// Tipos de arquivo permitidos no data room
export const ALLOWED_MIME_TYPES = [
  'application/pdf',
  'image/jpeg',
  'image/png',
  'image/webp',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // .docx
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
  'text/csv',
];

// Tamanho máximo: 25 MB
export const MAX_FILE_SIZE = 25 * 1024 * 1024;

export class CreateDocumentDto {
  @ApiPropertyOptional({ description: 'ID da operação associada' })
  @IsOptional()
  @IsUUID('4', { message: 'operationId deve ser um UUID válido' })
  operationId?: string;

  @ApiProperty({ enum: DocumentType, example: 'BALANCO' })
  @IsEnum(DocumentType, { message: 'Tipo de documento inválido' })
  type: DocumentType;

  @ApiProperty({ example: 'balanco-2025.pdf' })
  @IsString()
  fileName: string;

  @ApiProperty({ example: 'documents/user-123/balanco-2025.pdf' })
  @IsString()
  fileKey: string;

  @ApiProperty({ example: 'https://s3.example.com/documents/balanco-2025.pdf' })
  @IsString()
  fileUrl: string;

  @ApiProperty({ example: 1048576, description: 'Tamanho em bytes (máx. 25 MB)' })
  @IsNumber()
  @Min(1, { message: 'Tamanho do arquivo inválido' })
  @Max(MAX_FILE_SIZE, { message: 'Arquivo excede o limite de 25 MB' })
  fileSize: number;

  @ApiProperty({ example: 'application/pdf' })
  @IsString()
  @IsIn(ALLOWED_MIME_TYPES, { message: 'Tipo de arquivo não permitido' })
  mimeType: string;

  @ApiPropertyOptional({ example: 'sha256:abc123...', description: 'Checksum SHA-256' })
  @IsOptional()
  @IsString()
  checksum?: string;
}

export class RequestPresignedUrlDto {
  @ApiProperty({ example: 'balanco-2025.pdf' })
  @IsString()
  fileName: string;

  @ApiProperty({ example: 'application/pdf' })
  @IsString()
  @IsIn(ALLOWED_MIME_TYPES, { message: 'Tipo de arquivo não permitido' })
  mimeType: string;

  @ApiPropertyOptional({ description: 'ID da operação associada' })
  @IsOptional()
  @IsUUID('4')
  operationId?: string;

  @ApiProperty({ enum: DocumentType, example: 'BALANCO' })
  @IsEnum(DocumentType)
  type: DocumentType;
}
