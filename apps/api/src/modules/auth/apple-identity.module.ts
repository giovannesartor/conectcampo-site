import { Global, Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { AppleIdentityService } from './apple-identity.service';

@Global()
@Module({ imports: [JwtModule.register({})], providers: [AppleIdentityService], exports: [AppleIdentityService] })
export class AppleIdentityModule {}
