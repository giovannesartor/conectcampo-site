import { IsIn, IsOptional, IsString, Matches, MaxLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class RegisterPushDeviceDto {
  @ApiProperty({ description: 'Token APNs hexadecimal fornecido pelo iOS' })
  @IsString()
  @Matches(/^[A-Fa-f0-9]{32,256}$/)
  token: string;

  @ApiProperty({ enum: ['ios'] })
  @IsIn(['ios'])
  platform: 'ios';

  @ApiProperty({ enum: ['PRODUCTION', 'SANDBOX'] })
  @IsIn(['PRODUCTION', 'SANDBOX'])
  environment: 'PRODUCTION' | 'SANDBOX';

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(40)
  appVersion?: string;
}

export class UnregisterPushDeviceDto {
  @ApiProperty({ description: 'Token APNs que deixará de receber notificações' })
  @IsString()
  @Matches(/^[A-Fa-f0-9]{32,256}$/)
  token: string;
}
