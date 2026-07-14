# Configuration

## Backend Configuration

### Environment Variables

```env
# Database
DATABASE_URL=postgresql://postgres:password@localhost:5433/nexaros

# Redis
REDIS_URL=redis://localhost:6379

# JWT
JWT_SECRET=your-secret-key
ADMIN_JWT_SECRET=your-admin-secret

# Server
PORT=4000
NODE_ENV=development

# CORS
CORS_ORIGIN=http://localhost:3000,http://localhost:3001,http://localhost:3002,http://localhost:3003
```

### Module Configuration

```typescript
// app.module.ts
@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    AuthModule,
    TenantsModule,
    // ... other modules
  ],
})
export class AppModule {}
```

## Flutter Configuration

### pubspec.yaml

```yaml
dependencies:
  flutter:
    sdk: flutter
  provider: ^6.0.0
  sqflite: ^2.3.0
  hive: ^2.2.3
  socket_io_client: ^2.0.0
  http: ^1.1.0
  shared_preferences: ^2.2.0
```

### Environment

```dart
// lib/config/env.dart
class Env {
  static const String apiUrl = String.fromEnvironment(
    'API_URL',
    defaultValue: 'http://localhost:4000/api',
  );
  
  static const String wsUrl = String.fromEnvironment(
    'WS_URL',
    defaultValue: 'http://localhost:4000',
  );
}
```

## Web Configuration

### Next.js

```javascript
// next.config.js
module.exports = {
  output: 'standalone',
  env: {
    API_URL: process.env.NEXT_PUBLIC_API_URL,
  },
};
```

### Tailwind

```javascript
// tailwind.config.js
module.exports = {
  content: ['./src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {},
  },
  plugins: [],
};
```

## Docker Configuration

### docker-compose.yml

```yaml
version: '3.8'
services:
  nexaros-backend:
    build: .
    ports:
      - "4000:4000"
    environment:
      - DATABASE_URL=postgresql://postgres:password@postgres:5432/nexaros
      - REDIS_URL=redis://redis:6379
```

## Related Documents

- [Environment](36_ENVIRONMENT.md)
- [Docker](38_DOCKER.md)
- [Deployment](37_DEPLOYMENT.md)
