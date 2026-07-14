# NexaROS Documentation Index

## Enterprise SaaS Restaurant Operating System

> **Version**: 0.1.0 | **Last Updated**: July 2026 | **Status**: MVP Complete

---

## Quick Navigation

| Section | Document | Description |
|---------|----------|-------------|
| **Platform** | [01_PROJECT_OVERVIEW](platform/01_PROJECT_OVERVIEW.md) | What NexaROS is |
| | [02_PRODUCT_VISION](platform/02_PRODUCT_VISION.md) | Product direction |
| | [03_BUSINESS_MODEL](platform/03_BUSINESS_MODEL.md) | Revenue model |
| | [04_BUSINESS_REQUIREMENTS](platform/04_BUSINESS_REQUIREMENTS.md) | Requirements |
| | [05_SYSTEM_ARCHITECTURE](platform/05_SYSTEM_ARCHITECTURE.md) | Architecture |
| | [06_TECH_STACK](platform/06_TECH_STACK.md) | Technologies |
| | [07_FOLDER_STRUCTURE](platform/07_FOLDER_STRUCTURE.md) | Repo layout |
| | [08_MODULES](platform/08_MODULES.md) | All modules |
| | [09_FEATURES](platform/09_FEATURES.md) | Feature matrix |
| **Screens** | [10_SCREEN_INVENTORY](platform/10_SCREEN_INVENTORY.md) | Every screen |
| | [11_SCREEN_FLOW](platform/11_SCREEN_FLOW.md) | Screen navigation |
| **Flows** | [12_USER_FLOW](platform/12_USER_FLOW.md) | User journeys |
| | [13_BUSINESS_FLOW](platform/13_BUSINESS_FLOW.md) | Business logic |
| | [14_E2E_FLOW](platform/14_E2E_FLOW.md) | End-to-end |
| **UI/UX** | [15_UI_UX_GUIDELINES](platform/15_UI_UX_GUIDELINES.md) | Design guidelines |
| | [16_DESIGN_SYSTEM](platform/16_DESIGN_SYSTEM.md) | Design system |
| | [17_COMPONENT_LIBRARY](platform/17_COMPONENT_LIBRARY.md) | Components |
| | [18_THEME_SYSTEM](platform/18_THEME_SYSTEM.md) | Themes |
| **State & Nav** | [19_NAVIGATION](platform/19_NAVIGATION.md) | Navigation |
| | [20_STATE_MANAGEMENT](platform/20_STATE_MANAGEMENT.md) | State |
| **Backend** | [21_API_DOCUMENTATION](platform/21_API_DOCUMENTATION.md) | API reference |
| | [22_DATABASE](platform/22_DATABASE.md) | Database |
| **Security** | [23_AUTHENTICATION](platform/23_AUTHENTICATION.md) | Auth |
| | [24_AUTHORIZATION](platform/24_AUTHORIZATION.md) | Authz |
| | [25_PERMISSION_MATRIX](platform/25_PERMISSION_MATRIX.md) | Permissions |
| **Realtime** | [26_REALTIME_SYSTEM](platform/26_REALTIME_SYSTEM.md) | Socket.IO |
| | [27_NOTIFICATION_SYSTEM](platform/27_NOTIFICATION_SYSTEM.md) | Notifications |
| **Analytics** | [28_ANALYTICS](platform/28_ANALYTICS.md) | Analytics |
| | [29_REPORTING](platform/29_REPORTING.md) | Reports |
| **Performance** | [30_PERFORMANCE](platform/30_PERFORMANCE.md) | Performance |
| **Security** | [31_SECURITY](platform/31_SECURITY.md) | Security |
| | [32_ACCESSIBILITY](platform/32_ACCESSIBILITY.md) | A11y |
| | [33_SEO](platform/33_SEO.md) | SEO |
| **i18n** | [34_LOCALIZATION](platform/34_LOCALIZATION.md) | Localization |
| **Config** | [35_CONFIGURATION](platform/35_CONFIGURATION.md) | Configuration |
| | [36_ENVIRONMENT](platform/36_ENVIRONMENT.md) | Environment |
| **Deploy** | [37_DEPLOYMENT](platform/37_DEPLOYMENT.md) | Deployment |
| | [38_DOCKER](platform/38_DOCKER.md) | Docker |
| | [39_MONITORING](platform/39_MONITORING.md) | Monitoring |
| | [40_LOGGING](platform/40_LOGGING.md) | Logging |
| **Quality** | [41_ERROR_HANDLING](platform/41_ERROR_HANDLING.md) | Error handling |
| | [42_VALIDATIONS](platform/42_VALIDATIONS.md) | Validations |
| | [43_FORMS](platform/43_FORMS.md) | Forms |
| **Storage** | [44_FILE_STORAGE](platform/44_FILE_STORAGE.md) | File storage |
| | [45_MEDIA_MANAGEMENT](platform/45_MEDIA_MANAGEMENT.md) | Media |
| | [46_CACHING](platform/46_CACHING.md) | Caching |
| | [47_OFFLINE_SUPPORT](platform/47_OFFLINE_SUPPORT.md) | Offline |
| **Testing** | [48_TESTING](platform/48_TESTING.md) | Testing |
| | [49_QA_CHECKLIST](platform/49_QA_CHECKLIST.md) | QA checklist |
| **Release** | [50_RELEASE_PROCESS](platform/50_RELEASE_PROCESS.md) | Release |
| | [51_BACKUP](platform/51_BACKUP.md) | Backup |
| | [52_RECOVERY](platform/52_RECOVERY.md) | Recovery |
| **Ops** | [53_TROUBLESHOOTING](platform/53_TROUBLESHOOTING.md) | Troubleshooting |
| | [54_KNOWN_LIMITATIONS](platform/54_KNOWN_LIMITATIONS.md) | Limitations |
| | [55_TECHNICAL_DEBT](platform/55_TECHNICAL_DEBT.md) | Tech debt |
| **Future** | [56_ROADMAP](platform/56_ROADMAP.md) | Roadmap |
| | [57_FUTURE_IMPROVEMENTS](platform/57_FUTURE_IMPROVEMENTS.md) | Improvements |
| | [58_CHANGELOG](platform/58_CHANGELOG.md) | Changelog |
| | [59_GLOSSARY](platform/59_GLOSSARY.md) | Glossary |

---

## Application Documentation

| App | Directory | Description |
|-----|-----------|-------------|
| Marketing Web | [apps/marketing/](apps/marketing/) | nexaros.com — Public website |
| Customer Web | [apps/customer-web/](apps/customer-web/) | Per-restaurant public pages |
| Flutter App | [apps/restaurant-app/](apps/restaurant-app/) | Restaurant operations (POS, Kitchen, etc.) |
| Backend API | [apps/backend/](apps/backend/) | NestJS API server |
| Super Admin | [apps/super-admin/](apps/super-admin/) | admin.nexaros.com — Private admin portal |

---

## Audit Reports

| Report | Status |
|--------|--------|
| [UI/UX Audit](audits/ui-ux-audit.md) | Generated |
| [Performance Audit](audits/performance-audit.md) | Generated |
| [Security Audit](audits/security-audit.md) | Generated |
| [Architecture Audit](audits/architecture-audit.md) | Generated |
| [Database Audit](audits/database-audit.md) | Generated |
| [API Audit](audits/api-audit.md) | Generated |
| [Codebase Audit](audits/codebase-audit.md) | Generated |
| [Production Readiness](audits/production-readiness.md) | Generated |

---

## Platform Statistics

| Metric | Value |
|--------|-------|
| Flutter Screens | 26 |
| Flutter Widgets | 7 |
| Flutter Providers | 5 |
| Flutter Shells | 4 (Mobile, Tablet, Desktop, TV) |
| Flutter Dart Files | 66 |
| Backend Modules | 33 |
| Backend Controllers | 32 |
| Backend Services | 33 |
| Backend Test Specs | 25 |
| Backend Tests | 302 |
| Prisma Models | 49 |
| Prisma Enums | 8 |
| Prisma Schema Lines | 1,111 |
| Marketing Pages | 24 routes |
| Admin Portal Pages | 12 routes |
| Customer Web Pages | 4 routes |
| API Endpoints | 107 |
| Module Keys | 21 |
| Role Permissions | 56 |
| Documentation Files | 115 |
