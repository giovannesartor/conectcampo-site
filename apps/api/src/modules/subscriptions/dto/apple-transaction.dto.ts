import { IsIn, IsString, MaxLength, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class VerifyAppleTransactionDto {
  @ApiProperty({ description: 'JWS assinado pelo StoreKit 2' })
  @IsString()
  @MinLength(100)
  @MaxLength(20000)
  signedTransaction: string;

  @ApiProperty({ enum: ['PURCHASE', 'RESTORE'] })
  @IsString()
  @IsIn(['PURCHASE', 'RESTORE'])
  source: 'PURCHASE' | 'RESTORE';
}

export class AppleServerNotificationDto {
  @ApiProperty({ description: 'App Store Server Notification V2' })
  @IsString()
  @MinLength(100)
  @MaxLength(50000)
  signedPayload: string;
}
