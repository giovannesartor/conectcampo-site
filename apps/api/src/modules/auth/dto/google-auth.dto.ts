import { IsString, IsUUID, MaxLength, MinLength } from 'class-validator';

export class GoogleAuthDto {
  @IsUUID() challengeId: string;
  @IsString() @MinLength(100) @MaxLength(8192) credential: string;
}

export class GoogleLinkDto extends GoogleAuthDto {
  @IsString() @MinLength(1) @MaxLength(256) currentPassword: string;
}
