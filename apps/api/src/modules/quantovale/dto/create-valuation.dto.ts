import { IsString, IsOptional, IsNumber, IsNotEmpty } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateValuationDto {
  @ApiProperty({ example: 'Empresa Exemplo Ltda' })
  @IsString()
  @IsNotEmpty()
  company_name: string;

  @ApiProperty({ example: 'profissional' })
  @IsString()
  @IsNotEmpty()
  plan: string;

  @ApiPropertyOptional({ example: 5000000 })
  @IsOptional()
  @IsNumber()
  annual_revenue?: number;

  @ApiPropertyOptional({ example: 3000000 })
  @IsOptional()
  @IsNumber()
  annual_costs?: number;

  @ApiPropertyOptional({ example: 800000 })
  @IsOptional()
  @IsNumber()
  annual_expenses?: number;

  @ApiPropertyOptional({ example: 'Agronegócio' })
  @IsOptional()
  @IsString()
  sector?: string;
}
