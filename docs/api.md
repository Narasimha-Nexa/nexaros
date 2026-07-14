# NexaROS API Reference

Base URL: `http://localhost:4000/api`
Swagger: `http://localhost:4000/docs`

## Authentication

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/auth/register` | Register restaurant | No |
| POST | `/auth/login` | Login | No |
| POST | `/auth/refresh` | Refresh token | No |
| POST | `/auth/logout` | Logout | Yes |
| GET | `/auth/profile` | Get profile | Yes |
| POST | `/auth/forgot-password` | Request password reset | No |
| POST | `/auth/reset-password` | Reset password | No |

## Tenants

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/tenants` | List all tenants (admin) | Yes |
| GET | `/tenants/:id` | Get tenant | Yes |
| POST | `/tenants/:id/suspend` | Suspend tenant (admin) | Yes |
| POST | `/tenants/:id/activate` | Activate tenant (admin) | Yes |

## Menu

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/menu/categories` | List categories | Yes |
| POST | `/menu/categories` | Create category | Yes |
| GET | `/menu/items` | List menu items (paginated) | Yes |
| POST | `/menu/items` | Create menu item | Yes |
| PATCH | `/menu/items/:id` | Update menu item | Yes |
| DELETE | `/menu/items/:id` | Delete menu item | Yes |
| PATCH | `/menu/items/:id/availability` | Toggle availability | Yes |

## Orders

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/orders` | List orders (paginated) | Yes |
| POST | `/orders` | Create order | Yes |
| GET | `/orders/:id` | Get order | Yes |
| PATCH | `/orders/:id/status` | Update status | Yes |
| POST | `/orders/:id/items` | Add item | Yes |
| DELETE | `/orders/:id/items/:itemId` | Remove item | Yes |
| POST | `/orders/:id/kot` | Print KOT | Yes |
| POST | `/orders/:id/cancel` | Cancel order | Yes |

## Tables

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/tables` | List tables | Yes |
| GET | `/tables/floor-plan` | Get floor plan | Yes |
| PATCH | `/tables/:id/status` | Update status | Yes |

## Payments

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/payments/orders/:orderId` | Process payment | Yes |
| GET | `/payments/orders/:orderId` | Get order payments | Yes |

## Invoices

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/invoices/payments/:paymentId` | Generate invoice | Yes |
| GET | `/invoices` | List invoices | Yes |
| GET | `/invoices/:id/pdf` | Get invoice PDF | Yes |

## Inventory

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/inventory` | List items | Yes |
| POST | `/inventory` | Create item | Yes |
| PATCH | `/inventory/:id` | Update item | Yes |
| DELETE | `/inventory/:id` | Delete item | Yes |
| POST | `/inventory/:id/adjust` | Adjust stock | Yes |
| GET | `/inventory/low-stock` | Low stock alerts | Yes |

## Staff

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/staff` | List staff | Yes |
| POST | `/staff` | Create staff | Yes |
| PATCH | `/staff/:id` | Update staff | Yes |
| DELETE | `/staff/:id` | Delete staff | Yes |
| POST | `/staff/:id/clock-in` | Clock in | Yes |
| POST | `/staff/:id/clock-out` | Clock out | Yes |

## Kitchen

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/kitchen/orders` | Active kitchen orders | Yes |
| GET | `/kitchen/orders/completed` | Completed orders | Yes |
| PATCH | `/kitchen/orders/:id/status` | Update kitchen status | Yes |
| GET | `/kitchen/orders/:orderId/kot` | Get KOT data | Yes |

## Reservations

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/reservations` | List reservations | Yes |
| GET | `/reservations/today` | Today's reservations | Yes |
| POST | `/reservations` | Create reservation | Yes |
| PATCH | `/reservations/:id` | Update reservation | Yes |
| DELETE | `/reservations/:id` | Delete reservation | Yes |

## Reports

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/reports/:type` | Get report (daily-sales, items, etc.) | Yes |
| GET | `/reports/export/:type` | Export report | Yes |

## Billing & Subscriptions

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/billing/entitlements/:tenantId` | Get tenant entitlements | No |
| POST | `/billing/checkout` | Create subscription checkout | No |
| POST | `/billing/transition` | Transition subscription (admin) | Admin |
| POST | `/billing/payment-promise` | Create payment promise | No |
| GET | `/billing/invoices/:tenantId` | Get subscription invoices | No |
| GET | `/billing/payments/:tenantId` | Get subscription payments | No |
| GET | `/billing/admin/subscriptions` | List all subscriptions | Admin |
| GET | `/billing/admin/expiring-soon` | Expiring soon | Admin |

## Entitlements

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/entitlements/modules` | List module keys | No |
| GET | `/entitlements/plans` | List plans | No |
| GET | `/entitlements/plans/:slug` | Get plan | No |
| POST | `/entitlements/plans` | Create plan (admin) | Admin |
| PUT | `/entitlements/plans/:planId/entitlements` | Update entitlements (admin) | Admin |
| GET | `/entitlements/feature-flags/:tenantId` | Feature flags for tenant | No |
| POST | `/entitlements/feature-flags` | Toggle flag (admin) | Admin |

## Coupons

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/coupons/validate` | Validate coupon | No |
| POST | `/coupons` | Create coupon (admin) | Admin |
| GET | `/coupons` | List coupons (admin) | Admin |
| PUT | `/coupons/:id` | Update coupon (admin) | Admin |
| GET | `/coupons/:id/stats` | Usage stats (admin) | Admin |
| POST | `/coupons/apply` | Apply coupon (admin) | Admin |
| POST | `/coupons/festival-campaign` | Festival campaign (admin) | Admin |

## Admin

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/admin/login` | Admin login | No |
| POST | `/admin/logout` | Admin logout | Admin |
| GET | `/admin/profile` | Admin profile | Admin |
| POST | `/admin/mfa/setup` | Setup MFA | Admin |
| POST | `/admin/mfa/verify` | Verify MFA | Admin |
| GET | `/admin/sessions` | List sessions | Admin |
| POST | `/admin/sessions/:id/revoke` | Revoke session | Admin |
| GET | `/admin/audit-logs` | List audit logs | Admin |

## Support

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/support/tickets` | List tickets (admin) | Admin |
| POST | `/support/tickets` | Create ticket | No |
| GET | `/support/tickets/:id` | Get ticket | Admin |
| POST | `/support/tickets/:id/messages` | Add message | Admin |
| PATCH | `/support/tickets/:id/status` | Update status | Admin |

## Demo Requests

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/demo-requests` | Submit demo request | No |
| GET | `/demo-requests` | List requests (admin) | Admin |
| PATCH | `/demo-requests/:id/status` | Update status (admin) | Admin |

## Platform Settings

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/platform/settings` | Get settings (admin) | Admin |
| PATCH | `/platform/settings` | Update settings (admin) | Admin |
| GET | `/platform/stats` | Platform stats (admin) | Admin |

## Error Response Format

```json
{
  "statusCode": 400,
  "message": "Validation failed",
  "error": "Bad Request"
}
```

## Rate Limits

- Auth endpoints: 5 requests/minute per IP
- Public endpoints: 30 requests/minute per IP
- General API: 100 requests/minute per IP
