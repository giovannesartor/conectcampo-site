import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import helmet from 'helmet';
import { AppModule } from './app.module';

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  const app = await NestFactory.create(AppModule);

  // Security
  app.use(helmet());
  const allowedOrigins = (process.env.CORS_ORIGIN || 'http://localhost:3000')
    .split(',')
    .map((o) => o.trim());
  app.enableCors({
    origin: allowedOrigins.length === 1 ? allowedOrigins[0] : allowedOrigins,
    credentials: true,
  });

  // Global prefix
  const prefix = process.env.API_PREFIX || '/api/v1';
  app.setGlobalPrefix(prefix);

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
    logger.warn('⚠️  JWT_SECRET is NOT set — authentication will fail!');
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
