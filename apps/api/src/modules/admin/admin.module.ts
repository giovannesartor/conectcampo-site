import { Module } from '@nestjs/common';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';
import { AuditModule } from '../audit/audit.module';
import { GoogleIdentityModule } from '../auth/google-identity.module';

@Module({
  imports: [AuditModule, GoogleIdentityModule],
  controllers: [AdminController],
  providers: [AdminService],
})
export class AdminModule {}
