import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { GoogleIdentityService } from './google-identity.service';

// Isolate provider JWT verification from the application's HMAC session secret.
@Module({
  imports: [JwtModule.register({})],
  providers: [GoogleIdentityService],
  exports: [GoogleIdentityService],
})
export class GoogleIdentityModule {}
