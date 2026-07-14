# Release Process

## Versioning

### Semantic Versioning

```
MAJOR.MINOR.PATCH
- MAJOR: Breaking changes
- MINOR: New features
- PATCH: Bug fixes
```

### Current Version

```
0.1.0 (MVP)
```

## Release Steps

### 1. Code Freeze

- Stop new features
- Fix critical bugs only
- Update version number

### 2. Testing

- Run full test suite
- Manual QA testing
- Performance testing
- Security testing

### 3. Documentation

- Update CHANGELOG
- Update README
- Update API docs
- Update deployment docs

### 4. Build

```bash
# Backend
npm run build

# Flutter
flutter build apk --release
flutter build ios --release

# Web
npm run build
```

### 5. Docker

```bash
# Build images
docker-compose build

# Tag images
docker tag nexaros-backend nexaros/backend:1.0.0

# Push to registry
docker push nexaros/backend:1.0.0
```

### 6. Deploy

```bash
# Pull latest
docker-compose pull

# Restart services
docker-compose up -d

# Verify
docker-compose ps
docker-compose logs -f
```

### 7. Post-Deployment

- Monitor logs
- Check health endpoints
- Verify functionality
- Notify team

## Rollback

```bash
# Rollback to previous version
docker-compose down
docker-compose up -d nexaros-backend:0.9.0

# Or restore database
cat backup.sql | docker exec -i postgres psql -U postgres nexaros
```

## Related Documents

- [Deployment](37_DEPLOYMENT.md)
- [Docker](38_DOCKER.md)
