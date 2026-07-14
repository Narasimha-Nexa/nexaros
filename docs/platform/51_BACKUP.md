# Backup

## Overview

NexaROS supports automated backups for database and files.

## Database Backup

### Manual Backup

```bash
# Backup database
docker exec postgres pg_dump -U postgres nexaros > backup_$(date +%Y%m%d).sql

# Compress
gzip backup_$(date +%Y%m%d).sql
```

### Automated Backup

```bash
# cron job (daily at 2 AM)
0 2 * * * docker exec postgres pg_dump -U postgres nexaros > /backups/nexaros_$(date +\%Y\%m\%d).sql
```

### Restore

```bash
# Restore from backup
cat backup.sql | docker exec -i postgres psql -U postgres nexaros

# Decompress and restore
gunzip -c backup.sql.gz | docker exec -i postgres psql -U postgres nexaros
```

## File Backup

### Local Files

```bash
# Backup uploads
tar -czf uploads_$(date +%Y%m%d).tar.gz ./uploads

# Backup configurations
tar -czf config_$(date +%Y%m%d).tar.gz ./.env ./docker-compose.yml
```

### Cloud Backup (Planned)

```bash
# AWS S3
aws s3 sync ./backups s3://nexaros-backups/

# Google Cloud Storage
gsutil rsync -r ./backups gs://nexaros-backups/
```

## Redis Backup

```bash
# Trigger backup
docker exec redis redis-cli BGSAVE

# Copy dump
docker cp redis:/data/dump.rdb ./backups/redis_$(date +%Y%m%d).rdb
```

## Backup Schedule

| Type | Frequency | Retention |
|------|-----------|-----------|
| Database | Daily | 30 days |
| Files | Weekly | 90 days |
| Redis | Daily | 7 days |
| Full System | Monthly | 12 months |

## Backup Verification

```bash
# Verify backup integrity
pg_restore --list backup.sql

# Test restore to staging
cat backup.sql | docker exec -i postgres-staging psql -U postgres nexaros
```

## Related Documents

- [Recovery](52_RECOVERY.md)
- [Deployment](37_DEPLOYMENT.md)
