# NexaROS CMS Architecture — Flutter Owner App → Customer Website

## Architecture Overview

```
┌─────────────────────────────────────────────────────┐
│              Flutter Owner App (CMS)                 │
│  ┌──────────┐ ┌──────────┐ ┌───────────────────┐   │
│  │ Dashboard │ │ Website  │ │ Preview & Publish │   │
│  │   (Home)  │ │ Manager  │ │   (Live Preview)  │   │
│  └──────────┘ └──────────┘ └───────────────────┘   │
└──────────────────────┬──────────────────────────────┘
                       │ HTTP / WebSocket
                       ▼
┌─────────────────────────────────────────────────────┐
│              NexaROS Backend API                      │
│  ┌──────────┐ ┌──────────┐ ┌───────────────────┐   │
│  │ REST API │ │ Socket.IO│ │  Database (Prisma) │   │
│  │ (CRUD)   │ │ (Realtime)│ │  (PostgreSQL)     │   │
│  └──────────┘ └──────────┘ └───────────────────┘   │
└──────────────────────┬──────────────────────────────┘
                       │ JSON API
                       ▼
┌─────────────────────────────────────────────────────┐
│       Customer Website (Next.js 15 SSR)              │
│  ┌──────────┐ ┌──────────┐ ┌───────────────────┐   │
│  │  Public  │ │  SSR     │ │  Realtime Updates │   │
│  │  Pages   │ │  Stream  │ │  (Socket.IO)      │   │
│  └──────────┘ └──────────┘ └───────────────────┘   │
└─────────────────────────────────────────────────────┘
```

## Data Model — Tenant Configuration Schema

```prisma
model TenantConfig {
  id            String   @id @default(cuid())
  tenantId      String   @unique
  
  // ── Global Settings ──
  restaurantName      String
  tagline             String?
  logo                String?
  favicon             String?
  phone               String?
  email               String?
  address             String?
  mapUrl              String?
  whatsappNumber      String?
  currency            String   @default("INR")
  timezone            String   @default("Asia/Kolkata")
  
  // ── Branding ──
  primaryColor        String   @default("#2563eb")
  secondaryColor      String   @default("#171717")
  accentColor         String   @default("#f59e0b")
  fontHeading         String   @default("Playfair Display")
  fontBody            String   @default("Inter")
  borderRadius        String   @default("xl")
  containerWidth      String   @default("max-w-7xl")
  
  // ── Features (Toggle Flags) ──
  features            Json     @default("{}")
  // Features JSON structure:
  // {
  //   "announcementBar": { "enabled": true, "text": "...", "bgColor": "...", "textColor": "..." },
  //   "heroSlider": { "enabled": true, "slides": [...] },
  //   "featuredCategories": { "enabled": true, "title": "...", "subtitle": "..." },
  //   "search": { "enabled": true, "voiceSearch": false },
  //   "cart": { "enabled": true, "minOrder": 0, "deliveryCharge": 40 },
  //   "reservations": { "enabled": true, "depositRequired": false, "maxGuests": 20 },
  //   "loyalty": { "enabled": true, "pointsPerRupee": 1, "redeemRate": 100 },
  //   "whatsapp": { "enabled": true, "buttonText": "Chat with us" },
  //   "newsletter": { "enabled": true },
  //   "reviews": { "enabled": true, "autoApprove": false },
  //   "blog": { "enabled": false },
  //   "events": { "enabled": false },
  //   "gallery": { "enabled": true, "categories": ["interior","food","events"] }
  // }
  
  // ── SEO ──
  seo                 Json     @default("{}")
  // SEO JSON:
  // { "defaultTitle": "", "description": "", "keywords": "", "ogImage": "" }
  
  // ── Opening Hours ──
  openingHours        Json     @default("{}")
  // { "monday": { "open": "10:00", "close": "23:00", "closed": false }, ... }
  
  // ── Social Links ──
  socialLinks         Json     @default("{}")
  // { "instagram": "", "facebook": "", "twitter": "", "youtube": "" }
  
  // ── Analytics ──
  analytics           Json     @default("{}")
  // { "googleAnalyticsId": "", "metaPixelId": "", "gtmId": "" }
  
  // ── Legal ──
  legalPages          Json     @default("{}")
  // { "privacyPolicy": "", "termsOfService": "", "refundPolicy": "", ... }
  
  // ── Timestamps ──
  createdAt           DateTime @default(now())
  updatedAt           DateTime @updatedAt
}
```

## Flutter Owner App — Screen Architecture

```
Owner App
├── 🏠 Dashboard
│   ├── Quick Stats (orders today, revenue, active tables)
│   ├── Recent Activity
│   ├── Quick Actions (Edit Menu, View Orders, Website Preview)
│   └── Publish Status (Draft/Published/Live)
│
├── 🌐 Website Manager (Main CMS)
│   ├── ⚙️ Global Settings
│   │   ├── Business Info (name, address, phone, email, WhatsApp)
│   │   ├── Branding (logo, favicon, colors, fonts)
│   │   ├── Opening Hours (per day, closed toggle)
│   │   ├── Social Links
│   │   ├── Currency / Timezone
│   │   ├── Tax & Delivery Settings
│   │   └── Languages
│   │
│   ├── 🎨 Theme & Appearance
│   │   ├── Color Picker (primary, secondary, accent, background, text)
│   │   ├── Font Selector (heading, body with preview)
│   │   ├── Corner Radius Slider
│   │   ├── Container Width Selector
│   │   ├── Dark Mode Toggle
│   │   └── Layout Style (header, footer, sticky nav)
│   │
│   ├── 🏠 Home Page Builder (Drag & Drop)
│   │   ├── Section List (reorderable)
│   │   ├── Add Section Button → Widget Library
│   │   └── Per-section settings:
│   │       ├── Enable/Disable Toggle
│   │       ├── Title / Subtitle
│   │       ├── Background Color/Image
│   │       ├── Padding (top/bottom sliders)
│   │       ├── Animation Style
│   │       ├── Visibility Rules (show on: all/mobile/desktop)
│   │       └── Schedule (start/end date/time)
│   │
│   ├── 📋 Menu Manager
│   │   ├── Categories (Add/Edit/Delete/Reorder)
│   │   │   ├── Name, Description, Image, Icon
│   │   │   └── Visibility Toggle
│   │   ├── Menu Items (Add/Edit/Delete)
│   │   │   ├── Name, Description, Price, Images
│   │   │   ├── Dietary Tags (Veg/NonVeg/Vegan/Jain/GlutenFree)
│   │   │   ├── Availability Toggle
│   │   │   ├── Variants (Size, Price)
│   │   │   ├── Add-ons (Name, Price)
│   │   │   ├── Nutrition Info
│   │   │   ├── Preparation Time
│   │   │   ├── Badges (BestSeller, New, Spicy, ChefRec)
│   │   │   └── Related Items / Cross-sell
│   │   └── Bulk Import (CSV/Excel)
│   │
│   ├── 📸 Gallery Manager
│   │   ├── Albums (Create/Edit/Delete)
│   │   ├── Upload Images (Multi-select, Crop, Compress)
│   │   ├── Categories (Interior, Food, Events, Kitchen, Exterior)
│   │   ├── Image Details (Title, Alt Text, Description)
│   │   ├── Reorder & Sort
│   │   └── Videos (Upload or Embed URL)
│   │
│   ├── 🏷️ Offers & Promotions
│   │   ├── Coupons (Code, Discount %, Flat, Min Order, Expiry)
│   │   ├── Combo Deals (Items, Price, Image)
│   │   ├── Flash Sales (Time-bound, Countdown)
│   │   ├── Festival Offers
│   │   └── Schedule (Start/End)
│   │
│   ├── 📅 Reservations
│   │   ├── Enable/Disable
│   │   ├── Available Time Slots
│   │   ├── Max Guests Per Booking
│   │   ├── Deposit Settings
│   │   ├── Table Types (Indoor, Outdoor, Private)
│   │   └── Confirmation Message Template
│   │
│   ├── 📝 Blog Editor
│   │   ├── Rich Text Editor (Bold, Italic, Headers, Lists, Images)
│   │   ├── Categories & Tags
│   │   ├── Featured Image
│   │   ├── SEO Fields (Title, Description, Slug)
│   │   └── Draft / Publish / Schedule
│   │
│   ├── 🎪 Events Manager
│   │   ├── Title, Description, Date/Time
│   │   ├── Banner Image
│   │   ├── Capacity & Price
│   │   ├── Registration Link
│   │   └── Featured Toggle
│   │
│   ├── 📞 Contact & FAQ
│   │   ├── Contact Info (Phone, Email, Address, Map)
│   │   ├── Contact Form Builder (Fields, Required, Validation)
│   │   ├── FAQ Builder (Question/Answer, Categories, Order)
│   │   └── Departments
│   │
│   ├── 🌍 SEO Manager
│   │   ├── Page Title Template
│   │   ├── Meta Description
│   │   ├── Keywords
│   │   ├── Open Graph Settings (Title, Description, Image)
│   │   ├── Twitter Card Settings
│   │   ├── Schema.org Settings
│   │   ├── Sitemap Settings
│   │   ├── Robots.txt
│   │   ├── 404 Page Content
│   │   └── URL Redirects
│   │
│   ├── 👥 Team Members
│   │   ├── Add/Edit/Delete
│   │   ├── Name, Role, Bio, Photo
│   │   └── Social Links
│   │
│   └── ⭐ Reviews Management
│       ├── Pending Approval
│       ├── Approve / Reject / Reply
│       ├── Highlight / Pin to Top
│       └── Hide / Report
│
├── 📊 Analytics
│   ├── Google Analytics Setup
│   ├── Meta Pixel Setup
│   ├── Dashboard (Visitors, Page Views, Orders)
│   └── Custom Scripts
│
├── 👤 Customers
│   ├── List / Search / Filter
│   ├── Order History
│   └── Loyalty Points Management
│
├── 📦 Orders
│   ├── Real-time Order Feed (Socket.IO)
│   ├── Status Management (Confirm, Prepare, Ready, Deliver)
│   └── Order History
│
└── ⚙️ Settings
    ├── Profile
    ├── Notification Preferences
    ├── Backup & Restore
    ├── Export Data
    └── Account
```

## Widget Library (Draggable Page Sections)

| Widget | Configurable Fields |
|--------|-------------------|
| **Hero** | Slides, Title, Subtitle, Buttons, Background Image/Video, Overlay Color, Animation |
| **Stats Bar** | Enable/Disable, Numbers (4 stats), Icons, Colors |
| **Featured Categories** | Heading, Subtitle, Categories (select from menu), Grid Columns |
| **Food Grid** | Heading, Items (select from menu), Layout (grid/list), Filters |
| **Today's Special** | Heading, Items, Badge Text, Background Color |
| **Chef Recommends** | Heading, Items (select from menu) |
| **Best Sellers** | Heading, Items (auto from best-seller tagged items) |
| **Why Choose Us** | Heading, Features (icon, title, description) — Add/Remove/Reorder |
| **Testimonials** | Heading, Reviews (select from approved reviews) |
| **Awards** | Heading, Awards (icon, title, year, org) |
| **Gallery Preview** | Heading, Images (select from gallery) |
| **Reservation CTA** | Heading, Subtitle, Button Text, Background Image |
| **Countdown Timer** | Title, End Date/Time, Background Color |
| **Combo Offers** | Heading, Combos (select from offers) |
| **Newsletter** | Heading, Subtitle, Button Text, Background Color |
| **Partners** | Heading, Partner Logos (upload images) |
| **Delivery Partners** | Heading, Partner Logos (Zomato, Swiggy, Uber) |
| **App Download** | Heading, App Store / Play Store Links, QR Code |
| **Map** | Address, Google Maps Embed URL |
| **FAQ** | Heading, FAQ Categories (select from FAQ manager) |
| **Contact Form** | Heading, Form Fields (name, phone, email, message) |
| **Social Icons** | Icons from social links configured in Global Settings |
| **Custom HTML** | HTML block (advanced users only) |
| **Divider** | Width, Color, Spacing |
| **Spacer** | Height |

## Preview & Publish Workflow

```
                    ┌──────────────┐
                    │  Draft Mode  │ ◄── Auto-saved every 30s
                    └──────┬───────┘
                           │
                    ┌──────▼───────┐
                    │   Preview    │ ◄── Desktop / Tablet / Mobile
                    └──────┬───────┘
                           │
                    ┌──────▼───────┐
                    │   Publish    │ ◄── Confirm dialog
                    └──────┬───────┘
                           │
              ┌────────────┼────────────┐
              ▼            ▼            ▼
        ┌──────────┐ ┌──────────┐ ┌──────────┐
        │ Live     │ │ Previous │ │ Scheduled│
        │ Website  │ │ Version  │ │ Publish  │
        └──────────┘ └──────────┘ └──────────┘
```

## Real-time Sync (Socket.IO)

When the owner makes a change in the Flutter App:
1. **Save to backend** via REST API
2. **Broadcast event** via Socket.IO to connected website instances
3. **Website receives event** and updates only the affected component
4. **No page refresh** needed for customers
5. **Cache invalidation** for SSR pages

### Event Types:
- `tenant:settings:updated` — Theme, branding, global settings
- `tenant:menu:updated` — Menu items, categories, prices, availability
- `tenant:offers:updated` — Coupons, flash sales, promotions
- `tenant:content:updated` — Home page sections, gallery, blog
- `tenant:published` — Full site publish event → clear ISR cache

## Website Integration Points

The customer website will:
1. **Fetch config** from `/api/public/tenant/{slug}/config` on first load
2. **Apply theme tokens** as CSS variables dynamically
3. **Render sections** based on `features` JSON (enabled/disabled)
4. **Subscribe to Socket.IO** for real-time updates
5. **Use ISR (Incremental Static Regeneration)** for SEO pages
6. **Stream SSR** for dynamic content like menu and cart

## CMS UX Principles (for Flutter App)

1. **One tap** to enable/disable any website section
2. **Visual pickers** instead of technical inputs (color picker, font preview)
3. **Large touch targets** (min 48px) for mobile-friendly editing
4. **Live preview** before any publish action
5. **Undo/Redo** for all edit operations
6. **Auto-save** every 30 seconds
7. **Draft & Publish** workflow with version history
8. **Plain language** — no technical jargon (use "home page" not "hero section")
9. **Icons + labels** on all controls
10. **Tooltips** explaining each setting
11. **Onboarding wizard** for first-time setup
12. **Search everything** — search across all settings and content
13. **Bulk operations** — select multiple menu items to update prices

## API Endpoints Required

```
GET    /api/tenant/:slug/config          → Full tenant configuration
PUT    /api/tenant/:slug/config          → Update configuration
POST   /api/tenant/:slug/publish         → Publish the current draft

GET    /api/tenant/:slug/menu/categories → Menu categories
POST   /api/tenant/:slug/menu/categories → Create category
PUT    /api/tenant/:slug/menu/categories/:id → Update category
DELETE /api/tenant/:slug/menu/categories/:id → Delete category

GET    /api/tenant/:slug/menu/items      → Menu items
POST   /api/tenant/:slug/menu/items      → Create item
PUT    /api/tenant/:slug/menu/items/:id  → Update item
DELETE /api/tenant/:slug/menu/items/:id  → Delete item

GET    /api/tenant/:slug/offers          → Offers
POST   /api/tenant/:slug/offers          → Create offer
PUT    /api/tenant/:slug/offers/:id      → Update offer
DELETE /api/tenant/:slug/offers/:id      → Delete offer

GET    /api/tenant/:slug/gallery         → Gallery images
POST   /api/tenant/:slug/gallery         → Upload image
DELETE /api/tenant/:slug/gallery/:id     → Delete image

GET    /api/tenant/:slug/blog            → Blog posts
POST   /api/tenant/:slug/blog            → Create post
PUT    /api/tenant/:slug/blog/:id        → Update post
DELETE /api/tenant/:slug/blog/:id        → Delete post

GET    /api/tenant/:slug/events          → Events
POST   /api/tenant/:slug/events          → Create event
PUT    /api/tenant/:slug/events/:id      → Update event
DELETE /api/tenant/:slug/events/:id      → Delete event

GET    /api/tenant/:slug/faqs            → FAQs
POST   /api/tenant/:slug/faqs            → Create FAQ
PUT    /api/tenant/:slug/faqs/:id        → Update FAQ
DELETE /api/tenant/:slug/faqs/:id        → Delete FAQ

GET    /api/tenant/:slug/reviews         → Reviews (with filter: pending/approved)
PUT    /api/tenant/:slug/reviews/:id     → Approve/reject/reply

POST   /api/upload                       → Upload image/video
```

## Multi-tenant Isolation

Each restaurant has:
- **Independent website** served from their own subdomain or custom domain
- **Independent theme & branding** via CSS variables
- **Independent content** (menu, offers, gallery, blog, etc.)
- **Independent SEO** (titles, descriptions, sitemap)
- **Independent analytics** (GA4, Meta Pixel)
- **Data isolation** — Prisma RLS or tenantId scoping on all queries
- **No cross-tenant data access** — validated at API middleware layer

## Getting Started for Flutter Developers

1. Create a Provider/Repository pattern:
   ```
   lib/
     core/
       api/
         tenant_repository.dart      # Tenant config CRUD
         menu_repository.dart        # Menu CRUD
         offer_repository.dart       # Offer CRUD
         gallery_repository.dart     # Gallery CRUD
         blog_repository.dart        # Blog CRUD
         event_repository.dart       # Event CRUD
         upload_repository.dart      # File upload
       models/
         tenant_config.dart          # TenantConfig model
         menu_item.dart              # MenuItem, MenuCategory models
         offer.dart                  # Offer model
       widgets/
         cms/
           toggle_section.dart        # Enable/disable toggle
           color_picker.dart          # Color picker widget
           font_selector.dart        # Font selector with preview
           image_picker.dart          # Image upload with crop
           section_reorder.dart      # Drag-to-reorder list
           preview_frame.dart        # Website preview WebView
           publish_button.dart       # Publish workflow button
       providers/
         tenant_provider.dart         # State management
         menu_provider.dart
         preview_provider.dart
   ```

2. Use Riverpod or Bloc for state management
3. Use WebView for live preview
4. Implement Socket.IO client for real-time sync
