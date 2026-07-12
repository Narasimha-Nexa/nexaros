import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Global prefix
  app.setGlobalPrefix('api');

  // CORS
  app.enableCors({
    origin: process.env.CORS_ORIGIN?.split(',') || ['http://localhost:3000'],
    credentials: true,
  });

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
    .addTag('sync', 'Offline sync endpoints')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('docs', app, document);

  const port = process.env.PORT || 4000;
  await app.listen(port);

  console.log(`\n  🚀 NexaROS Backend running on: http://localhost:${port}`);
  console.log(`  📚 API Docs:                 http://localhost:${port}/docs`);
  console.log(`  🎯 Environment:              ${process.env.NODE_ENV || 'development'}\n`);
}

bootstrap();
