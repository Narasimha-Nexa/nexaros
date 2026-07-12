# NexaROS — Complete Build Plan

> AI-Powered Restaurant Operating System  
> Real-Time, Multi-Tenant, Offline-First, Enterprise SaaS Platform

---

## Constraints Summary

| Constraint | Value |
|---|---|
| Developer | Solo |
| Budget | Zero (free only) |
| Timeline | No pressure |
| Offline | Full offline with auto-sync |
| Hardware | Printers, scanners, cash drawers |
| Languages | Multi-language from day one |
| Payments | All (Cash, UPI, Cards, Online) |
| Restaurant Sizes | All |

---

## Critical Architecture Decision: Offline-First

Since network signals are not always stable, NexaROS must be **offline-first**, not offline-capable. The difference:

```
Offline-capable:  App works online, degrades gracefully offline
Offline-first:    App works primarily offline, syncs when online
```

This changes everything. Your data flow becomes:

```
Flutter App (Local SQLite)
        │
        ├── Queue: Orders, KOTs, Payments, Menu edits
        │
        ├── Sync Engine (when internet available)
        │       │
        │       ▼
        │   NestJS Backend
        │       │
        │       ▼
        │   PostgreSQL (Cloud)
        │       │
        │       ▼
        │   Other devices receive updates
        │
        └── Conflict Resolution
```

---

## Complete Technology Stack (All Free)

### Frontend Applications

| Application | Technology | Cost |
|---|---|---|
| Marketing Website | Next.js 16 + TypeScript + Tailwind CSS v4 | Free |
| Restaurant Website | Next.js 16 + PWA + i18n | Free |
| Desktop App (.deb) | Flutter Desktop (Linux) | Free |
| Mobile App | Flutter (Android) | Free |
| Tablet App | Flutter (same codebase) | Free |
| Kitchen Display (TV) | Flutter Desktop or web app on TV browser | Free |

### Backend & Infrastructure

| Layer | Technology | Cost |
|---|---|---|
| API Server | NestJS | Free |
| Database | PostgreSQL (local Docker + Railway free tier) | Free |
| ORM | Prisma | Free |
| Cache | Redis (local Docker) | Free |
| Real-time | Socket.IO | Free |
| Local Database (Offline) | SQLite (via sqflite/drift) | Free |
| Auth | Supabase Auth (free tier: 50K MAU) | Free |
| File Storage | Supabase Storage or Cloudflare R2 (10GB free) | Free |
| Email | Resend (100 emails/day free) or Nodemailer | Free |
| Payments | Razorpay (zero setup cost, pay per transaction) | Free |
| SMS/WhatsApp | WhatsApp Business API via Meta (free for business) | Free |
| Containerization | Docker + Docker Compose | Free |
| CI/CD | GitHub Actions (2000 min/month free) | Free |
| Domain | Freenom or ₹100/year .in domain | Near free |
| Hosting Backend | Railway (free tier) or Coolify on free VPS | Free |

---

## Complete Database Schema (Prisma)

This is the foundation. Every table includes a `tenantId` for multi-tenancy.

```prisma
// ─── TENANT LAYER ───
model Tenant {
  id            String   @id @default(cuid())
  name          String
  slug          String   @unique
  logo          String?
  phone         String?
  email         String?
  address       String?
  gstNumber     String?
  panNumber     String?
  timezone      String   @default("Asia/Kolkata")
  currency      String   @default("INR")
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
  
  // Relations
  branches      Branch[]
  users         User[]
  subscriptions Subscription[]
  plans         Plan[]
  roles         Role[]
  auditLogs     AuditLog[]
}

model Branch {
  id          String   @id @default(cuid())
  tenantId    String
  tenant      Tenant   @relation(fields: [tenantId], references: [id])
  name        String
  address     String?
  phone       String?
  isPrimary   Boolean  @default(false)
  isActive    Boolean  @default(true)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  
  tables      RestaurantTable[]
  orders      Order[]
  staff       Staff[]
  inventory   Inventory[]
  shifts      Shift[]
  payments    Payment[]
}

// ─── AUTH & USERS ───
model User {
  id          String   @id @default(cuid())
  tenantId    String
  tenant      Tenant   @relation(fields: [tenantId], references: [id])
  email       String   @unique
  phone       String?  @unique
  password    String
  firstName   String
  lastName    String
  avatar      String?
  role        UserRole @default(OWNER)
  isActive    Boolean  @default(true)
  lastLoginAt DateTime?
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  
  staff       Staff[]
  auditLogs   AuditLog[]
  refreshTokens RefreshToken[]
}

enum UserRole {
  OWNER
  MANAGER
  STAFF
}

model RefreshToken {
  id        String   @id @default(cuid())
  userId    String
  user      User     @relation(fields: [userId], references: [id])
  token     String   @unique
  expiresAt DateTime
  createdAt DateTime @default(now())
}

// ─── ROLE & PERMISSIONS ───
model Role {
  id          String   @id @default(cuid())
  tenantId    String
  tenant      Tenant   @relation(fields: [tenantId], references: [id])
  name        String
  description String?
  isSystem    Boolean  @default(false)
  createdAt   DateTime @default(now())
  
  permissions RolePermission[]
  staff       Staff[]
}

model Permission {
  id          String   @id @default(cuid())
  module      String
  action      String
  description String?
  
  roles       RolePermission[]
  
  @@unique([module, action])
}

model RolePermission {
  id           String     @id @default(cuid())
  roleId       String
  role         Role       @relation(fields: [roleId], references: [id])
  permissionId String
  permission   Permission @relation(fields: [permissionId], references: [id])
  
  @@unique([roleId, permissionId])
}

model Staff {
  id          String   @id @default(cuid())
  branchId    String
  branch      Branch   @relation(fields: [branchId], references: [id])
  userId      String?
  user        User?    @relation(fields: [userId], references: [id])
  roleId      String
  role        Role     @relation(fields: [roleId], references: [id])
  name        String
  phone       String?
  pin         String?
  isActive    Boolean  @default(true)
  createdAt   DateTime @default(now())
  
  orders      Order[]
  shifts      StaffShift[]
  attendance  Attendance[]
}

// ─── MENU ───
model Category {
  id          String   @id @default(cuid())
  tenantId    String
  tenant      Tenant   @relation(fields: [tenantId], references: [id])
  name        String
  description String?
  sortOrder   Int      @default(0)
  isActive    Boolean  @default(true)
  image       String?
  
  items       MenuItem[]
}

model MenuItem {
  id            String   @id @default(cuid())
  tenantId      String
  tenant        Tenant   @relation(fields: [tenantId], references: [id])
  categoryId    String
  category      Category @relation(fields: [categoryId], references: [id])
  name          String
  description   String?
  price         Decimal  @db.Decimal(10, 2)
  costPrice     Decimal? @db.Decimal(10, 2)
  sku           String?
  barcode       String?
  image         String?
  isVeg         Boolean  @default(false)
  isAvailable   Boolean  @default(true)
  prepTimeMin   Int?
  sortOrder     Int      @default(0)
  taxRate       Decimal  @default(0) @db.Decimal(5, 2)
  tags          String[]
  
  variants      MenuItemVariant[]
  addOns        MenuItemAddOn[]
  orderItems    OrderItem[]
  inventoryItems InventoryItem[]
}

model MenuItemVariant {
  id         String   @id @default(cuid())
  menuItemId String
  menuItem   MenuItem @relation(fields: [menuItemId], references: [id])
  name       String
  price      Decimal  @db.Decimal(10, 2)
  isActive   Boolean  @default(true)
}

model MenuItemAddOn {
  id         String   @id @default(cuid())
  menuItemId String
  menuItem   MenuItem @relation(fields: [menuItemId], references: [id])
  name       String
  price      Decimal  @db.Decimal(10, 2)
  isActive   Boolean  @default(true)
}

// ─── TABLES ───
model RestaurantTable {
  id          String      @id @default(cuid())
  branchId    String
  branch      Branch      @relation(fields: [branchId], references: [id])
  number      Int
  name        String?
  capacity    Int         @default(4)
  status      TableStatus @default(FREE)
  qrCode      String?
  isActive    Boolean     @default(true)
  
  orders      Order[]
  reservations Reservation[]
  
  @@unique([branchId, number])
}

enum TableStatus {
  FREE
  OCCUPIED
  RESERVED
  CLEANING
  ORDER_READY
  BILLING
}

// ─── ORDERS ───
model Order {
  id            String      @id @default(cuid())
  branchId      String
  branch        Branch      @relation(fields: [branchId], references: [id])
  tableId       String?
  table         RestaurantTable? @relation(fields: [tableId], references: [id])
  staffId       String?
  staff         Staff?      @relation(fields: [staffId], references: [id])
  
  orderNumber   Int
  type          OrderType
  status        OrderStatus @default(PENDING)
  customerName  String?
  customerPhone String?
  guestCount    Int?
  
  subtotal      Decimal     @db.Decimal(10, 2)
  taxAmount     Decimal     @db.Decimal(10, 2)
  discountAmount Decimal    @db.Decimal(10, 2) @default(0)
  totalAmount   Decimal     @db.Decimal(10, 2)
  
  notes         String?
  kotPrinted    Boolean     @default(false)
  synced        Boolean     @default(false)
  localId       String?
  createdAt     DateTime    @default(now())
  updatedAt     DateTime    @updatedAt
  
  items         OrderItem[]
  payments      Payment[]
  statusHistory OrderStatusHistory[]
  
  @@index([branchId, status])
  @@index([createdAt])
}

enum OrderType {
  DINE_IN
  TAKEAWAY
  DELIVERY
  QR_ORDER
}

enum OrderStatus {
  PENDING
  CONFIRMED
  PREPARING
  READY
  SERVED
  COMPLETED
  CANCELLED
}

model OrderItem {
  id            String      @id @default(cuid())
  orderId       String
  order         Order       @relation(fields: [orderId], references: [id])
  menuItemId    String
  menuItem      MenuItem    @relation(fields: [menuItemId], references: [id])
  variantId     String?
  name          String
  quantity      Int
  unitPrice     Decimal     @db.Decimal(10, 2)
  totalPrice    Decimal     @db.Decimal(10, 2)
  notes         String?
  status        OrderItemStatus @default(PENDING)
  
  addOns        OrderItemAddOn[]
}

enum OrderItemStatus {
  PENDING
  PREPARING
  READY
  SERVED
  CANCELLED
}

model OrderItemAddOn {
  id           String @id @default(cuid())
  orderItemId  String
  orderItem    OrderItem @relation(fields: [orderItemId], references: [id])
  name         String
  price        Decimal @db.Decimal(10, 2)
}

model OrderStatusHistory {
  id        String      @id @default(cuid())
  orderId   String
  order     Order       @relation(fields: [orderId], references: [id])
  status    OrderStatus
  notes     String?
  createdAt DateTime    @default(now())
}

// ─── PAYMENTS ───
model Payment {
  id            String      @id @default(cuid())
  orderId       String
  order         Order       @relation(fields: [orderId], references: [id])
  branchId      String
  branch        Branch      @relation(fields: [branchId], references: [id])
  method        PaymentMethod
  amount        Decimal     @db.Decimal(10, 2)
  reference     String?
  status        PaymentStatus @default(PENDING)
  receivedAt    DateTime    @default(now())
  
  invoice       Invoice?
}

enum PaymentMethod {
  CASH
  UPI
  CREDIT_CARD
  DEBIT_CARD
  NET_BANKING
  WALLET
  ONLINE
}

enum PaymentStatus {
  PENDING
  COMPLETED
  FAILED
  REFUNDED
}

model Invoice {
  id          String   @id @default(cuid())
  paymentId   String   @unique
  payment     Payment  @relation(fields: [paymentId], references: [id])
  number      String
  gstAmount   Decimal  @db.Decimal(10, 2)
  cgst        Decimal  @db.Decimal(10, 2)
  sgst        Decimal  @db.Decimal(10, 2)
  igst        Decimal  @db.Decimal(10, 2)
  pdfUrl      String?
  createdAt   DateTime @default(now())
}

// ─── INVENTORY ───
model InventoryItem {
  id              String   @id @default(cuid())
  tenantId        String
  tenant          Tenant   @relation(fields: [tenantId], references: [id])
  name            String
  unit            String
  currentStock    Decimal  @default(0) @db.Decimal(10, 2)
  minimumStock    Decimal  @default(0) @db.Decimal(10, 2)
  costPrice       Decimal  @db.Decimal(10, 2)
  reorderQuantity Decimal? @db.Decimal(10, 2)
  barcode         String?
  
  menuItems       MenuItem[]
  stockMovements  StockMovement[]
  purchaseItems   PurchaseItem[]
}

model StockMovement {
  id              String        @id @default(cuid())
  inventoryItemId String
  inventoryItem   InventoryItem @relation(fields: [inventoryItemId], references: [id])
  type            StockMovementType
  quantity        Decimal       @db.Decimal(10, 2)
  reference       String?
  notes           String?
  createdAt       DateTime      @default(now())
}

enum StockMovementType {
  PURCHASE
  SALE
  WASTE
  ADJUSTMENT
  TRANSFER
}

// ─── SUPPLIERS ───
model Supplier {
  id          String   @id @default(cuid())
  tenantId    String
  tenant      Tenant   @relation(fields: [tenantId], references: [id])
  name        String
  phone       String?
  email       String?
  address     String?
  gstNumber   String?
  isActive    Boolean  @default(true)
  
  purchases   Purchase[]
}

model Purchase {
  id          String   @id @default(cuid())
  tenantId    String
  tenant      Tenant   @relation(fields: [tenantId], references: [id])
  supplierId  String
  supplier    Supplier @relation(fields: [supplierId], references: [id])
  totalAmount Decimal  @db.Decimal(10, 2)
  status      PurchaseStatus @default(PENDING)
  notes       String?
  createdAt   DateTime @default(now())
  
  items       PurchaseItem[]
}

enum PurchaseStatus {
  PENDING
  RECEIVED
  CANCELLED
}

model PurchaseItem {
  id              String        @id @default(cuid())
  purchaseId      String
  purchase        Purchase      @relation(fields: [purchaseId], references: [id])
  inventoryItemId String
  inventoryItem   InventoryItem @relation(fields: [inventoryItemId], references: [id])
  quantity        Decimal       @db.Decimal(10, 2)
  unitPrice       Decimal       @db.Decimal(10, 2)
  totalCost       Decimal       @db.Decimal(10, 2)
}

// ─── RESERVATIONS ───
model Reservation {
  id            String   @id @default(cuid())
  tenantId      String
  tenant        Tenant   @relation(fields: [tenantId], references: [id])
  tableId       String?
  table         RestaurantTable? @relation(fields: [tableId], references: [id])
  customerName  String
  customerPhone String
  date          DateTime
  time          String
  guestCount    Int
  status        ReservationStatus @default(CONFIRMED)
  notes         String?
  createdAt     DateTime @default(now())
}

enum ReservationStatus {
  CONFIRMED
  ARRIVED
  COMPLETED
  CANCELLED
  NO_SHOW
}

// ─── STAFF MANAGEMENT ───
model Shift {
  id        String   @id @default(cuid())
  branchId  String
  branch    Branch   @relation(fields: [branchId], references: [id])
  name      String
  startTime String
  endTime   String
  
  staffShifts StaffShift[]
}

model StaffShift {
  id        String   @id @default(cuid())
  shiftId   String
  shift     Shift    @relation(fields: [shiftId], references: [id])
  staffId   String
  staff     Staff    @relation(fields: [staffId], references: [id])
  date      DateTime
  status    ShiftStatus @default(ASSIGNED)
}

enum ShiftStatus {
  ASSIGNED
  CHECKED_IN
  CHECKED_OUT
  ABSENT
}

model Attendance {
  id        String   @id @default(cuid())
  staffId   String
  staff     Staff    @relation(fields: [staffId], references: [id])
  date      DateTime
  checkIn   DateTime?
  checkOut  DateTime?
  status    AttendanceStatus @default(PRESENT)
  notes     String?
}

enum AttendanceStatus {
  PRESENT
  ABSENT
  HALF_DAY
  LEAVE
}

// ─── SUBSCRIPTIONS ───
model Plan {
  id            String   @id @default(cuid())
  tenantId      String
  tenant        Tenant   @relation(fields: [tenantId], references: [id])
  name          String
  price         Decimal  @db.Decimal(10, 2)
  billingCycle  BillingCycle @default(MONTHLY)
  maxBranches   Int      @default(1)
  maxStaff      Int      @default(10)
  features      String[]
  isActive      Boolean  @default(true)
  
  subscriptions Subscription[]
}

enum BillingCycle {
  MONTHLY
  YEARLY
  LIFETIME
}

model Subscription {
  id          String             @id @default(cuid())
  tenantId    String
  tenant      Tenant             @relation(fields: [tenantId], references: [id])
  planId      String
  plan        Plan               @relation(fields: [planId], references: [id])
  status      SubscriptionStatus @default(ACTIVE)
  startDate   DateTime
  endDate     DateTime?
  razorpayId  String?
  createdAt   DateTime           @default(now())
}

enum SubscriptionStatus {
  ACTIVE
  PAUSED
  CANCELLED
  EXPIRED
}

// ─── AUDIT LOG ───
model AuditLog {
  id        String   @id @default(cuid())
  tenantId  String
  tenant    Tenant   @relation(fields: [tenantId], references: [id])
  userId    String
  user      User     @relation(fields: [userId], references: [id])
  action    String
  entity    String
  entityId  String?
  oldData   Json?
  newData   Json?
  ipAddress String?
  createdAt DateTime @default(now())
  
  @@index([tenantId, createdAt])
}
```

---

## Offline-First Architecture

### How Offline Works in Flutter Desktop

```
Flutter App (Local SQLite)
        │
        ├── Queue: Orders, KOTs, Payments, Menu edits
        │
        ├── Sync Engine (when internet available)
        │       │
        │       ▼
        │   NestJS Backend
        │       │
        │       ▼
        │   PostgreSQL (Cloud)
        │       │
        │       ▼
        │   Other devices receive updates
        │
        └── Conflict Resolution
```

### Key Principle: Never lose data

Even if the internet is down for hours:

1. Waiter takes order → saved to local SQLite instantly
2. Kitchen KOT prints immediately from local data
3. Order goes into sync queue
4. When internet returns → sync queue uploads orders to server
5. Server assigns proper `orderNumber` and broadcasts to other devices
6. Conflict resolution if same record was modified on multiple devices

### Drift (SQLite ORM for Flutter)

```dart
// This is the local database that works offline
// Every table in Prisma has a mirror in Drift

@DriftDatabase(tables: [
  LocalOrders,
  LocalOrderItems,
  LocalMenuItems,
  LocalCategories,
  LocalTables,
  LocalPayments,
  LocalSyncQueue,
])
class LocalDatabase extends _$LocalDatabase {
  LocalDatabase() : super(_openConnection());
  
  @override
  int get schemaVersion => 1;
}

// Sync queue tracks everything that needs to be uploaded
class LocalSyncQueue extends Table {
  TextColumn get id => text()();
  TextColumn get entityType => text()();
  TextColumn get entityId => text()();
  TextColumn get action => text()();
  TextColumn get payload => text()();
  DateTimeColumn get createdAt => dateTime()();
  BoolColumn get synced => boolean().withDefault(const Constant(false))();
}
```

---

## Device Integration (Printers, Scanners, Cash Drawers)

### What works on Linux (Flutter Desktop)

| Device | Solution | Difficulty |
|---|---|---|
| Thermal Receipt Printer | CUPS + `printing` package or ESC/POS direct via USB | Medium |
| Kitchen Printer | Same as above, network printer via IP | Medium |
| Barcode Scanner | USB HID (appears as keyboard) | Easy |
| Cash Drawer | Via receipt printer (pulse command) or USB | Medium |
| Cash Register Display | Serial/USB | Hard |

### Recommended Approach: ESC/POS Direct

```
Flutter Desktop
      │
      ▼
ESC/POS Library (esc_pos_printer or custom)
      │
      ├── Network Printer (WiFi/Ethernet)
      │     TCP Connection to printer IP
      │     e.g., 192.168.1.100:9100
      │
      ├── USB Printer
      │     Write directly to /dev/usb/lp0
      │     Or via CUPS
      │
      └── Bluetooth Printer
            Serial port communication
```

### Print Flow

```
Order Created
      │
      ▼
Flutter App
      │
      ├── 1. Save to local SQLite
      ├── 2. Print KOT to Kitchen Printer
      ├── 3. Print Receipt to Counter Printer
      ├── 4. Open Cash Drawer (if cash payment)
      └── 5. Add to sync queue
```

### Barcode Scanner Integration

```
USB Barcode Scanner
      │
      ▼
Linux detects as HID keyboard
      │
      ▼
Flutter receives keystrokes
      │
      ▼
Parse barcode string
      │
      ▼
Lookup in local SQLite menu_items table
      │
      ▼
Add to current order
```

---

## Folder Structure (Complete Monorepo)

```
nexaros/
│
├── apps/
│   ├── marketing-web/          # Next.js - Branding & Acquisition
│   │   ├── src/
│   │   │   ├── app/            # App Router pages
│   │   │   ├── components/     # UI components
│   │   │   ├── lib/            # Utilities
│   │   │   └── content/        # Blog posts, docs
│   │   ├── public/
│   │   ├── package.json
│   │   └── next.config.ts
│   │
│   ├── customer-web/           # Next.js - Restaurant website for customers
│   │   ├── src/
│   │   │   ├── app/
│   │   │   ├── components/
│   │   │   └── lib/
│   │   ├── public/
│   │   ├── package.json
│   │   └── next.config.ts
│   │
│   ├── backend/                # NestJS API Server
│   │   ├── src/
│   │   │   ├── modules/
│   │   │   │   ├── auth/
│   │   │   │   ├── tenants/
│   │   │   │   ├── branches/
│   │   │   │   ├── users/
│   │   │   │   ├── roles/
│   │   │   │   ├── menu/
│   │   │   │   ├── orders/
│   │   │   │   ├── tables/
│   │   │   │   ├── kitchen/
│   │   │   │   ├── inventory/
│   │   │   │   ├── suppliers/
│   │   │   │   ├── payments/
│   │   │   │   ├── invoices/
│   │   │   │   ├── reservations/
│   │   │   │   ├── staff/
│   │   │   │   ├── reports/
│   │   │   │   ├── notifications/
│   │   │   │   ├── sync/
│   │   │   │   ├── printer/
│   │   │   │   ├── websockets/
│   │   │   │   └── ai/
│   │   │   ├── common/
│   │   │   │   ├── guards/
│   │   │   │   ├── decorators/
│   │   │   │   ├── interceptors/
│   │   │   │   ├── filters/
│   │   │   │   └── pipes/
│   │   │   └── config/
│   │   ├── prisma/
│   │   │   ├── schema.prisma
│   │   │   ├── migrations/
│   │   │   └── seed.ts
│   │   ├── test/
│   │   ├── Dockerfile
│   │   ├── package.json
│   │   └── tsconfig.json
│   │
│   └── flutter-app/            # Flutter Desktop + Mobile + Tablet + TV
│       ├── lib/
│       │   ├── main.dart
│       │   ├── app/
│       │   │   ├── app.dart
│       │   │   ├── shells/
│       │   │   │   ├── mobile_shell.dart
│       │   │   │   ├── tablet_shell.dart
│       │   │   │   ├── desktop_shell.dart
│       │   │   │   └── tv_shell.dart
│       │   │   └── routing/
│       │   │       └── app_router.dart
│       │   │
│       │   ├── core/
│       │   │   ├── responsive/
│       │   │   │   ├── breakpoints.dart
│       │   │   │   ├── device_type.dart
│       │   │   │   └── responsive_layout.dart
│       │   │   ├── theme/
│       │   │   │   ├── app_theme.dart
│       │   │   │   └── app_colors.dart
│       │   │   ├── constants/
│       │   │   │   └── app_constants.dart
│       │   │   ├── database/
│       │   │   │   ├── local_database.dart
│       │   │   │   ├── tables/
│       │   │   │   └── sync_engine.dart
│       │   │   ├── printer/
│       │   │   │   ├── esc_pos_service.dart
│       │   │   │   ├── receipt_printer.dart
│       │   │   │   ├── kitchen_printer.dart
│       │   │   │   └── cash_drawer.dart
│       │   │   ├── scanner/
│       │   │   │   └── barcode_scanner.dart
│       │   │   ├── network/
│       │   │   │   ├── api_client.dart
│       │   │   │   ├── socket_service.dart
│       │   │   │   └── connectivity_monitor.dart
│       │   │   ├── i18n/
│       │   │   │   ├── app_localizations.dart
│       │   │   │   ├── en.dart
│       │   │   │   ├── hi.dart
│       │   │   │   ├── kn.dart
│       │   │   │   └── te.dart
│       │   │   └── utils/
│       │   │       ├── date_utils.dart
│       │   │       ├── currency_utils.dart
│       │   │       └── validators.dart
│       │   │
│       │   ├── features/
│       │   │   ├── auth/
│       │   │   │   ├── data/
│       │   │   │   │   ├── auth_repository.dart
│       │   │   │   │   └── auth_api.dart
│       │   │   │   ├── domain/
│       │   │   │   │   └── auth_models.dart
│       │   │   │   └── presentation/
│       │   │   │       ├── login_screen.dart
│       │   │   │       └── auth_provider.dart
│       │   │   │
│       │   │   ├── dashboard/
│       │   │   │   ├── data/
│       │   │   │   ├── domain/
│       │   │   │   ├── mobile/
│       │   │   │   │   └── dashboard_mobile.dart
│       │   │   │   ├── tablet/
│       │   │   │   │   └── dashboard_tablet.dart
│       │   │   │   ├── desktop/
│       │   │   │   │   └── dashboard_desktop.dart
│       │   │   │   ├── tv/
│       │   │   │   │   └── dashboard_tv.dart
│       │   │   │   └── widgets/
│       │   │   │       ├── revenue_card.dart
│       │   │   │       ├── orders_summary.dart
│       │   │   │       └── live_activity.dart
│       │   │   │
│       │   │   ├── orders/
│       │   │   │   ├── data/
│       │   │   │   ├── domain/
│       │   │   │   ├── mobile/
│       │   │   │   ├── tablet/
│       │   │   │   ├── desktop/
│       │   │   │   ├── tv/
│       │   │   │   └── widgets/
│       │   │   │
│       │   │   ├── pos/
│       │   │   │   ├── data/
│       │   │   │   ├── domain/
│       │   │   │   ├── mobile/
│       │   │   │   ├── tablet/
│       │   │   │   ├── desktop/
│       │   │   │   └── widgets/
│       │   │   │
│       │   │   ├── menu/
│       │   │   │   ├── data/
│       │   │   │   ├── domain/
│       │   │   │   ├── mobile/
│       │   │   │   ├── tablet/
│       │   │   │   ├── desktop/
│       │   │   │   └── widgets/
│       │   │   │
│       │   │   ├── kitchen/
│       │   │   │   ├── data/
│       │   │   │   ├── domain/
│       │   │   │   ├── tv/
│       │   │   │   ├── desktop/
│       │   │   │   └── widgets/
│       │   │   │
│       │   │   ├── tables/
│       │   │   │   ├── data/
│       │   │   │   ├── domain/
│       │   │   │   ├── mobile/
│       │   │   │   ├── tablet/
│       │   │   │   ├── desktop/
│       │   │   │   └── widgets/
│       │   │   │
│       │   │   ├── inventory/
│       │   │   │   ├── data/
│       │   │   │   ├── domain/
│       │   │   │   ├── mobile/
│       │   │   │   ├── tablet/
│       │   │   │   ├── desktop/
│       │   │   │   └── widgets/
│       │   │   │
│       │   │   ├── payments/
│       │   │   │   ├── data/
│       │   │   │   ├── domain/
│       │   │   │   └── widgets/
│       │   │   │
│       │   │   ├── reservations/
│       │   │   │   ├── data/
│       │   │   │   ├── domain/
│       │   │   │   └── widgets/
│       │   │   │
│       │   │   ├── reports/
│       │   │   │   ├── data/
│       │   │   │   ├── domain/
│       │   │   │   └── widgets/
│       │   │   │
│       │   │   ├── staff/
│       │   │   │   ├── data/
│       │   │   │   ├── domain/
│       │   │   │   └── widgets/
│       │   │   │
│       │   │   ├── settings/
│       │   │   │   ├── data/
│       │   │   │   ├── domain/
│       │   │   │   └── widgets/
│       │   │   │
│       │   │   └── ai_assistant/
│       │   │       ├── data/
│       │   │       ├── domain/
│       │   │       └── widgets/
│       │   │
│       │   └── shared/
│       │       ├── widgets/
│       │       │   ├── nexaros_card.dart
│       │       │   ├── nexaros_button.dart
│       │       │   ├── nexaros_table.dart
│       │       │   ├── nexaros_chart.dart
│       │       │   ├── order_status_badge.dart
│       │       │   └── table_status_indicator.dart
│       │       ├── models/
│       │       ├── services/
│       │       └── providers/
│       │
│       ├── linux/
│       ├── android/
│       ├── ios/
│       ├── macos/
│       ├── windows/
│       ├── pubspec.yaml
│       └── Makefile
│
├── packages/
│   ├── types/
│   │   └── src/
│   │       ├── order.ts
│   │       ├── menu.ts
│   │       ├── user.ts
│   │       └── index.ts
│   ├── ui/
│   │   └── src/
│   ├── config/
│   │   ├── eslint/
│   │   ├── prettier/
│   │   ├── tsconfig/
│   │   └── tailwind/
│   └── api-client/
│       └── src/
│
├── docker/
│   ├── docker-compose.yml
│   ├── docker-compose.dev.yml
│   ├── Dockerfile.backend
│   ├── Dockerfile.marketing
│   └── Dockerfile.customer
│
├── docs/
│   ├── architecture.md
│   ├── api.md
│   ├── database.md
│   ├── deployment.md
│   ├── hardware.md
│   └── offline.md
│
├── scripts/
│   ├── setup.sh
│   ├── seed.sh
│   └── deploy.sh
│
├── .github/
│   └── workflows/
│       ├── ci.yml
│       └── deploy.yml
│
├── .env.example
├── .gitignore
├── pnpm-workspace.yaml
├── package.json
└── README.md
```

---

## Development Roadmap (Build Order)

### Phase 1 — Foundation (Weeks 1-6)

**Goal:** Authentication, multi-tenancy, and basic menu management working with real data.

```
Week 1-2: Project Setup
├── Initialize monorepo with pnpm workspaces
├── Set up Git + GitHub repository
├── Docker Compose: PostgreSQL + Redis
├── NestJS backend with Prisma schema (all tables above)
├── Database migrations
└── Seed script with test data

Week 3-4: Authentication & Multi-Tenancy
├── Registration (restaurant owner creates account)
├── Login (JWT + refresh tokens)
├── Tenant creation on registration
├── Branch creation
├── Role system (Owner, Manager, Staff)
├── Permission system (all modules)
├── Flutter app: Login screen
├── Flutter app: Dashboard shell (responsive)
└── Supabase Auth or custom JWT

Week 5-6: Menu Management
├── CRUD APIs for Categories, Menu Items, Variants, Add-ons
├── Flutter: Menu management screens (all devices)
├── Image upload (Cloudflare R2 free tier)
├── Menu availability toggle
├── Search and filter
└── Connect to real PostgreSQL database
```

**At this point:** You can log in, create a restaurant, add menu items. Everything from the real database.

---

### Phase 2 — Orders & POS (Weeks 7-12)

**Goal:** Place orders, print KOTs, process payments.

```
Week 7-8: Table Management
├── CRUD APIs for tables
├── QR code generation per table
├── Table status management
├── Floor plan view (tablet/desktop)
├── Table grid (mobile)
└── Real-time table status updates

Week 9-10: Order System
├── Create order API
├── Add/remove items API
├── Order status workflow
├── KOT generation
├── Order number generation
├── Table assignment
├── Flutter POS screen
├── Flutter order list screen
└── Socket.IO for real-time order updates

Week 11-12: Payments & Billing
├── Payment processing APIs
├── Cash payment
├── UPI payment (Razorpay)
├── Bill generation
├── Invoice generation (GST)
├── Receipt printing (ESC/POS)
├── Cash drawer trigger
└── Payment history
```

**At this point:** A restaurant can take orders, print receipts, and process payments.

---

### Phase 3 — Offline & Hardware (Weeks 13-18)

**Goal:** Everything works without internet. Printers and scanners work.

```
Week 13-14: Offline SQLite Setup
├── Drift database setup in Flutter
├── Mirror all critical tables locally
├── Offline order creation
├── Offline payment recording
├── Offline menu (read)
└── Sync queue implementation

Week 15-16: Sync Engine
├── Connectivity monitor
├── Background sync when online
├── Conflict resolution strategy
├── Server-side sync endpoint
├── Order number reconciliation
├── Test with airplane mode
└── Data integrity verification

Week 17-18: Hardware Integration
├── ESC/POS library setup
├── Receipt printer (USB + Network)
├── Kitchen printer (KOT)
├── Cash drawer pulse command
├── Barcode scanner (HID)
├── Printer settings UI
├── Print test/diagnostic screen
└── Auto-detect connected printers
```

**At this point:** The system works offline, prints receipts, KOTs, and scans barcodes.

---

### Phase 4 — Kitchen & Operations (Weeks 19-24)

**Goal:** Kitchen Display System, staff management, inventory.

```
Week 19-20: Kitchen Display System
├── TV-optimized layout
├── Order queue with color coding
├── Sound alerts for new orders
├── Timer per order
├── Status update buttons
├── Socket.IO real-time updates
└── KOT printing integration

Week 21-22: Staff & Shift Management
├── Staff CRUD
├── Role assignment
├── PIN-based POS login
├── Shift scheduling
├── Attendance tracking
├── Clock in/out
└── Staff performance

Week 23-24: Inventory
├── Stock items CRUD
├── Stock movement tracking
├── Low stock alerts
├── Purchase orders
├── Supplier management
├── Waste tracking
├── Auto-deduct on orders
└── Barcode lookup
```

**At this point:** Kitchen displays orders live, staff has attendance, inventory tracks stock.

---

### Phase 5 — Customer Experience (Weeks 25-30)

**Goal:** Restaurant website for customers, QR ordering, online payments.

```
Week 25-26: Restaurant Website (Next.js)
├── Per-tenant dynamic routing
├── Digital menu display
├── Menu syncs from backend in real-time
├── Responsive (mobile-first)
├── PWA support
├── Multi-language (i18n)
└── SEO optimization

Week 27-28: QR Ordering
├── QR code per table
├── Customer scans QR → opens website
├── Browse menu → add to cart → place order
├── Order goes to same backend
├── Kitchen receives instantly
├── Live order tracking
└── Payment integration

Week 29-30: Online Ordering & Delivery
├── Online order flow
├── Delivery address management
├── Order tracking page
├── WhatsApp order notifications
├── SMS notifications
└── Customer loyalty points
```

**At this point:** Customers can order via QR codes or the restaurant website.

---

### Phase 6 — Reports & Analytics (Weeks 31-34)

**Goal:** Business intelligence, financial reports.

```
Week 31-32: Reports
├── Daily sales report
├── Revenue by category
├── Revenue by item
├── Payment method breakdown
├── Peak hours analysis
├── Staff performance
├── Inventory consumption
└── Export to PDF/Excel

Week 33-34: Dashboard Analytics
├── Real-time revenue dashboard
├── Charts (fl_chart - free)
├── Comparative reports (today vs yesterday)
├── Top selling items
├── Low performing items
├── Customer retention metrics
└── Branch comparison
```

---

### Phase 7 — Marketing Website (Weeks 35-38)

**Goal:** Acquire restaurant customers.

```
Week 35-36: Marketing Website
├── Landing page
├── Features page
├── Pricing page
├── About page
├── Contact page
├── Blog setup
├── Documentation setup
├── SEO (metadata, sitemap, robots.txt)
└── Analytics (Google Analytics, Clarity)

Week 37-38: Subscription & Onboarding
├── Razorpay subscription integration
├── Plan selection flow
├── Restaurant registration wizard
├── Branch setup wizard
├── Initial menu setup
├── Welcome email
└── Onboarding checklist
```

---

### Phase 8 — Polish & Deploy (Weeks 39-44)

**Goal:** Production deployment, monitoring.

```
Week 39-40: Testing & QA
├── Unit tests for critical paths
├── Integration tests for APIs
├── Offline sync testing
├── Printer testing
├── Payment flow testing
├── Multi-device testing
└── Load testing

Week 41-42: Deployment
├── Docker images for all services
├── Railway deployment (backend)
├── Vercel deployment (websites)
├── GitHub Actions CI/CD
├── SSL certificates
├── Domain setup
├── Environment variables
├── Database backups
└── Monitoring (Better Stack free tier)

Week 43-44: Hardening
├── Security audit
├── Rate limiting
├── Input validation
├── Error handling
├── Logging
├── Performance optimization
├── Accessibility audit
├── Documentation
└── User guide
```

---

## API Endpoints (NestJS)

### Authentication

```
POST   /api/auth/register         Register restaurant owner
POST   /api/auth/login            Login
POST   /api/auth/refresh          Refresh token
POST   /api/auth/logout           Logout
POST   /api/auth/forgot-password  Send reset email
POST   /api/auth/reset-password   Reset password
```

### Tenants

```
GET    /api/tenants/:id           Get tenant details
PATCH  /api/tenants/:id           Update tenant
```

### Branches

```
GET    /api/branches              List branches
POST   /api/branches              Create branch
GET    /api/branches/:id          Get branch
PATCH  /api/branches/:id          Update branch
DELETE /api/branches/:id          Delete branch
```

### Menu

```
GET    /api/menu/categories       List categories
POST   /api/menu/categories       Create category
PATCH  /api/menu/categories/:id   Update category
DELETE /api/menu/categories/:id   Delete category

GET    /api/menu/items            List items
POST   /api/menu/items            Create item
GET    /api/menu/items/:id        Get item
PATCH  /api/menu/items/:id        Update item
DELETE /api/menu/items/:id        Delete item
PATCH  /api/menu/items/:id/availability  Toggle availability
```

### Tables

```
GET    /api/tables                List tables
POST   /api/tables                Create table
PATCH  /api/tables/:id            Update table
DELETE /api/tables/:id            Delete table
PATCH  /api/tables/:id/status     Update table status
GET    /api/tables/floor-plan     Get floor plan with live status
```

### Orders

```
GET    /api/orders                List orders (filtered)
POST   /api/orders                Create order
GET    /api/orders/:id            Get order details
PATCH  /api/orders/:id/status     Update order status
PATCH  /api/orders/:id/cancel     Cancel order
POST   /api/orders/:id/items      Add items to order
DELETE /api/orders/:id/items/:itemId  Remove item
```

### Kitchen

```
GET    /api/kitchen/orders        Get active kitchen orders
PATCH  /api/kitchen/orders/:id/ready    Mark order ready
PATCH  /api/kitchen/orders/:id/item/:itemId  Update item status
```

### Payments

```
POST   /api/payments              Create payment
GET    /api/payments              List payments
GET    /api/payments/:id          Get payment details
POST   /api/payments/refund       Refund payment
```

### Invoices

```
POST   /api/invoices/generate     Generate invoice
GET    /api/invoices/:id          Get invoice
GET    /api/invoices/:id/pdf      Download PDF
```

### Inventory

```
GET    /api/inventory             List inventory items
POST   /api/inventory             Create item
PATCH  /api/inventory/:id         Update item
POST   /api/inventory/:id/adjust  Adjust stock
GET    /api/inventory/movements   Stock movement history
```

### Suppliers

```
GET    /api/suppliers             List suppliers
POST   /api/suppliers             Create supplier
PATCH  /api/suppliers/:id         Update supplier
```

### Purchases

```
GET    /api/purchases             List purchases
POST   /api/purchases             Create purchase
PATCH  /api/purchases/:id         Update purchase
```

### Staff

```
GET    /api/staff                 List staff
POST   /api/staff                 Create staff
PATCH  /api/staff/:id             Update staff
GET    /api/staff/:id/attendance  Get attendance
POST   /api/staff/:id/clock-in    Clock in
POST   /api/staff/:id/clock-out   Clock out
```

### Reservations

```
GET    /api/reservations          List reservations
POST   /api/reservations          Create reservation
PATCH  /api/reservations/:id      Update reservation
DELETE /api/reservations/:id      Cancel reservation
```

### Reports

```
GET    /api/reports/daily-sales   Daily sales report
GET    /api/reports/revenue       Revenue breakdown
GET    /api/reports/items         Item performance
GET    /api/reports/staff         Staff performance
GET    /api/reports/inventory     Inventory report
GET    /api/reports/export/:type  Export report (PDF/Excel)
```

### Sync (Offline)

```
POST   /api/sync/push             Push offline data
GET    /api/sync/pull             Pull latest data
GET    /api/sync/status           Check sync status
```

### WebSocket Events

```
order:created          New order (kitchen, dashboard)
order:status-changed   Order status update
order:ready            Food ready notification
table:status-changed   Table status update
menu:updated           Menu item changed
inventory:low          Low stock alert
payment:received       Payment notification
staff:clocked-in       Staff attendance event
```

---

## Docker Compose (Development)

```yaml
version: '3.8'

services:
  postgres:
    image: postgres:16-alpine
    environment:
      POSTGRES_DB: nexaros
      POSTGRES_USER: nexaros
      POSTGRES_PASSWORD: nexaros_dev
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data

  backend:
    build:
      context: .
      dockerfile: docker/Dockerfile.backend
    ports:
      - "4000:4000"
    environment:
      DATABASE_URL: postgresql://nexaros:nexaros_dev@postgres:5432/nexaros
      REDIS_URL: redis://redis:6379
      JWT_SECRET: your-secret-key
    depends_on:
      - postgres
      - redis
    volumes:
      - ./apps/backend:/app
      - /app/node_modules

  adminer:
    image: adminer
    ports:
      - "8080:8080"

volumes:
  postgres_data:
  redis_data:
```

---

## Real-Time Data Flow Examples

### Example 1: Waiter creates order

```
1. Waiter selects Table 5 in Flutter app
2. Adds: 2x Butter Chicken, 1x Naan, 1x Lassi
3. App saves to LOCAL SQLite (0ms delay)
4. App prints KOT to kitchen printer (ESC/POS)
5. App adds order to SYNC QUEUE
6. IF internet available:
   a. POST /api/orders → NestJS
   b. NestJS saves to PostgreSQL
   c. Socket.IO emits "order:created"
   d. Kitchen TV shows new order
   e. Owner dashboard updates
   f. Customer website shows order tracking
   g. Sync queue marks as synced
7. IF internet NOT available:
   a. Order stays in local SQLite
   b. KOT still prints (local data)
   c. Order is in sync queue
   d. When internet returns → sync happens automatically
   e. Order gets proper server ID
```

### Example 2: Menu update from owner

```
1. Owner updates Butter Chicken price: ₹350 → ₹380 in Flutter app
2. App saves to local SQLite
3. App sends PATCH /api/menu/items/:id to server
4. Server updates PostgreSQL
5. Socket.IO emits "menu:updated"
6. Customer website receives event
7. Price updates instantly (no page reload)
8. QR menu shows new price
9. POS shows new price
10. Kitchen display shows new price
```

---

## Offline Conflict Resolution

When the same data is modified offline on multiple devices:

```
Strategy: Last-Write-Wins with Server Timestamp

1. Each local record has a `localVersion` and `serverVersion`
2. When syncing:
   a. Send local changes with `localVersion`
   b. Server checks if `serverVersion` changed since last sync
   c. If no conflict → apply change
   d. If conflict → server version wins, client gets notification
3. For orders: Never conflict (each device creates different orders)
4. For menu: Server wins (owner controls menu)
5. For table status: Latest timestamp wins
```

---

## Printer Setup in Linux

### CUPS Configuration

```bash
# Install CUPS
sudo apt install cups

# Add printer via CUPS web interface
# http://localhost:631

# Or command line:
lpadmin -p ReceiptPrinter -E -v socket://192.168.1.100:9100 -m raw
lpadmin -p KitchenPrinter -E -v socket://192.168.1.101:9100 -m raw
```

### Flutter ESC/POS Printing

```dart
// Direct network printing (most common in restaurants)
import 'package:esc_pos_printer/esc_pos_printer.dart';

Future<void> printReceipt(Order order) async {
  final printer = NetworkPrinter(
    '192.168.1.100',
    Port_9100,
  );
  
  final PosPrintResult result = await printer.connect();
  if (result == PosPrintResult.success) {
    printer.text('NexaROS Restaurant');
    printer.text('Order #${order.orderNumber}');
    printer.text('-------------------');
    for (var item in order.items) {
      printer.text('${item.quantity}x ${item.name}  ₹${item.totalPrice}');
    }
    printer.text('-------------------');
    printer.text('Total: ₹${order.totalAmount}');
    printer.cut();
    printer.disconnect();
  }
}
```

---

## Multi-Language Setup (i18n)

```dart
// lib/core/i18n/app_localizations.dart

class AppLocalizations {
  static const supportedLocales = [
    Locale('en', 'IN'),
    Locale('hi', 'IN'),
    Locale('kn', 'IN'),
    Locale('te', 'IN'),
    Locale('ta', 'IN'),
    Locale('ml', 'IN'),
  ];
  
  static const strings = {
    'en': {
      'dashboard': 'Dashboard',
      'orders': 'Orders',
      'menu': 'Menu',
      'inventory': 'Inventory',
      'settings': 'Settings',
      'total_revenue': 'Total Revenue',
      'today_orders': "Today's Orders",
      'active_tables': 'Active Tables',
      'pending_orders': 'Pending Orders',
    },
    'hi': {
      'dashboard': 'डैशबोर्ड',
      'orders': 'ऑर्डर',
      'menu': 'मेनू',
      'inventory': 'इन्वेंटरी',
      'settings': 'सेटिंग्स',
      'total_revenue': 'कुल राजस्व',
      'today_orders': 'आज के ऑर्डर',
      'active_tables': 'सक्रिय टेबल',
      'pending_orders': 'लंबित ऑर्डर',
    },
  };
}
```

---

## Responsive Architecture (Flutter)

### Breakpoints

```dart
class AppBreakpoints {
  static const mobile = 600;
  static const tablet = 1024;
  static const desktop = 1440;
  static const largeDesktop = 1920;
  static const tv = 2560;
}
```

### Device Detection

```dart
enum DeviceType {
  mobile,
  tablet,
  desktop,
  largeDesktop,
  tv,
}

DeviceType getDevice(double width) {
  if (width < 600) return DeviceType.mobile;
  if (width < 1024) return DeviceType.tablet;
  if (width < 1440) return DeviceType.desktop;
  if (width < 1920) return DeviceType.largeDesktop;
  return DeviceType.tv;
}
```

### Responsive Layout Widget

```dart
ResponsiveLayout(
  mobile: DashboardMobile(),
  tablet: DashboardTablet(),
  desktop: DashboardDesktop(),
  largeDesktop: DashboardLarge(),
  tv: DashboardTV(),
)
```

### Feature Availability by Device

| Feature | Mobile | Tablet | Desktop | TV |
|---|---|---|---|---|
| Dashboard | Yes | Yes | Yes | Limited |
| POS | No | Yes | Yes | No |
| Reports | No | Limited | Yes | No |
| Kitchen Display | No | No | No | Yes |
| Inventory | Limited | Yes | Yes | No |
| Finance | No | No | Yes | No |
| AI Assistant | Yes | Yes | Yes | Yes |

---

## Cost Summary (Monthly)

| Service | Cost |
|---|---|
| GitHub | Free |
| Railway (backend) | Free tier |
| Railway (PostgreSQL) | Free tier |
| Railway (Redis) | Free tier |
| Cloudflare R2 (storage) | Free (10GB) |
| Resend (email) | Free (100/day) |
| Razorpay | Free setup, 2% per transaction |
| Vercel (websites) | Free tier |
| Domain (.in) | ~₹100/year |
| **Total** | **~₹8/month** |

---

## What You Can Build Today (Day 1)

```bash
# Step 1: Install prerequisites
# Docker, Flutter SDK, Node.js, pnpm, Git

# Step 2: Create monorepo
mkdir nexaros && cd nexaros
git init
pnpm init

# Step 3: Start database
docker compose up -d postgres redis

# Step 4: Create NestJS backend
pnpm create @nestjs/backend apps/backend

# Step 5: Initialize Prisma
cd apps/backend
npx prisma init

# Step 6: Start Flutter app
cd ../..
flutter create apps/flutter-app

# Step 7: First commit
git add .
git commit -m "Initial project structure"
git remote add origin https://github.com/yourusername/nexaros.git
git push -u origin main
```

---

*Document version: 1.0*  
*Last updated: July 2026*  
*Project: NexaROS — AI-Powered Restaurant Operating System*
