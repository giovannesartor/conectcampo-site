import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsArray, IsIn, IsInt, Min, Max, MaxLength } from 'class-validator';

export class CreateApiKeyDto {
  @ApiPropertyOptional({ description: 'Nome de identificação da chave', example: 'Integração ERP' })
  @IsOptional()
  @IsString()
  @MaxLength(80)
  name?: string;

  @ApiPropertyOptional({
    description: 'Permissões da chave',
    enum: ['read', 'write'],
    isArray: true,
    example: ['read'],
    default: ['read', 'write'],
  })
  @IsOptional()
  @IsArray()
  @IsIn(['read', 'write'], { each: true })
  scopes?: ('read' | 'write')[];

  @ApiPropertyOptional({ description: 'Expiração em dias (omitir = sem expiração)', minimum: 1, maximum: 3650 })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(3650)
  expiresInDays?: number;
}
