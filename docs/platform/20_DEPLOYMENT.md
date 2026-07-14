# Deployment Guide

## Overview

NexaROS is containerized with Docker Compose for easy deployment.

## Services

| Service | Port | Description |
|---------|------|-------------|
| backend | 4000 | NestJS API |
| marketing | 3002 | Marketing website |
| customer | 3001 | Customer web app |
| admin-portal | 3003 | Admin portal |
| postgres | 5433 | PostgreSQL database |
| redis | 6379 | Redis cache |

## Docker Commands

### Start All Services

```bash
cd docker
docker-compose up -d
```

### Start Specific Service

```bash
docker-compose up -d nexaros-backend
```

### View Logs

```bash
docker-compose logs -f nexaros-backend
```

### Stop All Services

```bash
docker-compose down
```

### Rebuild

```bash
docker-compose build --no-cache
docker-compose up -d
```

## Environment Variables

### Backend

```env
DATABASE_URL=postgresql://postgres:password@localhost:5433/nexaros
REDIS_URL=redis://localhost:6379
JWT_SECRET=your-secret-key
ADMIN_JWT_SECRET=your-admin-secret
PORT=4000
NODE_ENV=production
```

### Frontend

```env
NEXT_PUBLIC_API_URL=http://localhost:4000/api
NEXT_PUBLIC_WS_URL=http://localhost:4000
```

## Production Checklist

### Infrastructure

- [ ] SSL/TLS certificates
- [ ] Domain configuration
- [ ] Database backups
- [ ] Redis persistence
- [ ] Log aggregation
- [ ] Monitoring (Prometheus/Grafana)

### Security

- [ ] Change default passwords
- [ ] Configure CORS properly
- [ ] Enable rate limiting
- [ ] Set up WAF
- [ ] Configure CSP headers
- [ ] Enable audit logging

### Performance

- [ ] Database indexing
- [ ] Query optimization
- [ ] Redis caching
- [ ] CDN configuration
- [ ] Image optimization
- [ ] Code splitting

### Monitoring

- [ ] Health checks
- [ ] Error tracking (Sentry)
- [ ] Performance monitoring
- [ ] Uptime monitoring
- [ ] Alerting

## CI/CD

### GitHub Actions

```yaml
# .github/workflows/ci.yml
- Lint
- Test
- Build
- Docker build verification
```

### Deployment Steps

1. Push to main branch
2. CI pipeline runs
3. Tests pass
4. Docker images built
5. Images pushed to registry
6. Deploy to production
7. Health checks pass
8. Traffic routed

## Backup & Recovery

### Database Backup

```bash
# Backup
docker exec postgres pg_dump -U postgres nexaros > backup.sql

# Restore
cat backup.sql | docker exec -i postgres psql -U postgres nexaros
```

### Redis Backup

```bash
# Backup
docker exec redis redis-cli BGSAVE

# Copy dump.rdb
docker cp redis:/data/dump.rdb ./backup/
```

## Scaling

### Horizontal Scaling

- Backend: Multiple instances behind load balancer
- Frontend: CDN + static hosting
- Database: Read replicas
- Redis: Cluster mode

### Vertical Scaling

- Increase CPU/memory for backend
- Increase database resources
- Increase Redis memory

## Related Documents

- [System Architecture](05_SYSTEM_ARCHITECTURE.md)
- [Docker Setup](../../docker/docker-compose.yml)
