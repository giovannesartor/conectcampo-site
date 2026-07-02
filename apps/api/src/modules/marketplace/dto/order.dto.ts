import {
  IsUUID,
  IsNumber,
  IsPositive,
  IsOptional,
  IsString,
  IsInt,
  Min,
  Max,
  MaxLength,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateOrderDto {
  @ApiProperty({ description: 'ID da oferta (listing) de venda' })
  @IsUUID()
  listingId: string;

  @ApiProperty({ description: 'Quantidade a comprar (na unidade da oferta)' })
  @IsNumber()
  @IsPositive()
  quantity: number;
}

export class ShipOrderDto {
  @ApiPropertyOptional({ description: 'Dados de envio / transporte / rastreio' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  shippingInfo?: string;
}

export class DisputeOrderDto {
  @ApiProperty({ description: 'Motivo da disputa' })
  @IsString()
  @MaxLength(500)
  reason: string;
}

export class CreateReviewDto {
  @ApiProperty({ description: 'Nota de 1 a 5' })
  @IsInt()
  @Min(1)
  @Max(5)
  rating: number;

  @ApiPropertyOptional({ description: 'Comentário' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  comment?: string;
}
