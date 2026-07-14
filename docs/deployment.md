# NexaROS Deployment Guide

## Prerequisites

- Docker 24+ and Docker Compose v2
- Node.js 22+ and pnpm 10+
- PostgreSQL 16 (if running locally)
- Redis 7 (if running locally)

## Quick Start (Docker)

```bash
# Clone and start
git clone https://github.com/Narasimha-Nexa/nexaros.git
cd nexaros
cd docker && docker compose up -d

# Services:
#   Backend:    http://localhost:4000
#   API Docs:   http://localhost:4000/docs
#   Customer:   http://localhost:3001
#   Marketing:  http://localhost:3002
#   Admin:      http://localhost:3003
```

## Development Setup

### 1. Start Infrastructure
```bash
cd docker
docker compose up -d nexaros-postgres nexaros-redis
```

### 2. Setup Backend
```bash
cd apps/backend
cp .env.example .env  # Configure DATABASE_URL, JWT_SECRET, etc.
pnpm install
npx prisma generate
npx prisma migrate deploy
npx prisma db seed
pnpm run start:dev
```

### 3. Setup Marketing Web
```bash
cd apps/marketing-web
pnpm install
pnpm run dev  # http://localhost:3002
```

### 4. Setup Admin Portal
```bash
cd apps/admin-portal
pnpm install
pnpm run dev  # http://localhost:3003
```

### 5. Setup Customer Web
```bash
cd apps/customer-web
pnpm install
pnpm run dev  # http://localhost:3001
```

## Environment Variables

### Backend (.env)
```env
DATABASE_URL=postgresql://nexaros:nexaros_dev@localhost:5433/nexaros?schema=public
JWT_SECRET=your-64-char-jwt-secret-here
JWT_REFRESH_SECRET=your-64-char-refresh-secret-here
ADMIN_JWT_SECRET=your-admin-64-char-jwt-secret-here
JWT_EXPIRATION=15m
JWT_REFRESH_EXPIRATION=7d
PORT=4000
CORS_ORIGIN=http://localhost:3000,http://localhost:3001,http://localhost:3002,http://localhost:3003
REDIS_HOST=localhost
REDIS_PORT=6379
NODE_ENV=development
```

### Docker Compose (.env)
```env
JWT_SECRET=production-jwt-secret-minimum-64-characters-long!!
JWT_REFRESH_SECRET=production-refresh-secret-minimum-64-characters!!
ADMIN_JWT_SECRET=production-admin-secret-minimum-64-characters-long!!
```

## Production Deployment

### Build All Images
```bash
cd docker
docker compose build
```

### Run Database Migrations
```bash
docker compose exec nexaros-backend npx prisma migrate deploy
docker compose exec nexaros-backend npx prisma db seed
```

### Start Full Stack
```bash
docker compose up -d
```

### Verify
```bash
docker compose ps
curl http://localhost:4000/api/health
```

## SSL/TLS (Production)

Use a reverse proxy (nginx, Caddy, or Cloudflare) in front of the Docker stack:

```nginx
server {
    listen 443 ssl http2;
    server_name nexaros.com;

    ssl_certificate /etc/ssl/certs/nexaros.pem;
    ssl_certificate_key /etc/ssl/private/nexaros.key;

    location / {
        proxy_pass http://localhost:3002;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location /api {
        proxy_pass http://localhost:4000;
        # Same headers...
    }
}
```

## Database Backup

```bash
# Backup
docker compose exec nexaros-postgres pg_dump -U nexaros nexaros > backup.sql

# Restore
cat backup.sql | docker compose exec -T nexaros-postgres psql -U nexaros nexaros
```

## Monitoring

- **Backend health**: `GET /api/health`
- **Swagger docs**: `GET /docs`
- **PostgreSQL**: `docker compose exec nexaros-postgres psql -U nexaros`
- **Redis**: `docker compose exec nexaros-redis redis-cli`

## Troubleshooting

### Port conflicts
```bash
# Check what's using ports
lsof -i :4000
lsof -i :5433
lsof -i :6379
```

### Database connection issues
```bash
# Verify PostgreSQL is running
docker compose ps nexaros-postgres
docker compose logs nexaros-postgres
```

### Build failures
```bash
# Clean and rebuild
docker compose down -v
docker compose build --no-cache
docker compose up -d
```
