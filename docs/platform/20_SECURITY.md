# Security

## Overview

NexaROS implements comprehensive security measures across all components.

## Authentication Security

### Password Hashing

- bcrypt with 12 salt rounds
- Minimum 8 characters
- Password confirmation required

### JWT Security

- Access token: 15-minute expiry
- Refresh token: 7-day expiry
- Separate secrets for user/admin
- Token type validation

### Rate Limiting

| Endpoint | Limit | Lockout |
|----------|-------|---------|
| Auth | 5/min | 30 min |
| Admin | 5/15min | 30 min |
| Public | 30/min | None |
| General | 100/min | None |

## Application Security

### Input Validation

- class-validator with whitelist
- forbidNonWhitelisted enabled
- DTO validation on all endpoints

### CORS Configuration

```typescript
cors({
  origin: [
    'http://localhost:3000',
    'http://localhost:3001',
    'http://localhost:3002',
    'http://localhost:3003',
  ],
  credentials: true,
})
```

### CSRF Protection

- Custom middleware
- Header-based tokens
- Exempt: GET, HEAD, OPTIONS

### Security Headers (Helmet)

```typescript
helmet({
  contentSecurityPolicy: false, // Dev only
  crossOriginEmbedderPolicy: false,
  crossOriginResourcePolicy: { policy: "cross-origin" }
})
```

## Data Security

### Multi-Tenancy

- Tenant isolation via tenantId
- Branch scope guard
- Cross-tenant access prevented

### Sensitive Data

- Passwords hashed, never stored plain
- MFA secrets encrypted
- API keys in environment variables

## API Security

### Authentication

- JWT required for protected endpoints
- Admin JWT separate from user JWT
- Token validation on every request

### Authorization

- RBAC permissions
- Entitlements guard
- Branch scope guard

### Audit Logging

- All admin actions logged
- IP address tracking
- User agent logging

## Infrastructure Security

### Docker

- Non-root user
- Multi-stage builds
- Minimal dependencies

### Network

- Internal Docker network
- Port exposure limited
- SSL/TLS in production

## Related Documents

- [Authentication](23_AUTHENTICATION.md)
- [Modules](08_MODULES.md)
