# API Documentation

## Overview

NexaROS backend exposes RESTful APIs with JWT authentication.

## Base URL

- **Development**: `http://localhost:4000/api`
- **Production**: `https://api.nexaros.com/api`
- **Swagger**: `http://localhost:4000/docs`

## Authentication

### Headers

```
Authorization: Bearer <token>
Content-Type: application/json
```

### Login

```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response:**

```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIs...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIs...",
  "user": {
    "id": "user-id",
    "email": "user@example.com",
    "role": "OWNER"
  },
  "tenant": {
    "id": "tenant-id",
    "name": "Restaurant Name"
  }
}
```

## Common Endpoints

### Tenants

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/tenants` | List tenants |
| GET | `/tenants/:id` | Get tenant |
| PATCH | `/tenants/:id` | Update tenant |

### Branches

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/branches` | List branches |
| GET | `/branches/:id` | Get branch |
| POST | `/branches` | Create branch |
| PATCH | `/branches/:id` | Update branch |
| DELETE | `/branches/:id` | Delete branch |

### Menu

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/menu/categories` | List categories |
| POST | `/menu/categories` | Create category |
| GET | `/menu/items` | List items |
| POST | `/menu/items` | Create item |
| PATCH | `/menu/items/:id` | Update item |
| DELETE | `/menu/items/:id` | Delete item |

### Orders

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/orders` | List orders |
| POST | `/orders` | Create order |
| GET | `/orders/:id` | Get order |
| PATCH | `/orders/:id/status` | Update status |
| POST | `/orders/:id/kot` | Print KOT |
| POST | `/orders/:id/cancel` | Cancel order |

### Tables

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/tables` | List tables |
| GET | `/tables/floor-plan` | Get floor plan |
| PATCH | `/tables/:id/status` | Update status |

### Payments

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/payments/orders/:orderId` | Process payment |
| GET | `/payments/orders/:orderId` | Get payments |

### Invoices

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/invoices/payments/:paymentId` | Generate invoice |
| GET | `/invoices` | List invoices |
| GET | `/invoices/:id/pdf` | Get PDF |

### Inventory

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/inventory` | List items |
| POST | `/inventory` | Create item |
| PATCH | `/inventory/:id` | Update item |
| DELETE | `/inventory/:id` | Delete item |
| POST | `/inventory/:id/adjust` | Adjust stock |
| GET | `/inventory/low-stock` | Low stock alerts |

### Staff

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/staff` | List staff |
| POST | `/staff` | Create staff |
| PATCH | `/staff/:id` | Update staff |
| DELETE | `/staff/:id` | Delete staff |
| POST | `/staff/:id/clock-in` | Clock in |
| POST | `/staff/:id/clock-out` | Clock out |

### Kitchen

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/kitchen/orders` | Active orders |
| GET | `/kitchen/orders/completed` | Completed orders |
| PATCH | `/kitchen/orders/:id/status` | Update status |

### Reservations

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/reservations` | List reservations |
| GET | `/reservations/today` | Today's reservations |
| POST | `/reservations` | Create reservation |
| PATCH | `/reservations/:id` | Update reservation |
| DELETE | `/reservations/:id` | Delete reservation |

### Reports

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/reports/:type` | Get report |
| GET | `/reports/export/:type` | Export report |

### Billing

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/billing/entitlements/:tenantId` | Get entitlements |
| POST | `/billing/checkout` | Create checkout |
| POST | `/billing/transition` | Transition subscription |
| POST | `/billing/payment-promise` | Create promise |

### Coupons

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/coupons/validate` | Validate coupon |
| POST | `/coupons` | Create coupon |
| GET | `/coupons` | List coupons |
| PUT | `/coupons/:id` | Update coupon |

### Admin

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/admin/login` | Admin login |
| POST | `/admin/logout` | Admin logout |
| GET | `/admin/profile` | Admin profile |
| POST | `/admin/mfa/setup` | Setup MFA |
| POST | `/admin/mfa/verify` | Verify MFA |

### Support

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/support/tickets` | List tickets |
| POST | `/support/tickets` | Create ticket |
| POST | `/support/tickets/:id/messages` | Add message |

### Demo Requests

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/demo-requests` | Submit request |
| GET | `/demo-requests` | List requests |
| PATCH | `/demo-requests/:id/status` | Update status |

### Platform

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/platform/settings` | Get settings |
| PATCH | `/platform/settings` | Update settings |
| GET | `/platform/stats` | Platform stats |

### Public

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/public/restaurant/:slug` | Restaurant info |
| GET | `/public/restaurant/:slug/menu` | Restaurant menu |
| POST | `/public/orders` | Place order |
| GET | `/public/orders/:id` | Track order |

## Error Responses

```json
{
  "statusCode": 400,
  "message": "Validation failed",
  "error": "Bad Request"
}
```

## Rate Limits

| Endpoint | Limit |
|----------|-------|
| Auth | 5/min |
| Admin | 5/15min |
| Public | 30/min |
| General | 100/min |

## Related Documents

- [Modules](08_MODULES.md)
- [Database](22_DATABASE.md)
