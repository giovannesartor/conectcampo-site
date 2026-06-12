import { PartialType } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { CreateCprDto } from './create-cpr.dto';

export class UpdateCprDto extends PartialType(CreateCprDto) {
  @ApiPropertyOptional({ description: 'Número do cartório de registro' })
  @IsOptional()
  @IsString()
  cartorioNome?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  cartorioRegistroNum?: string;
}
