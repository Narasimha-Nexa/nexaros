# Authentication & Security

## Overview

NexaROS uses JWT-based authentication with separate systems for restaurant users and admin users.

## Restaurant User Auth

### Registration

- Email/password registration
- Business type selection
- Indian states (37)
- Password confirmation
- 14-day trial created

### Login

- Email/password
- Rate limit: 5 attempts/min
- Lockout: 30 minutes
- JWT access token (15 min)
- Refresh token (7 days)

### Password Security

- bcrypt hashing (12 rounds)
- Minimum 8 characters
- Reset via email (planned)

## Admin Auth

### Separate System

- Separate `admin_users` table
- Separate JWT secret (`ADMIN_JWT_SECRET`)
- MFA with TOTP (planned)
- Session management

### Login Flow

- Email/password
- Rate limit: 5 attempts/15min
- MFA verification (if enabled)
- Session creation

## JWT Structure

### Access Token

```json
{
  "sub": "user-id",
  "email": "user@example.com",
  "tenantId": "tenant-id",
  "branchId": "branch-id",
  "role": "OWNER",
  "iat": 1700000000,
  "exp": 1700000900
}
```

### Admin Token

```json
{
  "sub": "admin-user-id",
  "email": "admin@nexaros.com",
  "role": "SUPER_ADMIN",
  "type": "admin",
  "iat": 1700000000,
  "exp": 1700000900
}
```

## Guards

### JwtAuthGuard

- Validates JWT token
- Extracts user from token
- Attaches user to request

### AdminJwtAuthGuard

- Validates admin JWT
- Checks token type
- Attaches admin to request

### PermissionsGuard

- Checks RBAC permissions
- Uses `@Permissions()` decorator
- Validates against database

### BranchScopeGuard

- Ensures branch ownership
- Prevents cross-tenant access
- Scopes all queries

## Rate Limiting

| Endpoint | Limit | Lockout |
|----------|-------|---------|
| `/auth/login` | 5/min | 30 min |
| `/admin/login` | 5/15min | 30 min |
| `/public/*` | 30/min | None |
| General API | 100/min | None |

## CSRF Protection

- Custom middleware
- Header-based tokens
- Exempt: GET, HEAD, OPTIONS

## Session Management

- Max 5 sessions per admin
- 24-hour timeout
- Manual revocation
- Auto-revoke on password change

## Audit Logging

- All admin actions logged
- IP address tracking
- User agent logging
- Old/new data comparison

## Related Documents

- [Security](43_SECURITY.md)
- [API Documentation](21_API_DOCUMENTATION.md)
- [Modules](08_MODULES.md)
