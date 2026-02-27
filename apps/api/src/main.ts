import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { RequestMethod } from '@nestjs/common';
import helmet from 'helmet';
import { AppModule } from './app.module';
import { AllExceptionsFilter } from './common/filters/http-exception.filter';
import { AppLogger } from './common/logger/app-logger.service';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';

async function bootstrap() {
  const appLogger = new AppLogger();
  const app = await NestFactory.create(AppModule, { logger: appLogger });
  const logger = new Logger('Bootstrap');

  // Security
  app.use(helmet());
  const allowedOrigins = (process.env.CORS_ORIGIN || 'http://localhost:3000')
    .split(',')
    .map((o) => o.trim());
  app.enableCors({
    origin: allowedOrigins.length === 1 ? allowedOrigins[0] : allowedOrigins,
    credentials: true,
  });

  // Global prefix (webhooks are excluded so /webhook/asaas resolves correctly)
  const prefix = process.env.API_PREFIX || '/api/v1';
  app.setGlobalPrefix(prefix, {
    exclude: [{ path: 'webhook/:provider', method: RequestMethod.POST }],
  });

  // Global exception filter
  app.useGlobalFilters(new AllExceptionsFilter());

  // Global HTTP logging interceptor (every request logged to Railway)
  app.useGlobalInterceptors(new LoggingInterceptor());

  // Validation
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  // Swagger
  const config = new DocumentBuilder()
    .setTitle('ConectCampo API')
    .setDescription('Marketplace SaaS de crédito agro')
    .setVersion('1.0')
    .addBearerAuth()
    .addTag('auth', 'Autenticação e autorização')
    .addTag('producers', 'Perfil de produtores')
    .addTag('operations', 'Operações de crédito')
    .addTag('scoring', 'Motor de score')
    .addTag('matching', 'Motor de match')
    .addTag('partners', 'Instituições financeiras parceiras')
    .addTag('documents', 'Data room / documentos')
    .addTag('subscriptions', 'Assinaturas e planos')
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('docs', app, document);

  // Validate critical environment variables
  const jwtSecret = process.env.JWT_SECRET;
  if (!jwtSecret) {
    logger.error('❌ JWT_SECRET is NOT set — refusing to start!');
    process.exit(1);
  } else {
    logger.log(`✅ JWT_SECRET is set (${jwtSecret.length} chars)`);
  }
  logger.log(`✅ CORS_ORIGIN: ${process.env.CORS_ORIGIN || '(default: http://localhost:3000)'}`);
  logger.log(`✅ DATABASE_URL: ${process.env.DATABASE_URL ? 'set' : 'NOT SET'}`);

  const port = process.env.PORT || process.env.API_PORT || 3001;
  await app.listen(port);
  logger.log(`🚀 ConectCampo API running on port ${port}`);
  logger.log(`📚 Swagger docs: http://localhost:${port}/docs`);
}

bootstrap();
