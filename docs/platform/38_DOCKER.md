# Docker

## Overview

NexaROS uses Docker for containerization and Docker Compose for orchestration.

## Dockerfiles

### Backend

```dockerfile
# Dockerfile.backend
FROM node:20-alpine AS builder

WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:20-alpine

WORKDIR /app
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./

EXPOSE 4000
CMD ["node", "dist/main.js"]
```

### Marketing

```dockerfile
# Dockerfile.marketing
FROM node:20-alpine AS builder

WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:20-alpine

WORKDIR /app
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public

EXPOSE 3002
CMD ["node", "server.js"]
```

### Customer

```dockerfile
# Dockerfile.customer
FROM node:20-alpine AS builder

WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:20-alpine

WORKDIR /app
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public

EXPOSE 3001
CMD ["node", "server.js"]
```

### Admin

```dockerfile
# Dockerfile.admin
FROM node:20-alpine AS builder

WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:20-alpine

WORKDIR /app
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public

EXPOSE 3003
CMD ["node", "server.js"]
```

## Docker Compose

```yaml
version: '3.8'

services:
  nexaros-backend:
    build:
      context: ../apps/backend
      dockerfile: ../../docker/Dockerfile.backend
    ports:
      - "4000:4000"
    environment:
      - DATABASE_URL=postgresql://postgres:password@nexaros-postgres:5432/nexaros
      - REDIS_URL=redis://nexaros-redis:6379
      - JWT_SECRET=your-secret-key
      - ADMIN_JWT_SECRET=your-admin-secret
    depends_on:
      - nexaros-postgres
      - nexaros-redis
    networks:
      - nexaros-network

  nexaros-marketing:
    build:
      context: ../apps/marketing-web
      dockerfile: ../../docker/Dockerfile.marketing
    ports:
      - "3002:3002"
    environment:
      - NEXT_PUBLIC_API_URL=http://localhost:4000/api
    networks:
      - nexaros-network

  nexaros-customer:
    build:
      context: ../apps/customer-web
      dockerfile: ../../docker/Dockerfile.customer
    ports:
      - "3001:3001"
    environment:
      - NEXT_PUBLIC_API_URL=http://localhost:4000/api
    networks:
      - nexaros-network

  nexaros-admin:
    build:
      context: ../apps/admin-portal
      dockerfile: ../../docker/Dockerfile.admin
    ports:
      - "3003:3003"
    environment:
      - NEXT_PUBLIC_API_URL=http://localhost:4000/api
    networks:
      - nexaros-network

  nexaros-postgres:
    image: postgres:16-alpine
    ports:
      - "5433:5432"
    environment:
      - POSTGRES_DB=nexaros
      - POSTGRES_USER=postgres
      - POSTGRES_PASSWORD=password
    volumes:
      - postgres-data:/var/lib/postgresql/data
    networks:
      - nexaros-network

  nexaros-redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    volumes:
      - redis-data:/data
    networks:
      - nexaros-network

volumes:
  postgres-data:
  redis-data:

networks:
  nexaros-network:
    driver: bridge
```

## Commands

### Build

```bash
docker-compose build
```

### Start

```bash
docker-compose up -d
```

### Stop

```bash
docker-compose down
```

### Logs

```bash
docker-compose logs -f
```

### Rebuild

```bash
docker-compose build --no-cache
docker-compose up -d
```

## Related Documents

- [Deployment](37_DEPLOYMENT.md)
- [Environment](36_ENVIRONMENT.md)
