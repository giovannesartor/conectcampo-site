import { IsString, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ExchangeCodeDto {
  @ApiProperty({ description: 'Código de autorização recebido do QuantoVale' })
  @IsString()
  @IsNotEmpty()
  code: string;

  @ApiProperty({ description: 'Redirect URI usada para iniciar o fluxo' })
  @IsString()
  @IsNotEmpty()
  redirectUri: string;
}
