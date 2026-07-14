# End-to-End Flow

## Flow 1: Restaurant Registration

```
Actor: Restaurant Owner
Entry: nexaros.com/register

Frontend (Marketing Web /register/page.tsx)
  → Form: restaurantName, businessType, email, phone, password, address
  → Validation: Required fields, email format, password match
  → POST /api/auth/register

Backend (auth.service.ts → register())
  → Validate unique email
  → Hash password (bcrypt, 12 rounds)
  → Create Tenant → User → Role → Branch (transaction)
  → Branch created as "{name} - Main" (isPrimary: true)
  → Generate JWT access + refresh tokens
  → Return tokens + user + tenant + branch info

Database (schema.prisma)
  → INSERT Tenant → INSERT User → INSERT Role → INSERT Branch
  → INSERT Permission (56 permissions)
  → INSERT RolePermission (all permissions for Owner)

Frontend Response
  → Store tokens in HttpOnly cookies + FlutterSecureStorage
  → Redirect to login or Flutter app download
```

## Flow 2: Login & Branch Selection

```
Actor: Restaurant Staff
Entry: Flutter App → Login Screen

Frontend (login_screen.dart)
  → Email + password → POST /api/auth/login
  → On success:
    → BranchProvider.loadBranches() → GET /api/branches
    → Select first branch (or saved branch)
    → AppState.onLogin(branchId)
    → Socket.IO connect + joinBranch
    → SubscriptionProvider.loadEntitlements()
    → Navigate to Shell (Mobile/Tablet/Desktop based on width)

Backend (auth.service.ts → login())
  → Validate email exists
  → Compare password (bcrypt)
  → Generate JWT tokens
  → Create RefreshToken record
  → Return accessToken + refreshToken + user info

Backend (branches.service.ts → findAll())
  → Query Branch WHERE tenantId = user.tenantId
  → Return branch list sorted by isPrimary DESC
```

## Flow 3: Place Order (POS)

```
Actor: Cashier/Server
Entry: Flutter App → POS Screen

Frontend (pos_screen.dart)
  → Select table (or take-away)
  → Add menu items (tap items → add to cart)
  → Adjust quantities, add notes
  → Submit order → POST /api/orders

Backend (orders.service.ts → create())
  → Validate items exist and are available
  → Calculate totals (subtotal, tax, discount, grand total)
  → Create Order + OrderItems in transaction
  → Emit Socket.IO event: order:created
  → Print KOT (if printer configured)
  → Return order with id

Kitchen Display (kitchen_display_screen.dart)
  → Receives socket event: order:created
  → Adds order to active orders list
  → Staff marks items as prepared
  → Emits: order:status-changed

Order List (order_list_screen.dart)
  → Real-time status updates via Socket.IO
  → Status flow: PENDING → CONFIRMED → PREPARING → READY → SERVED → COMPLETED
```

## Flow 4: Payment Processing

```
Actor: Cashier
Entry: Order ready for payment

Frontend (bill_preview_screen.dart)
  → Display order summary (items, quantities, totals)
  → Show applicable taxes
  → Apply coupon (if any)
  → Navigate to Payment Screen

Frontend (payment_screen.dart)
  → Select payment method: Cash / UPI / Card / Wallet / Online
  → Process payment → POST /api/payments/orders/:orderId

Backend (payments.service.ts → processPayment())
  → Call PaymentGateway.createOrder() (stub returns success)
  → Create Payment record
  → Update Order status to COMPLETED
  → Generate Invoice
  → Emit Socket.IO: payment:received
  → Return payment + invoice

Frontend
  → Show success screen
  → Print receipt (if printer configured)
  → Return to POS
```

## Flow 5: Subscription Lifecycle

```
Actor: Platform Admin / System

States:
  TRIAL (14d) → ACTIVE → PAYMENT_PENDING → GRACE_PERIOD (7d) → RESTRICTED → SUSPENDED (30d) → ARCHIVED (90d)

Backend (subscription-scheduler.ts — runs daily at 2AM)
  → Check TRIAL subscriptions past trialEndsAt → PAYMENT_PENDING
  → Check PAYMENT_PENDING past currentPeriodEnd → GRACE_PERIOD
  → Check GRACE_PERIOD past graceStartedAt + gracePeriodDays → RESTRICTED
  → Check SUSPENDED past 30 days → ARCHIVED
  → Check Payment Promises past expectedDate → update status

Restricted Mode
  → Allowed: POS, Orders, Kitchen, Tables, Payments, Invoices
  → Blocked: Reports, Analytics, CRM, Inventory, Staff, etc.
  → GracePeriodBanner shown in Flutter app
  → Can create PaymentPromise to extend access
```

## Flow 6: Multi-Branch Management

```
Actor: Restaurant Owner
Entry: Flutter App → More → Branches

Branch Creation:
  → Branch Management Screen → "Add Branch"
  → Form: name, address, phone
  → POST /api/branches (validates plan branch limit)
  → Branch created, added to BranchProvider list

Branch Switching:
  → Tap Branch Switcher in AppBar
  → Select branch from dropdown
  → BranchProvider.selectBranch()
  → AppState updates branchId
  → All screens reload with new branchId
  → Socket.IO joins new branch room

Staff Assignment:
  → Staff Assignment Screen → tap staff member's branch chip
  → Reassign dialog → select new branch
  → PATCH /api/staff/:id (update branchId)
  → Staff list refreshes
```

## Flow 7: Customer QR Ordering

```
Actor: Diner at restaurant
Entry: Scan QR code on table

Customer Web (/restaurant/[slug]/table/[tableId])
  → Load restaurant by slug
  → Load table by id
  → Display restaurant menu
  → Diner adds items to cart
  → Places order → POST /api/public/orders

Backend (public.service.ts)
  → Validate restaurant and table exist
  → Create order with tableId
  → Emit Socket.IO: order:created
  → Restaurant receives order in Kitchen Display

Order Tracking (/restaurant/[slug]/order/[orderId])
  → Real-time status updates via Socket.IO
  → Status: Placed → Confirmed → Preparing → Ready → Served
```

## Related Documents

- [User Flow](12_USER_FLOW.md)
- [Business Flow](13_BUSINESS_FLOW.md)
- [Screen Flow](11_SCREEN_FLOW.md)
- [API Documentation](21_API_DOCUMENTATION.md)
