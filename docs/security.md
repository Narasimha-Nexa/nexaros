# NexaROS Security Guide

## Authentication

### Restaurant Auth (JWT)
- Access token: 15-minute expiry
- Refresh token: 7-day expiry
- Stored in HttpOnly cookies + FlutterSecureStorage
- Token refresh on 401 responses

### Admin Auth (JWT + MFA)
- Separate JWT secret (`ADMIN_JWT_SECRET`)
- TOTP-based MFA (authenticator apps)
- Session tracking with device/IP info
- Session revocation capability

## Password Security

- Bcrypt hashing (10 rounds)
- Minimum 8 characters
- Password reset via email token (1-hour expiry)

## Rate Limiting

| Endpoint Type | Limit | Window |
|--------------|-------|--------|
| Auth (login/register) | 5 requests | 1 minute |
| Public (coupons, plans) | 30 requests | 1 minute |
| General API | 100 requests | 1 minute |

## CORS Configuration

```typescript
CORS_ORIGIN=http://localhost:3000,http://localhost:3001,http://localhost:3002,http://localhost:3003
```

- Credentials enabled
- Origin validated against whitelist

## Input Validation

- `ValidationPipe` with `whitelist: true` (strips unknown fields)
- `forbidNonWhitelisted: true` (rejects unknown fields)
- `transform: true` (auto-transforms payloads to DTOs)

## API Security

- Bearer token authentication on protected routes
- Branch scope guard prevents cross-branch data access
- Entitlements guard controls module access
- Permissions guard for role-based access

## Data Security

- All data encrypted at rest (PostgreSQL)
- TLS for data in transit (HTTPS in production)
- No secrets in code (environment variables only)
- No fake payment data (stub provider only)

## Admin Portal Security

- Private: never referenced from public site
- Separate auth system from restaurant auth
- MFA required for admin login
- Session management with device tracking
- IP logging on all admin actions
- Audit trail for all data changes

## Subscription Security

- Entitlements-based access (not plan name checks)
- Grace period prevents immediate service cutoff
- Restricted mode allows core operations
- No payment data stored (Razorpay handles PCI)

## Infrastructure Security

- Docker containers run as non-root users (Next.js apps)
- PostgreSQL uses dedicated user (not root)
- Redis password-protected in production
- Health checks on all services
- Volume-based data persistence

## Environment Variables

Never commit these to version control:
```
JWT_SECRET
JWT_REFRESH_SECRET
ADMIN_JWT_SECRET
DATABASE_URL
POSTGRES_PASSWORD
```

## Security Checklist for Production

- [ ] Change all default secrets
- [ ] Enable HTTPS (reverse proxy)
- [ ] Set `NODE_ENV=production`
- [ ] Configure firewall (only 80/443 exposed)
- [ ] Enable PostgreSQL SSL
- [ ] Set Redis password
- [ ] Configure backup schedule
- [ ] Enable rate limiting
- [ ] Review CORS origins
- [ ] Set secure cookie flags
- [ ] Enable HSTS headers
