# Modules

## Backend Modules (33)

### Authentication & User Management

| Module | Service | Controller | Purpose |
|--------|---------|------------|---------|
| auth | AuthService | AuthController | JWT auth, registration, login, password reset |
| tenants | TenantsService | TenantsController | Multi-tenant CRUD |
| branches | BranchesService | BranchesController | Branch CRUD, plan limits |
| users | UsersService | UsersController | User profiles |
| roles | RolesService | RolesController | RBAC with 56 permissions |

### Restaurant Operations

| Module | Service | Controller | Purpose |
|--------|---------|------------|---------|
| menu | MenuService | MenuController | Categories, items, variants, add-ons, images |
| orders | OrdersService | OrdersController | Order lifecycle, items, KOT |
| tables | TablesService | TablesController | Table status, floor plans |
| kitchen | KitchenService | KitchenController | KDS, active/completed orders |
| payments | PaymentsService | PaymentsController | 6 payment methods, refunds |
| invoices | InvoicesService | InvoicesController | GST invoice generation |

### Back Office

| Module | Service | Controller | Purpose |
|--------|---------|------------|---------|
| inventory | InventoryService | InventoryController | Stock tracking, adjustments |
| suppliers | SuppliersService | SuppliersController | Supplier CRUD |
| purchases | PurchasesService | PurchasesController | Purchase orders |
| staff | StaffService | StaffController | Employee profiles, shifts, attendance |
| reservations | ReservationsService | ReservationsController | Table booking |

### Analytics & Intelligence

| Module | Service | Controller | Purpose |
|--------|---------|------------|---------|
| reports | ReportsService | ReportsController | Daily sales, items, payments, revenue |
| ai | AiService | AiController | AI analytics (planned) |

### Platform & Billing

| Module | Service | Controller | Purpose |
|--------|---------|------------|---------|
| billing | BillingService | BillingController | Subscription lifecycle, grace period |
| plans | PlansService | PlansController | Platform plan CRUD |
| entitlements | EntitlementsService | EntitlementsController | Module access, feature flags |
| coupons | CouponsService | CouponsController | Coupon engine, festival campaigns |
| subscriptions | SubscriptionsService | SubscriptionsController | Subscription CRUD |

### Infrastructure

| Module | Service | Controller | Purpose |
|--------|---------|------------|---------|
| websockets | GatewayService | — | Socket.IO real-time events |
| sync | SyncService | SyncController | Offline data sync |
| printer | PrinterService | PrinterController | ESC/POS thermal printing |
| notifications | NotificationsService | NotificationsController | Push notifications |
| public | PublicService | PublicController | Public API for customer pages |

### Admin & Support

| Module | Service | Controller | Purpose |
|--------|---------|------------|---------|
| admin | AdminService | AdminController | Admin auth (MFA), sessions, audit |
| support | SupportService | SupportController | Ticket system, conversations |
| demo-requests | DemoRequestsService | DemoRequestsController | Demo pipeline |
| platform | PlatformService | PlatformController | Platform settings, maintenance |

## Guards

| Guard | File | Purpose |
|-------|------|---------|
| JwtAuthGuard | `common/guards/jwt-auth.guard.ts` | JWT token validation |
| AdminJwtAuthGuard | `common/guards/admin-jwt-auth.guard.ts` | Admin JWT validation |
| BranchScopeGuard | `common/guards/branch-scope.guard.ts` | Branch ownership check |
| EntitlementsGuard | `common/guards/entitlements.guard.ts` | Module access check |
| PermissionsGuard | `common/guards/permissions.guard.ts` | RBAC permission check |

## Middleware

| Middleware | File | Purpose |
|------------|------|---------|
| RateLimitMiddleware | `common/middleware/rate-limit.middleware.ts` | 100 req/min per IP |
| LoginRateLimitMiddleware | `common/middleware/login-rate-limit.middleware.ts` | 5 attempts/15min |
| PublicRateLimitMiddleware | `common/middleware/public-rate-limit.middleware.ts` | 30 req/min per IP |
| CsrfMiddleware | `common/middleware/csrf.middleware.ts` | CSRF protection |

## Related Documents

- [System Architecture](05_SYSTEM_ARCHITECTURE.md)
- [API Documentation](21_API_DOCUMENTATION.md)
- [Database](22_DATABASE.md)
