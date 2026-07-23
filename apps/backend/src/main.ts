import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
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
import { RedisIoAdapter } from './common/redis/redis-io.adapter';
import { WhatsAppWebhookService } from './modules/whatsapp/services/whatsapp-webhook.service';

async function bootstrap() {
  validateEnvironment();

  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    logger: process.env.NODE_ENV === 'production'
      ? ['error', 'warn', 'log']
      : ['error', 'warn', 'log', 'debug', 'verbose'],
    rawBody: true, // Enable raw body capture for webhook signature verification
  });

  // Global prefix with versioning
  app.setGlobalPrefix('api/v1');

  // ── Health check (outside global prefix for simple access) ──
  app.getHttpAdapter().get('/health', (_req: any, res: any) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  // ── WhatsApp Webhook (outside global prefix, at /webhook) ──
  // This route must be registered BEFORE the global prefix
  const webhookService = app.get(WhatsAppWebhookService);
  const webhookLogger = new Logger('WhatsAppWebhook');

  app.getHttpAdapter().get('/webhook', (req: any, res: any) => {
    const { 'hub.mode': mode, 'hub.verify_token': token, 'hub.challenge': challenge } = req.query;
    webhookLogger.log(`[VERIFY] mode=${mode} token=${token?.substring(0, 10)}...`);

    if (mode !== 'subscribe') {
      webhookLogger.warn('[VERIFY] Invalid mode');
      res.status(403).send('Forbidden: invalid mode');
      return;
    }

    if (webhookService.verifyToken(token)) {
      webhookLogger.log('[VERIFY] ✅ Verified successfully');
      res.status(200).send(challenge);
    } else {
      webhookLogger.warn('[VERIFY] ❌ Invalid verify token');
      res.status(403).send('Forbidden: invalid verify token');
    }
  });

  app.getHttpAdapter().post('/webhook', (req: any, res: any) => {
    const startTime = Date.now();
    const signature = req.headers['x-hub-signature-256'];
    const requestId = req.headers['x-hub-request-id'];

    // Summarize event for logging
    const body = req.body;
    let summary = 'unknown';
    try {
      const entries = body?.entry || [];
      let messages = 0, statuses = 0;
      for (const entry of entries) {
        for (const change of entry.changes || []) {
          if (change.value?.messages) messages += change.value.messages.length;
          if (change.value?.statuses) statuses += change.value.statuses.length;
        }
      }
      summary = `messages=${messages} statuses=${statuses}`;
    } catch {}

    webhookLogger.log(`[INCOMING] ${summary} | requestId=${requestId || 'none'}`);

    // Signature verification
    if (req.rawBody && signature) {
      const crypto = require('crypto');
      const appSecret = process.env.WHATSAPP_APP_SECRET;
      if (appSecret) {
        const expected = crypto.createHmac('sha256', appSecret).update(req.rawBody).digest('hex');
        if (!crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(`sha256=${expected}`))) {
          webhookLogger.error('[SIG] ❌ Signature verification FAILED');
          res.status(403).json({ status: 'invalid_signature' });
          return;
        }
        webhookLogger.debug('[SIG] ✅ Signature verified');
      }
    }

    // Process webhook
    webhookService.processWebhook(body)
      .then(() => {
        const elapsed = Date.now() - startTime;
        webhookLogger.log(`[OK] Processed in ${elapsed}ms`);
        res.status(200).json({ status: 'ok' });
      })
      .catch((error) => {
        webhookLogger.error(`[ERROR] ${error.message}`);
        // Still return 200 to prevent Meta from retrying
        res.status(200).json({ status: 'ok' });
      });
  });

  // Lightweight liveness endpoint (used by admin portal connection indicator)
  app.getHttpAdapter().get('/api/v1', (_req: any, res: any) => {
    res.status(200).json({ status: 'ok', service: 'nexaros-api', timestamp: new Date().toISOString() });
  });

  // Cookie parser (needed by CsrfMiddleware)
  app.use(cookieParser());

  // Gzip compression
  app.use(compression());

  // Security headers
  app.use(helmet({
    contentSecurityPolicy: process.env.NODE_ENV === 'production' ? {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", 'data:', 'https:'],
        connectSrc: ["'self'"],
        fontSrc: ["'self'"],
        objectSrc: ["'none'"],
        frameAncestors: ["'none'"],
      },
    } : false,
    crossOriginEmbedderPolicy: false,
  }));

  // CORS
  const corsOrigins = process.env.CORS_ORIGIN?.split(',').filter(Boolean) || [];
  if (process.env.NODE_ENV === 'production' && corsOrigins.length === 0) {
    console.warn('  CORS: CORS_ORIGIN not set in production — CORS disabled');
    app.enableCors({ origin: false, credentials: true });
  } else {
    app.enableCors({
      origin: corsOrigins.length > 0 ? corsOrigins : [
        'http://localhost:3000',
        'http://localhost:3001',
        'http://localhost:3002',
        'http://localhost:3003',
      ],
      credentials: true,
    });
  }

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

  // WebSocket Redis adapter for multi-instance scaling
  const redisIoAdapter = new RedisIoAdapter(app);
  try {
    await redisIoAdapter.connectToRedis();
    app.useWebSocketAdapter(redisIoAdapter);
    console.log('  WebSocket Redis adapter: connected');
  } catch (err) {
    console.warn('  WebSocket Redis adapter: unavailable, using default in-memory adapter');
  }

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
    .addTag('admin', 'Super Admin management')
    .addTag('tenants', 'Tenant management')
    .addTag('branches', 'Branch management')
    .addTag('users', 'User management')
    .addTag('roles', 'Role & Permission management')
    .addTag('staff', 'Staff management')
    .addTag('menu', 'Menu & Category management')
    .addTag('orders', 'Order management')
    .addTag('pos', 'Point of Sale')
    .addTag('kitchen', 'Kitchen Display System')
    .addTag('tables', 'Table management')
    .addTag('inventory', 'Inventory management')
    .addTag('suppliers', 'Supplier management')
    .addTag('purchases', 'Purchase orders')
    .addTag('payments', 'Payment processing')
    .addTag('invoices', 'Invoice generation')
    .addTag('finance', 'Finance & Transactions')
    .addTag('reports', 'Reports & Analytics')
    .addTag('dashboard', 'Dashboard metrics')
    .addTag('reservations', 'Reservation management')
    .addTag('crm', 'Customer Relationship Management')
    .addTag('delivery', 'Delivery management')
    .addTag('marketing', 'Campaigns & Marketing')
    .addTag('coupons', 'Coupon management')
    .addTag('notifications', 'Notification system')
    .addTag('printer', 'Printer & KOT')
    .addTag('ai', 'AI-powered insights')
    .addTag('cms', 'Content Management')
    .addTag('plans', 'Subscription plans')
    .addTag('subscriptions', 'Subscription management')
    .addTag('entitlements', 'Feature entitlements')
    .addTag('billing', 'Billing & payments')
    .addTag('support', 'Support tickets')
    .addTag('demo-requests', 'Demo request pipeline')
    .addTag('omnichannel', 'Omnichannel aggregator integration')
    .addTag('sync', 'Offline sync endpoints')
    .addTag('public', 'Public (unauthenticated) endpoints')
    .addTag('platform', 'Platform-wide settings')
    .addTag('api-keys', 'API key management')
    .addTag('webhooks', 'Outbound webhook management')
    .addTag('workflows', 'Workflow & Approval engine')
    .addTag('backups', 'Backup & Disaster Recovery')
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
