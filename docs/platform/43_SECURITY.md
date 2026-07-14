# Authentication & Security

> Detailed source: [apps/backend/src/modules/auth/](../../apps/backend/src/modules/auth/)

## Overview

NexaROS uses a dual authentication system: **JWT-based auth** for restaurant users and **separate JWT + MFA** for admin users.

## Restaurant User Auth

### Registration Flow

```
1. POST /api/auth/register
   Body: { restaurantName, businessType, email, phone, address, 
           city, state, country, ownerName, password }

2. Backend creates:
   - Tenant (restaurant org)
   - User (owner, role: OWNER)
   - Default Branch
   - Default Staff record
   - Default Roles (OWNER, MANAGER, CASHIER, etc.)
   - Default Permissions
   - 14-day trial subscription
   - Menu categories + sample items

3. Returns: { accessToken, refreshToken, user, tenant }
```

### Login Flow

```
1. POST /api/auth/login
   Body: { email, password }

2. Rate limit: 5 attempts per minute (LoginRateLimitMiddleware)

3. Backend validates:
   - Email exists
   - Password matches (bcrypt)
   - Account not locked

4. Returns: { accessToken, refreshToken, user, tenant }
```

### Token Management

| Token Type | Lifetime | Storage | Usage |
|------------|----------|---------|-------|
| Access Token | 15 minutes | Memory | API requests |
| Refresh Token | 7 days | Secure cookie | Token renewal |

### Password Security

- **Hashing**: bcrypt with 12 salt rounds
- **Reset**: Email-based token (planned)
- **Policy**: Minimum 8 characters (enforced in validation)

## Admin Auth

### Separate System

Admin users are stored in `admin_users` table, NOT `users` table. They have their own JWT secret (`ADMIN_JWT_SECRET`).

### Login Flow

```
1. POST /api/admin/login
   Body: { email, password }

2. Rate limit: 5 attempts per 15 minutes

3. Backend validates:
   - Email exists in admin_users
   - Password matches
   - MFA setup status

4. If MFA enabled:
   Returns: { requiresMFA: true, tempToken }
   
5. POST /api/admin/mfa/verify
   Body: { tempToken, totpCode }
   
6. Returns: { accessToken, refreshToken, admin }
```

### MFA (Multi-Factor Auth)

- **Library**: otplib (TOTP)
- **Secret**: Generated on setup, stored encrypted
- **Recovery codes**: 8 one-time codes
- **Setup flow**:
  1. `POST /api/admin/mfa/setup` → Returns secret + QR code URL
  2. User scans QR in authenticator app
  3. `POST /api/admin/mfa/verify` → Verifies code, activates MFA

### Admin Roles

| Role | Permissions |
|------|-------------|
| SUPER_ADMIN | Full access to all admin functions |
| ADMIN | Most admin functions except dangerous operations |
| VIEWER | Read-only access to dashboard and reports |

## JWT Structure

### Access Token Payload

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

### Admin Token Payload

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

- Validates admin JWT token
- Checks token type is "admin"
- Attaches admin user to request

### PermissionsGuard

- Checks user has required permission
- Uses `@Permissions('module:action')` decorator
- Validates against database permissions

### BranchScopeGuard

- Ensures user belongs to requested branch
- Validates tenant ownership
- Prevents cross-tenant data access

## Security Headers (Helmet)

```typescript
helmet({
  contentSecurityPolicy: false, // Disabled in dev
  crossOriginEmbedderPolicy: false,
  crossOriginResourcePolicy: { policy: "cross-origin" }
})
```

## Rate Limiting

| Endpoint | Limit | Lockout |
|----------|-------|---------|
| `/auth/login` | 5/min | 30 min |
| `/admin/login` | 5/15min | 30 min |
| `/public/*` | 30/min | None |
| General API | 100/min | None |

## CSRF Protection

- Custom `CsrfMiddleware` validates CSRF tokens
- Header-based: `X-CSRF-Token`
- Exempt: GET, HEAD, OPTIONS, public endpoints

## Session Management (Admin)

```typescript
AdminSession {
  id: string
  adminUserId: string
  token: string
  ipAddress: string
  userAgent: string
  createdAt: Date
  expiresAt: Date
  lastActiveAt: Date
  isRevoked: boolean
}
```

- **Max sessions**: 5 per admin
- **Session timeout**: 24 hours
- **Revocation**: Manual or on password change

## Audit Logging (Admin)

Every admin action is logged:

```typescript
AdminAuditLog {
  adminUserId: string
  action: string
  entity: string
  entityId: string
  oldData: Json
  newData: Json
  ipAddress: string
  userAgent: string
  createdAt: Date
}
```

## Related Documents

- [Authentication](23_AUTHENTICATION.md)
- [Modules](08_MODULES.md)
- [API Documentation](21_API_DOCUMENTATION.md)
