import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { NestExpressApplication } from '@nestjs/platform-express';
import { Reflector } from '@nestjs/core';
import { join } from 'path';
import * as cookieParser from 'cookie-parser';
import * as compression from 'compression';
import helmet from 'helmet';
import { AppModule } from './app.module';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';
import { PermissionsGuard } from './common/guards/permissions.guard';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';
import { TimeoutInterceptor } from './common/interceptors/timeout.interceptor';
import { CorrelationIdInterceptor } from './common/interceptors/correlation-id.interceptor';
import { validateEnvironment } from './common/config/env-validator';

async function bootstrap() {
  validateEnvironment();

  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    logger: process.env.NODE_ENV === 'production'
      ? ['error', 'warn', 'log']
      : ['error', 'warn', 'log', 'debug', 'verbose'],
  });

  // Global prefix with versioning
  app.setGlobalPrefix('api/v1');

  // Cookie parser (needed by CsrfMiddleware)
  app.use(cookieParser());

  // Gzip compression
  app.use(compression());

  // Security headers
  app.use(helmet({
    contentSecurityPolicy: process.env.NODE_ENV === 'production' ? undefined : false,
    crossOriginEmbedderPolicy: false,
  }));

  // CORS
  app.enableCors({
    origin: process.env.CORS_ORIGIN?.split(',') || [
      'http://localhost:3000',
      'http://localhost:3001',
      'http://localhost:3002',
      'http://localhost:3003',
    ],
    credentials: true,
  });

  // Serve uploaded files statically
  app.useStaticAssets(join(process.cwd(), 'uploads'), { prefix: '/uploads' });

  // Global exception filter
  app.useGlobalFilters(new AllExceptionsFilter());

  // Global interceptors
  app.useGlobalInterceptors(
    new CorrelationIdInterceptor(),
    new LoggingInterceptor(),
    new TimeoutInterceptor(),
  );

  // Global guards
  const reflector = app.get(Reflector);
  app.useGlobalGuards(new PermissionsGuard(reflector));

  // Global validation pipe
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

  // Swagger documentation
  const config = new DocumentBuilder()
    .setTitle('NexaROS API')
    .setDescription('NexaROS — AI-Powered Restaurant Operating System API')
    .setVersion('0.1.0')
    .addBearerAuth()
    .addTag('auth', 'Authentication endpoints')
    .addTag('tenants', 'Tenant management')
    .addTag('branches', 'Branch management')
    .addTag('users', 'User management')
    .addTag('roles', 'Role & Permission management')
    .addTag('menu', 'Menu management')
    .addTag('orders', 'Order management')
    .addTag('tables', 'Table management')
    .addTag('inventory', 'Inventory management')
    .addTag('payments', 'Payment processing')
    .addTag('invoices', 'Invoice generation')
    .addTag('sync', 'Offline sync endpoints')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('docs', app, document);

  // Graceful shutdown
  const server = app.getHttpServer();
  const shutdownSignals: NodeJS.Signals[] = ['SIGTERM', 'SIGINT'];

  for (const signal of shutdownSignals) {
    process.on(signal, async () => {
      console.log(`\n${signal} received. Shutting down gracefully...`);
      server.close(() => {
        console.log('HTTP server closed.');
      });
      await app.close();
      console.log('Application closed.');
      process.exit(0);
    });
  }

  const port = process.env.PORT || 4000;
  await app.listen(port);

  console.log(`\n  NexaROS Backend running on: http://localhost:${port}`);
  console.log(`  API Docs:                 http://localhost:${port}/docs`);
  console.log(`  Environment:              ${process.env.NODE_ENV || 'development'}\n`);
}

bootstrap();
