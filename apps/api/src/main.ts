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
  app.enableCors({
    origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
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

  const port = process.env.API_PORT || 3001;
  await app.listen(port);
  logger.log(`🚀 ConectCampo API running on port ${port}`);
  logger.log(`📚 Swagger docs: http://localhost:${port}/docs`);
}

bootstrap();
