import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { PrismaModule } from './prisma/prisma.module';
import { MailModule } from './modules/mail/mail.module';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { ProducersModule } from './modules/producers/producers.module';
import { OperationsModule } from './modules/operations/operations.module';
import { ScoringModule } from './modules/scoring/scoring.module';
import { MatchingModule } from './modules/matching/matching.module';
import { PartnersModule } from './modules/partners/partners.module';
import { DocumentsModule } from './modules/documents/documents.module';
import { SubscriptionsModule } from './modules/subscriptions/subscriptions.module';
import { AuditModule } from './modules/audit/audit.module';
import { AdminModule } from './modules/admin/admin.module';
import { HealthModule } from './modules/health/health.module';
import { SeedModule } from './modules/seed/seed.module';
import { JwtAuthGuard } from './modules/auth/guards/jwt-auth.guard';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '../../.env',
    }),
    PrismaModule,
    MailModule,
    AuthModule,
    UsersModule,
    ProducersModule,
    OperationsModule,
    ScoringModule,
    MatchingModule,
    PartnersModule,
    DocumentsModule,
    SubscriptionsModule,
    AuditModule,
    AdminModule,
    HealthModule,
    SeedModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
  ],
})
export class AppModule {}
