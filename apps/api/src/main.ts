import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { RequestMethod, VersioningType } from '@nestjs/common';
import helmet from 'helmet';
import { AppModule } from './app.module';
import { AllExceptionsFilter } from './common/filters/http-exception.filter';
import { AppLogger } from './common/logger/app-logger.service';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';

async function bootstrap() {
  const appLogger = new AppLogger();
  const app = await NestFactory.create(AppModule, { logger: appLogger, rawBody: true });
  const logger = new Logger('Bootstrap');

  // Trust proxy (Railway) — captura o IP real do cliente via X-Forwarded-For
  app.getHttpAdapter().getInstance().set('trust proxy', 1);

  // Security — Helmet com CSP explícita
  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          scriptSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'"], // Swagger UI requer inline styles
          imgSrc: ["'self'", 'data:', 'https:'],
          connectSrc: ["'self'"],
          fontSrc: ["'self'", 'https:', 'data:'],
          objectSrc: ["'none'"],
          frameSrc: ["'none'"],
          upgradeInsecureRequests: [],
        },
      },
      crossOriginEmbedderPolicy: false, // necessário para Swagger UI funcionar
    }),
  );
  const allowedOrigins = (process.env.CORS_ORIGIN || 'http://localhost:3000')
    .split(',')
    .map((o) => o.trim());
  app.enableCors({
    origin: allowedOrigins.length === 1 ? allowedOrigins[0] : allowedOrigins,
    credentials: true,
    exposedHeaders: [
      'X-Request-Id',
      'X-RateLimit-Limit',
      'X-RateLimit-Remaining',
      'X-RateLimit-Reset',
      'Retry-After',
    ],
  });

  // Global prefix (webhooks are excluded so /webhook/asaas resolves correctly)
  // Versionamento por URI: rotas ficam em /api/v1/... e permitem /api/v2 no futuro
  // via @Version('2') nos controllers, sem quebrar a v1.
  //
  // IMPORTANTE: o prefixo NÃO deve conter a versão — o enableVersioning() abaixo já
  // adiciona "/v1". Se API_PREFIX vier como "/api/v1" (erro comum de env), as rotas
  // ficariam em "/api/v1/v1/...". Removemos qualquer sufixo de versão do prefixo para
  // garantir que "/api" e "/api/v1" produzam ambos "/api/v1/...".
  const rawPrefix = process.env.API_PREFIX || '/api';
  const prefix = rawPrefix.replace(/\/+v\d+\/?$/i, '') || '/api';
  app.setGlobalPrefix(prefix, {
    exclude: [{ path: 'webhook/:provider', method: RequestMethod.POST }],
  });
  app.enableVersioning({
    type: VersioningType.URI,
    defaultVersion: '1',
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
  const apiUrl = process.env.PUBLIC_API_URL || 'https://conectcampo.digital/api/v1';
  const config = new DocumentBuilder()
    .setTitle('ConectCampo API')
    .setDescription(
      [
        'API REST pública da **ConectCampo** — plataforma agro de crédito rural, monitoramento de safra, mercado e ESG.',
        '',
        '## Autenticação',
        'A API aceita dois métodos de autenticação:',
        '- **API Key** (recomendado para integrações servidor-a-servidor): envie o header `X-API-Key: ck_live_...`. Gere sua chave no painel em *Configurações → Chaves de API*.',
        '- **Bearer JWT** (para apps): obtenha o token em `POST /auth/login` e envie `Authorization: Bearer <token>`.',
        '',
        '## Convenções',
        '- Todas as respostas são JSON (`Content-Type: application/json`).',
        '- Datas em ISO-8601 (UTC). Valores monetários em BRL.',
        '- Erros seguem o padrão `{ statusCode, message, error }` com o código HTTP correspondente.',
        '',
        '## Rate limit',
        'Limite padrão de **60 requisições/minuto** por IP/chave. Ao exceder, a API responde `429 Too Many Requests`.',
      ].join('\n'),
    )
    .setVersion('1.0.0')
    .setContact('Suporte ConectCampo', 'https://conectcampo.digital/contato', 'api@conectcampo.digital')
    .setLicense('Proprietária — ConectCampo', 'https://conectcampo.digital/legal')
    .setTermsOfService('https://conectcampo.digital/legal')
    .addServer(apiUrl, 'Produção')
    .addServer('http://localhost:3001/api/v1', 'Local')
    .setExternalDoc('Guia de integração', 'https://conectcampo.digital/api-docs')
    .addBearerAuth(
      { type: 'http', scheme: 'bearer', bearerFormat: 'JWT', description: 'Token JWT obtido em POST /auth/login' },
      'bearer',
    )
    .addApiKey(
      { type: 'apiKey', name: 'X-API-Key', in: 'header', description: 'Chave de API (ck_live_...) para integrações' },
      'api-key',
    )
    .addTag('auth', 'Autenticação, tokens e sessão')
    .addTag('users', 'Gerenciamento de usuários')
    .addTag('api-keys', 'Chaves de API para integrações')
    .addTag('producers', 'Perfil de produtores')
    .addTag('farms', 'Fazendas e talhões (áreas)')
    .addTag('field-journal', 'Caderno de campo / diário de operações')
    .addTag('ndvi', 'Monitoramento de safra por satélite (NDVI)')
    .addTag('weather', 'Previsão do tempo e climatologia')
    .addTag('climate-score', 'Score climático da área')
    .addTag('operations', 'Operações de crédito')
    .addTag('cpr', 'Cédula de Produto Rural (CPR)')
    .addTag('scoring', 'Motor de score de crédito')
    .addTag('matching', 'Motor de match com parceiros')
    .addTag('partners', 'Instituições financeiras parceiras')
    .addTag('documents', 'Data room / documentos')
    .addTag('smart-docs', 'Extração inteligente de documentos')
    .addTag('marketplace', 'Marketplace de insumos e grãos (escrow)')
    .addTag('sales-contracts', 'Contratos de venda')
    .addTag('barter', 'Operações de barter (troca)')
    .addTag('quotes', 'Cotações de commodities e câmbio')
    .addTag('cashflow', 'Fluxo de caixa')
    .addTag('calendar', 'Calendário financeiro e agrícola')
    .addTag('subscriptions', 'Assinaturas e planos')
    .addTag('carbon-credits', 'Créditos de carbono e projetos ESG')
    .addTag('quantovale', 'Integração QuantoVale — valuation agro')
    .addTag('notifications', 'Notificações do usuário')
    .addTag('metrics', 'Métricas e indicadores')
    .addTag('webhooks', 'Webhooks de gateways de pagamento')
    .addTag('admin', 'Painel administrativo')
    .addTag('health', 'Health checks e status')
    .build();
  const document = SwaggerModule.createDocument(app, config);
  // Servidor relativo primeiro: permite "Try it" no mesmo domínio via proxy.
  document.servers = [
    { url: '/api/v1', description: 'Mesmo domínio (proxy)' },
    ...(document.servers ?? []),
  ];
  SwaggerModule.setup('docs', app, document, {
    jsonDocumentUrl: 'docs-json',
    yamlDocumentUrl: 'docs-yaml',
    customSiteTitle: 'ConectCampo API — Referência',
    swaggerOptions: {
      persistAuthorization: true,
      docExpansion: 'none',
      filter: true,
      displayRequestDuration: true,
      tagsSorter: 'alpha',
      operationsSorter: 'alpha',
    },
  });

  // Expõe a especificação OpenAPI numa rota sob o prefixo /api/v1 — garantidamente
  // acessível pelo mesmo proxy que serve o restante da API (evita 404 atrás de ingress).
  const expressInstance = app.getHttpAdapter().getInstance();
  expressInstance.get('/api/v1/openapi.json', (_req: any, res: any) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.json(document);
  });

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
  logger.log(`🧩 OpenAPI JSON: http://localhost:${port}/api/v1/openapi.json`);
}

bootstrap();
