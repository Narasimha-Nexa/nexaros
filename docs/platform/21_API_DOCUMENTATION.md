# Backend API Documentation

> Detailed per-app documentation: [apps/backend/](../../apps/backend/)

## Base URL

- **Development**: `http://localhost:4000/api`
- **Swagger**: `http://localhost:4000/docs`
- **Production**: `https://api.nexaros.com/api`

## Authentication

All protected endpoints require `Authorization: Bearer <token>` header.

### Auth Endpoints

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/auth/register` | No | Register restaurant |
| POST | `/auth/login` | No | Login (returns JWT) |
| POST | `/auth/refresh` | No | Refresh access token |
| POST | `/auth/logout` | Yes | Logout (invalidate refresh) |
| GET | `/auth/profile` | Yes | Get user profile |
| POST | `/auth/forgot-password` | No | Request password reset |
| POST | `/auth/reset-password` | No | Reset with token |

### Tenant Endpoints

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/tenants` | Admin | List all tenants |
| GET | `/tenants/:id` | Yes | Get tenant |
| POST | `/tenants/:id/suspend` | Admin | Suspend tenant |
| POST | `/tenants/:id/activate` | Admin | Activate tenant |

### Branch Endpoints

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/branches` | Yes | List branches (scoped) |
| GET | `/branches/:id` | Yes | Get branch |
| POST | `/branches` | Yes | Create branch (plan limit) |
| PATCH | `/branches/:id` | Yes | Update branch |
| DELETE | `/branches/:id` | Yes | Delete branch |

### Menu Endpoints

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/menu/categories` | Yes | List categories |
| POST | `/menu/categories` | Yes | Create category |
| GET | `/menu/items` | Yes | List items (paginated) |
| POST | `/menu/items` | Yes | Create menu item |
| PATCH | `/menu/items/:id` | Yes | Update item |
| DELETE | `/menu/items/:id` | Yes | Delete item |
| PATCH | `/menu/items/:id/availability` | Yes | Toggle availability |
| POST | `/menu/items/:id/images` | Yes | Upload images |

### Order Endpoints

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/orders` | Yes | List orders (paginated) |
| POST | `/orders` | Yes | Create order |
| GET | `/orders/:id` | Yes | Get order details |
| PATCH | `/orders/:id/status` | Yes | Update status |
| POST | `/orders/:id/items` | Yes | Add item |
| DELETE | `/orders/:id/items/:itemId` | Yes | Remove item |
| POST | `/orders/:id/kot` | Yes | Print KOT |
| POST | `/orders/:id/cancel` | Yes | Cancel order |

### Table Endpoints

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/tables` | Yes | List tables |
| GET | `/tables/floor-plan` | Yes | Get floor plan |
| PATCH | `/tables/:id/status` | Yes | Update status |

### Payment Endpoints

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/payments/orders/:orderId` | Yes | Process payment |
| GET | `/payments/orders/:orderId` | Yes | Get order payments |

### Invoice Endpoints

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/invoices/payments/:paymentId` | Yes | Generate invoice |
| GET | `/invoices` | Yes | List invoices |
| GET | `/invoices/:id/pdf` | Yes | Get PDF |

### Inventory Endpoints

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/inventory` | Yes | List items |
| POST | `/inventory` | Yes | Create item |
| PATCH | `/inventory/:id` | Yes | Update item |
| DELETE | `/inventory/:id` | Yes | Delete item |
| POST | `/inventory/:id/adjust` | Yes | Adjust stock |
| GET | `/inventory/low-stock` | Yes | Low stock alerts |

### Staff Endpoints

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/staff` | Yes | List staff |
| POST | `/staff` | Yes | Create staff |
| PATCH | `/staff/:id` | Yes | Update staff |
| DELETE | `/staff/:id` | Yes | Delete staff |
| POST | `/staff/:id/clock-in` | Yes | Clock in |
| POST | `/staff/:id/clock-out` | Yes | Clock out |

### Kitchen Endpoints

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/kitchen/orders` | Yes | Active kitchen orders |
| GET | `/kitchen/orders/completed` | Yes | Completed orders |
| PATCH | `/kitchen/orders/:id/status` | Yes | Update kitchen status |

### Reservation Endpoints

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/reservations` | Yes | List reservations |
| GET | `/reservations/today` | Yes | Today's reservations |
| POST | `/reservations` | Yes | Create reservation |
| PATCH | `/reservations/:id` | Yes | Update reservation |
| DELETE | `/reservations/:id` | Yes | Delete reservation |

### Report Endpoints

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/reports/:type` | Yes | Get report (daily-sales, items, etc.) |
| GET | `/reports/export/:type` | Yes | Export report |

### Billing Endpoints

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/billing/entitlements/:tenantId` | No | Get tenant entitlements |
| POST | `/billing/checkout` | No | Create checkout session |
| POST | `/billing/transition` | Admin | Transition subscription |
| POST | `/billing/payment-promise` | No | Create payment promise |
| GET | `/billing/invoices/:tenantId` | No | Subscription invoices |
| GET | `/billing/payments/:tenantId` | No | Subscription payments |

### Entitlements Endpoints

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/entitlements/modules` | No | List module keys |
| GET | `/entitlements/plans` | No | List plans |
| GET | `/entitlements/plans/:slug` | No | Get plan |
| POST | `/entitlements/plans` | Admin | Create plan |
| PUT | `/entitlements/plans/:planId/entitlements` | Admin | Update entitlements |
| GET | `/entitlements/feature-flags/:tenantId` | No | Feature flags |
| POST | `/entitlements/feature-flags` | Admin | Toggle flag |

### Coupon Endpoints

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/coupons/validate` | No | Validate coupon |
| POST | `/coupons` | Admin | Create coupon |
| GET | `/coupons` | Admin | List coupons |
| PUT | `/coupons/:id` | Admin | Update coupon |
| GET | `/coupons/:id/stats` | Admin | Usage stats |
| POST | `/coupons/apply` | Admin | Apply coupon |
| POST | `/coupons/festival-campaign` | Admin | Festival campaign |

### Admin Endpoints

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/admin/login` | No | Admin login |
| POST | `/admin/logout` | Admin | Admin logout |
| GET | `/admin/profile` | Admin | Admin profile |
| POST | `/admin/mfa/setup` | Admin | Setup MFA |
| POST | `/admin/mfa/verify` | Admin | Verify MFA |
| GET | `/admin/sessions` | Admin | List sessions |
| GET | `/admin/audit-logs` | Admin | Audit logs |

### Support Endpoints

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/support/tickets` | Admin | List tickets |
| POST | `/support/tickets` | No | Create ticket |
| POST | `/support/tickets/:id/messages` | Admin | Add message |
| PATCH | `/support/tickets/:id/status` | Admin | Update status |

### Demo Request Endpoints

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/demo-requests` | No | Submit demo request |
| GET | `/demo-requests` | Admin | List requests |
| PATCH | `/demo-requests/:id/status` | Admin | Update status |

### Platform Endpoints

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/platform/settings` | Admin | Get settings |
| PATCH | `/platform/settings` | Admin | Update settings |
| GET | `/platform/stats` | Admin | Platform stats |

### Public Endpoints

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/public/restaurant/:slug` | No | Restaurant info |
| GET | `/public/restaurant/:slug/menu` | No | Restaurant menu |
| GET | `/public/restaurant/:slug/tables` | No | Table availability |
| POST | `/public/orders` | No | Place customer order |
| GET | `/public/orders/:id` | No | Track order |

## Error Response Format

```json
{
  "statusCode": 400,
  "message": "Validation failed",
  "error": "Bad Request"
}
```

## Rate Limits

| Endpoint Type | Limit | Window |
|--------------|-------|--------|
| Auth (login/register) | 5 requests | 1 minute |
| Admin login | 5 requests | 15 minutes |
| Public | 30 requests | 1 minute |
| General API | 100 requests | 1 minute |

## Related Documents

- [API Audit](../../audits/api-audit.md)
- [Authentication](23_AUTHENTICATION.md)
- [Database](22_DATABASE.md)
- [Validation](42_VALIDATIONS.md)
