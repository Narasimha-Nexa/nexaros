# Troubleshooting

## Common Issues

### Backend Won't Start

**Symptoms**: Server crashes on startup

**Solutions**:
```bash
# Check logs
docker-compose logs nexaros-backend

# Check database connection
docker exec postgres pg_isready

# Check Redis connection
docker exec redis redis-cli ping

# Restart services
docker-compose restart nexaros-backend
```

### Database Connection Error

**Symptoms**: `ECONNREFUSED` or `password authentication failed`

**Solutions**:
```bash
# Check PostgreSQL status
docker-compose ps postgres

# Check credentials
docker exec postgres psql -U postgres -c '\l'

# Reset password
docker exec postgres psql -U postgres -c "ALTER USER postgres PASSWORD 'password';"
```

### API Returns 500

**Symptoms**: Internal Server Error

**Solutions**:
```bash
# Check backend logs
docker-compose logs nexaros-backend

# Check database queries
docker exec postgres psql -U postgres nexaros -c "SELECT * FROM tenants;"

# Check environment variables
docker exec nexaros-backend env
```

### Flutter Build Fails

**Symptoms**: Build errors

**Solutions**:
```bash
# Clean build
flutter clean

# Get dependencies
flutter pub get

# Check for errors
flutter analyze

# Try building again
flutter build apk
```

### Real-Time Not Working

**Symptoms**: Socket.IO not connecting

**Solutions**:
```bash
# Check WebSocket URL
# Ensure CORS allows WebSocket

# Check firewall
# Ensure port 4000 is open

# Check logs
docker-compose logs nexaros-backend | grep socket
```

### Slow Performance

**Symptoms**: High response times

**Solutions**:
```bash
# Check database queries
docker exec postgres psql -U postgres nexaros -c "SELECT * FROM pg_stat_activity;"

# Check Redis cache
docker exec redis redis-cli INFO memory

# Check server resources
docker stats
```

## Getting Help

### Logs

```bash
# All services
docker-compose logs

# Specific service
docker-compose logs nexaros-backend

# Follow logs
docker-compose logs -f
```

### Health Checks

```bash
# Backend
curl http://localhost:4000/health

# Marketing
curl http://localhost:3002

# Database
docker exec postgres pg_isready

# Redis
docker exec redis redis-cli ping
```

## Related Documents

- [Monitoring](39_MONITORING.md)
- [Logging](40_LOGGING.md)
