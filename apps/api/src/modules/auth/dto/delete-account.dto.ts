import { IsString, MinLength, Equals } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class DeleteAccountDto {
  @ApiProperty({ description: 'Senha atual para confirmar a identidade' })
  @IsString()
  @MinLength(1)
  currentPassword: string;

  @ApiProperty({ example: 'EXCLUIR' })
  @IsString()
  @Equals('EXCLUIR', { message: 'Digite EXCLUIR para confirmar' })
  confirmation: string;
}
