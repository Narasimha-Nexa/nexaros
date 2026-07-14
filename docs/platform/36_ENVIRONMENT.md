# Environment Variables

## Backend

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| DATABASE_URL | PostgreSQL connection | - | Yes |
| REDIS_URL | Redis connection | - | Yes |
| JWT_SECRET | JWT signing secret | - | Yes |
| ADMIN_JWT_SECRET | Admin JWT secret | - | Yes |
| PORT | Server port | 4000 | No |
| NODE_ENV | Environment | development | No |
| CORS_ORIGIN | Allowed origins | localhost | No |

## Frontend (Marketing)

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| NEXT_PUBLIC_API_URL | Backend API URL | http://localhost:4000/api | Yes |

## Frontend (Customer)

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| NEXT_PUBLIC_API_URL | Backend API URL | http://localhost:4000/api | Yes |

## Frontend (Admin)

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| NEXT_PUBLIC_API_URL | Backend API URL | http://localhost:4000/api | Yes |
| NEXT_PUBLIC_ADMIN_JWT_SECRET | Admin JWT secret | - | Yes |

## Flutter

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| API_URL | Backend API URL | http://localhost:4000/api | Yes |
| WS_URL | WebSocket URL | http://localhost:4000 | Yes |

## Development

```env
# Backend
DATABASE_URL=postgresql://postgres:password@localhost:5433/nexaros
REDIS_URL=redis://localhost:6379
JWT_SECRET=dev-secret-key
ADMIN_JWT_SECRET=dev-admin-secret
PORT=4000
NODE_ENV=development
CORS_ORIGIN=http://localhost:3000,http://localhost:3001,http://localhost:3002,http://localhost:3003

# Frontend
NEXT_PUBLIC_API_URL=http://localhost:4000/api
```

## Production

```env
# Backend
DATABASE_URL=postgresql://user:password@host:5432/nexaros
REDIS_URL=redis://host:6379
JWT_SECRET=production-secret-key
ADMIN_JWT_SECRET=production-admin-secret
PORT=4000
NODE_ENV=production
CORS_ORIGIN=https://nexaros.com,https://app.nexaros.com,https://admin.nexaros.com

# Frontend
NEXT_PUBLIC_API_URL=https://api.nexaros.com/api
```

## Related Documents

- [Configuration](35_CONFIGURATION.md)
- [Docker](38_DOCKER.md)
- [Deployment](37_DEPLOYMENT.md)
