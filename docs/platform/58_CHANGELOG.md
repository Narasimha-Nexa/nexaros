# Changelog

## [0.1.0] - 2026-07-14

### Added

#### Backend

- 33 modules (Auth, Tenants, Branches, Users, Roles, Menu, Orders, Tables, Kitchen, Payments, Invoices, Inventory, Suppliers, Purchases, Staff, Reservations, Reports, AI, Billing, Plans, Entitlements, Coupons, Subscriptions, WebSockets, Sync, Printer, Notifications, Public, Admin, Support, Demo Requests, Platform)
- 32 controllers
- 33 services
- 25 test suites (302 tests)
- JWT authentication
- RBAC authorization
- Rate limiting
- CSRF protection
- Socket.IO real-time
- ESC/POS printing
- Offline sync

#### Flutter App

- 26 screens
- 11 widgets
- 3 providers (AppState, SubscriptionProvider, BranchProvider)
- 3 shells (Mobile, Tablet, Desktop)
- Branch switching
- Entitlement-based UI
- Grace period banner
- Feature locked overlay
- Subscription management
- Coupon redemption

#### Marketing Website

- 24 routes
- Landing page (12 sections)
- Registration (10 business types, Indian states)
- Login
- Pricing
- Blog
- Docs
- Contact
- Demo request
- Custom UI components

#### Admin Portal

- 12 routes
- Dashboard
- Tenant management
- Subscription management
- Plan management
- Coupon management
- Staff management
- Reports
- Settings

#### Customer Web

- 4 routes
- Restaurant page
- Menu browsing
- Order placement
- Order tracking

#### Infrastructure

- Docker Compose setup
- 4 Dockerfiles
- CI/CD pipeline (GitHub Actions)
- Health checks
- Rate limiting middleware
- Login rate limiting
- Public rate limiting

#### Documentation

- 60+ platform docs
- 5 per-app docs
- API documentation
- Database schema
- Deployment guide
- Security guide

### Changed

- Upgraded Jest from 30 to 29 for ts-jest compatibility
- Added helmet for security headers
- Added admin login to rate limiting
- Added branch switcher to all shells
- Added branch management screen
- Added staff-branch assignment screen

### Fixed

- Fixed public.service.spec.ts test
- Fixed billing.spec.ts test
- Fixed admin.service.spec.ts test (mocked otplib)
- Fixed jest configuration for ESM modules

## [0.0.1] - 2026-06-01

### Added

- Initial project setup
- Basic backend structure
- Basic Flutter structure
- Basic marketing website
