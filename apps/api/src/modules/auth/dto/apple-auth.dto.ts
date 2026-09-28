import { Equals, IsOptional, IsString, IsUUID, MaxLength, MinLength } from 'class-validator';

export class AppleAuthDto {
  @IsUUID() challengeId: string;
  @IsString() @MinLength(8) @MaxLength(4096) authorizationCode: string;
  @IsOptional() @IsString() @MaxLength(150) name?: string;
}

export class AppleLinkDto extends AppleAuthDto {
  @IsString() @MinLength(1) @MaxLength(256) currentPassword: string;
}

export class AppleDeleteDto extends AppleAuthDto {
  @Equals('EXCLUIR') confirmation: string;
}
