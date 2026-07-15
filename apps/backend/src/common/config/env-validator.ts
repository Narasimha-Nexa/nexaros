import { Logger } from '@nestjs/common';

const requiredInProduction = [
  'DATABASE_URL',
  'JWT_SECRET',
  'ADMIN_JWT_SECRET',
];

const optionalWithDefaults = {
  REDIS_URL: 'redis://localhost:6379',
  PORT: '4000',
  NODE_ENV: 'development',
  CORS_ORIGIN: 'http://localhost:3000,http://localhost:3001,http://localhost:3002,http://localhost:3003',
  REQUEST_TIMEOUT_MS: '30000',
};

export function validateEnvironment() {
  const logger = new Logger('EnvValidator');
  const isProduction = process.env.NODE_ENV === 'production';

  // Set defaults for optional vars
  for (const [key, defaultValue] of Object.entries(optionalWithDefaults)) {
    if (!process.env[key]) {
      process.env[key] = defaultValue;
      if (isProduction) {
        logger.warn(`${key} not set, using default: ${key === 'JWT_SECRET' || key === 'ADMIN_JWT_SECRET' ? '***' : defaultValue}`);
      }
    }
  }

  // Validate required vars in production
  if (isProduction) {
    const missing = requiredInProduction.filter(key => !process.env[key]);
    if (missing.length > 0) {
      logger.error(`Missing required environment variables: ${missing.join(', ')}`);
      process.exit(1);
    }

    // Warn about default secrets
    if (process.env.JWT_SECRET === 'dev-secret-change-in-production') {
      logger.error('JWT_SECRET is using default dev value — CHANGE THIS IN PRODUCTION');
      process.exit(1);
    }
    if (process.env.ADMIN_JWT_SECRET === 'admin-secret-change-in-production') {
      logger.error('ADMIN_JWT_SECRET is using default dev value — CHANGE THIS IN PRODUCTION');
      process.exit(1);
    }
  }

  logger.log(`Environment: ${process.env.NODE_ENV}`);
}
