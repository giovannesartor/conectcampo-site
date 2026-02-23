import {
  IsEnum,
  IsString,
  IsNumber,
  IsOptional,
  IsUUID,
  Min,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { DocumentType } from '@prisma/client';

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

  @ApiProperty({ example: 1048576, description: 'Tamanho em bytes' })
  @IsNumber()
  @Min(1, { message: 'Tamanho do arquivo inválido' })
  fileSize: number;

  @ApiProperty({ example: 'application/pdf' })
  @IsString()
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
  mimeType: string;

  @ApiPropertyOptional({ description: 'ID da operação associada' })
  @IsOptional()
  @IsUUID('4')
  operationId?: string;

  @ApiProperty({ enum: DocumentType, example: 'BALANCO' })
  @IsEnum(DocumentType)
  type: DocumentType;
}
