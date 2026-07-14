# Screen Inventory

## Complete Screen Inventory Across All Apps

### Flutter App — Restaurant Operations (26 Screens)

| # | Screen | File | Purpose |
|---|--------|------|---------|
| 1 | Login | `features/auth/presentation/login_screen.dart` | Email + password authentication |
| 2 | Dashboard | `features/dashboard/presentation/dashboard_screen.dart` | Today's summary, stats, quick actions |
| 3 | POS | `features/pos/presentation/pos_screen.dart` | Point of sale terminal |
| 4 | Order List | `features/orders/presentation/order_list_screen.dart` | All orders with filters |
| 5 | Menu Management | `features/menu/presentation/menu_management_screen.dart` | Categories + items list |
| 6 | Menu Item Form | `features/menu/presentation/menu_item_form_screen.dart` | Create/edit menu item |
| 7 | Table Grid | `features/tables/presentation/table_grid_screen.dart` | Floor plan / table grid |
| 8 | Kitchen Display | `features/kitchen/presentation/kitchen_display_screen.dart` | KDS with active orders |
| 9 | Staff Management | `features/staff/presentation/staff_management_screen.dart` | Staff CRUD + performance |
| 10 | Attendance | `features/staff/presentation/attendance_screen.dart` | Clock in/out + attendance list |
| 11 | Shift Schedule | `features/staff/presentation/shift_schedule_screen.dart` | Shift planning |
| 12 | Inventory | `features/inventory/presentation/inventory_management_screen.dart` | Stock tracking |
| 13 | Suppliers | `features/inventory/presentation/supplier_management_screen.dart` | Supplier management |
| 14 | Purchases | `features/inventory/presentation/purchase_order_screen.dart` | Purchase orders |
| 15 | Waste Tracking | `features/inventory/presentation/waste_tracking_screen.dart` | Waste logging |
| 16 | Reservations | `features/reservations/presentation/reservation_screen.dart` | Table booking |
| 17 | Reports | `features/reports/presentation/reports_screen.dart` | Analytics dashboard |
| 18 | Bill Preview | `features/payments/presentation/bill_preview_screen.dart` | Pre-payment bill view |
| 19 | Payment | `features/payments/presentation/payment_screen.dart` | Payment processing |
| 20 | Subscription | `features/subscriptions/presentation/subscription_screen.dart` | Plan management |
| 21 | Coupon Redemption | `features/subscriptions/presentation/coupon_redemption_screen.dart` | Coupon apply flow |
| 22 | Branch Management | `features/branches/presentation/branch_management_screen.dart` | Branch CRUD |
| 23 | Staff-Branch Assignment | `features/branches/presentation/staff_branch_assignment_screen.dart` | Staff-to-branch |
| 24 | Printer Settings | `features/settings/presentation/printer_settings_screen.dart` | Printer configuration |
| 25 | Printer Diagnostic | `features/settings/presentation/printer_diagnostic_screen.dart` | Printer test |
| 26 | More Grid | `features/more/presentation/more_grid_screen.dart` | Feature grid (Kitchen, Staff, etc.) |

### Shell Layouts (3 Shells)

| Shell | File | Target |
|-------|------|--------|
| Mobile | `app/shells/mobile_shell.dart` | Phone (< 600px) |
| Tablet | `app/shells/tablet_shell.dart` | Tablet (600-900px) |
| Desktop | `app/shells/desktop_shell.dart` | Desktop (> 900px) |

### Reusable Widgets (11)

| Widget | File | Purpose |
|--------|------|---------|
| BranchSwitcher | `core/widgets/branch_switcher.dart` | Branch dropdown selector |
| ConnectivityBanner | `core/widgets/connectivity_banner.dart` | Online/offline banner |
| SubscriptionStatusBar | `core/widgets/subscription_status_bar.dart` | Subscription info bar |
| GracePeriodBanner | `core/widgets/grace_period_banner.dart` | Grace period warning |
| FeatureLockedOverlay | `core/widgets/feature_locked_overlay.dart` | Locked feature overlay |
| SyncStatusBar | `core/widgets/sync_status_bar.dart` | Sync progress indicator |
| + 5 shared UI components | `components/ui.tsx` (marketing) | Button, Card, Badge, etc. |

### Providers (3)

| Provider | File | Purpose |
|----------|------|---------|
| AppState | `core/providers/app_state.dart` | Global state, connectivity, socket |
| SubscriptionProvider | `core/providers/subscription_provider.dart` | Entitlements, feature flags |
| BranchProvider | `core/providers/branch_provider.dart` | Branch list, selection, CRUD |

---

### Marketing Web — 24 Routes

| # | Route | File | Purpose |
|---|-------|------|---------|
| 1 | `/` | `app/page.tsx` | Landing page (12 sections) |
| 2 | `/features` | `app/features/page.tsx` | Feature showcase |
| 3 | `/pricing` | `app/pricing/page.tsx` | Pricing plans |
| 4 | `/custom-plan` | `app/custom-plan/page.tsx` | Custom plan request |
| 5 | `/about` | `app/about/page.tsx` | About NexaROS |
| 6 | `/contact` | `app/contact/page.tsx` | Contact form |
| 7 | `/blog` | `app/blog/page.tsx` | Blog listing |
| 8 | `/blog/[slug]` | `app/blog/[slug]/page.tsx` | Blog article |
| 9 | `/docs` | `app/docs/page.tsx` | Documentation hub |
| 10 | `/docs/[slug]` | `app/docs/[slug]/page.tsx` | Doc article |
| 11 | `/faq` | `app/faq/page.tsx` | FAQ accordion |
| 12 | `/careers` | `app/careers/page.tsx` | Job listings |
| 13 | `/partners` | `app/partners/page.tsx` | Partner program |
| 14 | `/login` | `app/login/page.tsx` | Restaurant login |
| 15 | `/register` | `app/register/page.tsx` | Restaurant registration |
| 16 | `/signup` | `app/signup/page.tsx` | Alias for register |
| 17 | `/checkout` | `app/checkout/page.tsx` | Subscription checkout |
| 18 | `/checkout/success` | `app/checkout/success/page.tsx` | Checkout confirmation |
| 19 | `/privacy` | `app/privacy/page.tsx` | Privacy policy |
| 20 | `/terms` | `app/terms/page.tsx` | Terms of service |
| 21 | `/refund` | `app/refund/page.tsx` | Refund policy |
| 22 | `/security` | `app/security/page.tsx` | Security page |
| 23 | `/status` | `app/status/page.tsx` | System status |
| 24 | `/changelog` | `app/changelog/page.tsx` | Product changelog |

### Admin Portal — 12 Routes

| # | Route | File | Purpose |
|---|-------|------|---------|
| 1 | `/login` | `app/login/page.tsx` | Admin login |
| 2 | `/` | `app/(dashboard)/page.tsx` | Dashboard overview |
| 3 | `/restaurants` | `app/(dashboard)/restaurants/page.tsx` | Tenant management |
| 4 | `/subscriptions` | `app/(dashboard)/subscriptions/page.tsx` | Subscription management |
| 5 | `/billing` | `app/(dashboard)/billing/page.tsx` | Billing overview |
| 6 | `/coupons` | `app/(dashboard)/coupons/page.tsx` | Coupon management |
| 7 | `/demo-requests` | `app/(dashboard)/demo-requests/page.tsx` | Demo pipeline |
| 8 | `/support` | `app/(dashboard)/support/page.tsx` | Support tickets |
| 9 | `/admin-users` | `app/(dashboard)/admin-users/page.tsx` | Admin user management |
| 10 | `/audit-logs` | `app/(dashboard)/audit-logs/page.tsx` | Audit trail |
| 11 | `/payment-promises` | `app/(dashboard)/payment-promises/page.tsx` | Payment promises |
| 12 | `/settings` | `app/(dashboard)/settings/page.tsx` | Platform settings |

### Customer Web — 4 Routes

| # | Route | File | Purpose |
|---|-------|------|---------|
| 1 | `/` | `app/page.tsx` | Customer home / redirect |
| 2 | `/restaurant/[slug]` | `app/restaurant/[slug]/page.tsx` | Restaurant public page |
| 3 | `/restaurant/[slug]/order/[orderId]` | `app/restaurant/[slug]/order/[orderId]/page.tsx` | Order tracking |
| 4 | `/restaurant/[slug]/table/[tableId]` | `app/restaurant/[slug]/table/[tableId]/page.tsx` | QR table page |

---

## Related Documents

- [Screen Flow](11_SCREEN_FLOW.md)
- [User Flow](12_USER_FLOW.md)
- [Navigation](19_NAVIGATION.md)
- [Component Library](17_COMPONENT_LIBRARY.md)
