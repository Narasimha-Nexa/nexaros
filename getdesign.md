# getdesign.md
# NexaROS Enterprise Design System

Version: 1.0.0
Product: NexaROS Control Plane — Restaurant Operating System
Organization: NexaROS
Platform: Enterprise Multi-Tenant Restaurant OS
Application Type: SaaS • Enterprise • Cloud Native • Real-Time
Architecture: Multi-Tenant • Multi-Branch • Real-Time Synchronized

Target Users:
- Platform Super Admin
- Platform Support Agent
- Restaurant Owner (cross-tenant)
- Branch Manager
- Regional Manager
- Accountant
- Operations Manager
- Kitchen Manager
- Marketing Manager
- Cashier
- Waiter
- Chef
- Kitchen Staff
- Delivery Staff
- Customer (Diner)

Status: Production Ready
Last Updated: 2026-07-19

> This document is the single source of truth for every visual, interaction, layout, component, UX behavior, accessibility rule, animation, enterprise workflow, and design decision used across the NexaROS platform. Every engineer, designer, AI coding agent, and contributor must follow this specification without deviation.

================================================================================
PART 1 — FOUNDATION
================================================================================

## 01. Overview

NexaROS is an enterprise-grade, real-time, multi-tenant Restaurant Operating System (ROS) serving thousands of restaurant businesses and hundreds of thousands of branches. Unlike generic SaaS dashboards, NexaROS must simultaneously serve:

- **Platform Super Admins** monitoring thousands of tenants with dense data tables
- **Restaurant Owners** managing their business portfolio across multiple locations
- **Branch Staff** using POS terminals, kitchen displays, and order management in real-time
- **Customers** ordering food via website, QR code, or mobile app

The design system is built for **data density without clutter**, **real-time clarity**, and **enterprise scalability**. It borrows from the editorial calm of Coinbase, the data density of Bloomberg terminals, and the warmth of hospitality brands.

**Design Philosophy:** *"Cold precision for operations. Warm clarity for people."*

The admin panels are sharp, monochromatic, and data-dense — like a Bloomberg terminal for restaurants. The customer-facing surfaces are warm, editorial, and appetizing — like a Michelin guide meets modern tech.

## 02. Brand Identity

### Brand Personality

| Trait | Manifestation |
|-------|---------------|
| **Precise** | Every pixel has purpose. No decoration without function. |
| **Warm** | Hospitality-first. Rounded corners, human typography, warm grays. |
| **Authoritative** | Black/white editorial foundation. Data density inspired by financial terminals. |
| **Modern** | Clean geometry, generous whitespace, subtle motion. |
| **Trustworthy** | Handles orders, payments, and customer data. Security visible in every interaction. |

### Brand Voice

- **Admin Portal:** Direct, concise, professional. "12 orders pending. 2 staff clocked in."
- **Marketing Site:** Editorial, aspirational, warm. "Restaurant management, reimagined."
- **Customer Web:** Friendly, clear, appetizing. "Your table is ready. Your food is coming."
- **POS/Kitchen:** Urgent, clear, zero ambiguity. "Order #47 — 3 items preparing."

## 03. Design Principles

1. **Enterprise First** — Every component must scale to thousands of tenants and millions of records
2. **Real-Time Native** — Data changes every second. The UI must reflect this without flashing or jarring
3. **Data Density Without Clutter** — Show maximum information with minimum visual noise
4. **Hospitality Warmth** — Unlike cold fintech dashboards, restaurant software needs human warmth
5. **Consistency Over Creativity** — One button pattern. One table pattern. Repeat everywhere
6. **Accessibility First** — WCAG 2.2 AA minimum. Restaurant environments have glare, movement, distractions
7. **Mobile-Responsive Back Office** — Branch managers check orders on phones during service
8. **Offline Tolerant** — POS must work during internet outages. Design for offline-first sync
9. **AI-Native** — AI insights, AI order suggestions, AI staffing recommendations embedded in workflows
10. **Multi-Tenant Visible** — Super admins always know which tenant/branch they're viewing

## 04. Theme Architecture

The platform supports two themes:

| Theme | Surface | Inks | Primary |
|-------|---------|------|---------|
| **Light** (default) | White + warm off-white | Near-black `#1A1A1A` | NexaROS Red `#E23744` |
| **Dark** | Deep charcoal `#121212` | White `#F5F5F5` | NexaROS Red `#E23744` |

Both themes share the same semantic colors, primary brand color, typography, spacing, and component geometry. Only surface colors, text colors, and border colors differ.

================================================================================
PART 2 — COLOR SYSTEM
================================================================================

## 05. Brand Colors

NexaROS uses a **single brand accent color** — NexaROS Red. This is the only color used for primary CTAs, brand wordmark, inline links, and active states. Like Coinbase's single-blue strategy, the scarcity of color creates a distinctive, premium brand signal.

```css
--color-primary:         #E23744    /* NexaROS Red (brand primary) — available via bg-primary, text-primary, border-primary */
--color-primary-hover:   #C62E3A    /* Press state */
--color-primary-muted:   #FCE4E6    /* Light tint for badges, backgrounds */
--color-primary-ghost:   #FFF0F1    /* Subtle hover tint */

{colors.accent-warm}    #F59E0B    — Amber accent (food/festival highlights)
{colors.accent-cool}    #057DBC    — Blue accent (info, AI features)
```

**Usage Rules:**
- Primary Red is for: Primary CTAs, active navigation, brand wordmark, inline links, badges
- Primary Red is NOT for: Background fills, decorative elements, borders (use black/ink instead)
- Amber accent is ONLY for: Food highlights, festival campaigns, seasonal menus
- Blue accent is ONLY for: AI features, informational badges, help tooltips

## 06. Surface Colors

### Light Theme

```css
--color-canvas:           #FFFFFF    /* Default page floor — available via bg-canvas, text-canvas */
--color-canvas-soft:      #F7F7F8    /* Subtle alternating band — available via bg-canvas-soft */
{colors.canvas-warm}      #FFF9F5    — Warm off-white for marketing/customer surfaces
--color-surface-soft:     #F0F0F1    /* Secondary button fills, tag plates — available via bg-surface-soft */
--color-surface-strong:   #E8E8EA    /* Input borders, search bars — available via bg-surface-strong */
--color-hairline:         #E5E5E5    /* Default 1px divider — available via border-hairline, bg-hairline */
--color-hairline-strong:  #D4D4D4    /* Stronger divider for table rows — available via border-hairline-strong */
```

### Dark Theme

```
{colors.canvas}           #121212    — Default page floor
{colors.canvas-soft}      #1A1A1A    — Subtle alternating band
{colors.surface-soft}     #252525    — Secondary fills, cards
{colors.surface-strong}   #333333    — Input borders, elevated surfaces
{colors.hairline}         #2A2A2A    — Default 1px divider
{colors.hairline-strong}  #404040    — Stronger divider
```

## 07. Text Colors

### Light Theme

```css
--color-ink:              #1A1A1A    /* Display headings, primary nav, body emphasis — available via text-ink, bg-ink */
--color-ink-soft:         #333333    /* Secondary headings — available via text-ink-soft */
--color-body:             #737373    /* Default running text — available via text-body */
--color-body-strong:      #525252    /* Emphasized body text — available via text-body-strong */
--color-muted:            #A3A3A3    /* Subtitles, breadcrumbs, footer — available via text-muted */
--color-muted-soft:       #D4D4D4    /* Disabled text, placeholders — available via text-muted-soft */
--color-link:             #E23744    /* Inline links (same as primary) — available via text-link */
{colors.on-primary}       #FFFFFF    — White text on primary CTAs
{colors.on-dark}          #F5F5F5    — White text on dark surfaces
{colors.on-dark-soft}     #A3A3A3    — Muted text on dark surfaces
```

### Dark Theme

```
--color-ink:              #F5F5F5    — Display headings, primary nav
--color-ink-soft:         #E5E5E5    — Secondary headings
--color-body:             #A3A3A3    — Default running text
--color-body-strong:      #CCCCCC    — Emphasized body text
--color-muted:            #737373    — Subtitles, breadcrumbs
--color-muted-soft:       #525252    — Disabled text
```

## 08. Semantic Colors (Restaurant Operations)

These colors communicate operational states — order status, payment status, staff status, inventory alerts. They are used as **text color only** on admin surfaces (like Coinbase's trading semantics) and as **background fills** on operational displays like KDS and POS.

```css
--color-semantic-success:  #16A34A    /* Green: Order ready, paid, active — available via bg-semantic-success, text-semantic-success */
--color-semantic-warning:  #D97706    /* Amber: Pending, preparing, low stock */
--color-semantic-danger:   #DC2626    /* Red: Cancelled, overdue, out of stock */
--color-semantic-info:     #057DBC    /* Blue: Info, AI insights, system messages */
--color-semantic-neutral:  #737373    /* Gray: Draft, archived, inactive */

/* Shorthand aliases (same hex values, utility-based naming) */
--color-success:  #16A34A   /* alias for semantic-success */
--color-warning:  #D97706   /* alias for semantic-warning */
--color-danger:   #DC2626   /* alias for semantic-danger */
--color-info:     #057DBC   /* alias for semantic-info */
```

**Semantic Color Usage by Domain:**

| Domain | Success | Warning | Danger | Info |
|--------|---------|---------|--------|------|
| **Orders** | Ready/Served | Pending/Preparing | Cancelled | — |
| **Payments** | Completed | Pending | Failed | — |
| **Staff** | Clocked In | On Break | Absent | — |
| **Inventory** | In Stock | Low Stock | Out of Stock | — |
| **Kitchen** | Order Up | Prep Started | Hold/Fire | Modified |
| **Subscription** | Active | Trial/Suspended | Expired | Grace Period |
| **Tenant** | Active | — | Suspended | Trial |

### Semantic Background Fills

For operational displays (KDS, POS, Kanban boards), semantic colors can be used as very light background fills:

```
{colors.semantic-success-soft}  #F0FDF4    — Light green fill
{colors.semantic-warning-soft}  #FFFBEB    — Light amber fill  
{colors.semantic-danger-soft}   #FEF2F2    — Light red fill
{colors.semantic-info-soft}     #EFF6FF    — Light blue fill
```

## 09. Real-Time Status Indicators

For live data, use these patterns:

```
{status.pulse}          — Animated dot for "live" indicators (green pulsing dot)
{status.solid}          — Static dot for stable states
{status.spinner}        — Loading spinner for transient states
{status.count-badge}    — Numeric badge for unread counts (red circle with number)
{status.connection-bar} — Top bar indicating WebSocket connection status
```

### Connection Status Bar

A thin (3px) bar at the very top of the viewport:

```
{connection.connected}      — Hidden (no bar shown when connected)
{connection.reconnecting}   — Amber bar: "Reconnecting..."
{connection.disconnected}   — Red bar: "Connection lost. Retrying..."
{connection.offline}        — Dark bar: "You are offline. Changes will sync when connected."
```

================================================================================
PART 3 — TYPOGRAPHY
================================================================================

## 10. Font Families

The system uses a deliberate **display/sans split** similar to Coinbase:

```css
/* CSS Custom Properties */
--font-display: 'Playfair Display', Georgia, 'Times New Roman', serif;
--font-sans: 'Inter', 'Manrope', system-ui, -apple-system, sans-serif;
--font-mono: 'JetBrains Mono', 'Fira Code', 'SF Mono', monospace;

/* Tailwind v4 Utilities */
font-display → Instantiates --font-display
font-sans    → Instantiates --font-sans
font-mono    → Instantiates --font-mono
```

**Usage Guide:**

| Font | CSS Variable | Tailwind Class | Use |
|------|-------------|----------------|-----|
| **Playfair Display** (400 only) | `--font-display` | `font-display` | Hero headlines, section titles, display numbers — never weight 700+ |
| **Inter** (400/500/600/700) | `--font-sans` | `font-sans` | All body text, navigation, buttons, labels, table data |
| **JetBrains Mono** (500) | `--font-mono` | `font-mono` | Order numbers, transaction IDs, API keys, timestamps, tabular data |

**Rationale:**
- **Playfair Display** brings editorial warmth and hospitality-class elegance at weight 400. The serif signals "restaurant" (menus, fine dining) without being old-fashioned.
- **Inter** provides enterprise-grade legibility for dense data tables, POS interfaces, and dashboard metrics.
- **JetBrains Mono** ensures order numbers, invoice IDs, and financial figures align perfectly in tables.

## 11. Font Scale

```
Token                    Size    Line Ht   Weight   Letter-Spacing   Use
──────────────────────────────────────────────────────────────────────────
{type.display-hero}      56px    52px      400      -0.5px           Dashboard hero numbers
{type.display-lg}        40px    44px      400      -0.4px           Section titles
{type.display-md}        28px    32px      400      -0.3px           Card group titles
{type.display-sm}        22px    28px      400       0               Sub-section heads
{type.display-xs}        18px    24px      600      -0.2px           Card titles, modal headers
{type.title-lg}          17px    24px      600       0               Table row primary labels
{type.title-md}          15px    22px      600       0               Form labels, stat labels
{type.title-sm}          13px    18px      600       0.2px           Section group labels
{type.body-lg}           17px    26px      400       0.05px          Lead body text
{type.body-md}           15px    22px      400       0               Default body
{type.body-sm}           13px    18px      400       0.2px           Secondary body, captions
{type.caption}           11px    16px      400       0.2px           Badge labels, timestamps
{type.caption-strong}    11px    16px      600       0.5px           Uppercase badges
{type.mono-lg}           15px    22px      500       0               Order numbers, IDs
{type.mono-md}           13px    18px      500       0               Table data, amounts
{type.mono-sm}           11px    16px      500       0               Timestamps, IDs
{type.button}            13px    18px      600       0.3px           Button labels (uppercase)
{type.button-lg}         15px    22px      600       0.3px           Large CTA buttons
{type.nav-link}          13px    18px      500       0               Sidebar navigation
{type.nav-label}         11px    16px      600       0.5px           Nav section headers (uppercase)
```

## 12. Typography Rules

1. **Display text stays at weight 400.** The serif elegance comes from the font's own geometry, not from bolding. This is the single most distinctive typographic choice.
2. **Negative letter-spacing on display only.** Display uses -0.5px to -0.2px; body stays at 0.
3. **Mono on every identifier.** Order numbers, invoice IDs, transaction references — anything that identifies a record renders in JetBrains Mono.
4. **Sans-serif for ALL body text.** No serif body text anywhere in the admin portal. Serif is reserved for marketing headlines.
5. **Uppercase sparingly.** Only on badges, nav section headers, stat labels, and button labels. Never in body text.
6. **Line height decreases as size increases.** Display hero: 0.93 (52/56). Body: 1.47 (22/15). This is normal.

================================================================================
PART 4 — LAYOUT & SPACE
================================================================================

## 13. Spacing System

Base unit: `4px`. All spacing tokens are multiples of 4.

```
{space.xxs}    4px     — Icon gaps, inline spacing
{space.xs}     8px     — Tight element spacing
{space.sm}     12px    — Compact element spacing
{space.base}   16px    — Default spacing
{space.md}     20px    — Card internal padding (compact)
{space.lg}     24px    — Card internal padding (default)
{space.xl}     32px    — Section spacing, modal padding
{space.xxl}    48px    — Between major sections
{space.xxxl}   64px    — Page section spacing
{space.section} 96px   — Editorial section padding (marketing)
```

### Density Modes

The admin portal supports two density modes switchable by the user:

| Mode | Row Height | Card Padding | Spacing | Use Case |
|------|-----------|--------------|---------|----------|
| **Comfortable** | 52px | 24px | 16px | Default, general use |
| **Compact** | 40px | 16px | 8px | Dense data review, operations |

## 14. Grid System

### Admin Portal (max-width: 1440px)

```
12-column grid with 20px gutters
Max content width: 1320px (edge-to-edge panels)
Sidebar: 240px (expanded) / 64px (collapsed)
Content area: 12-column grid within remaining space
```

### Breakpoints

```
{mobile}       < 640px     — Single column, stacked navigation
{tablet}       640-1024px  — 2-column grids, collapsed sidebar
{desktop}      1024-1280px — Full layout, expanded sidebar
{wide}         1280-1440px — Max content width, full data tables
{ultrawide}    > 1440px    — Content centered at 1440px, backgrounds full-bleed
```

### Layout Zones

```
╔══════════════════════════════════════════════╗
║  Connection Status Bar (3px, conditionally)  ║
╠══════════════════════════════════════════════╣
║  Top Navigation / Header (56px)              ║
╠══════════╦═══════════════════════════════════╣
║          ║  Page Header / Breadcrumbs        ║
║  Sidebar ╠═══════════════════════════════════╣
║  240px   ║  Secondary Toolbar (optional)     ║
║          ╠═══════════════════════════════════╣
║          ║                                   ║
║          ║  Main Content Area                ║
║          ║  (12-column sub-grid)             ║
║          ║                                   ║
║          ╚═══════════════════════════════════╣
║          Footer (optional)                    ║
╚══════════════════════════════════════════════╝
```

## 15. Elevation & Shadows

NexaROS uses a minimal shadow system. Cards and surfaces primarily use hairline borders, not shadows. Shadows are reserved for floating elements that must appear above the page surface.

```
{elevation.flat}         No shadow, no border — 80% of surfaces
{elevation.hairline}     1px {colors.hairline} — Cards, table rows, form inputs
{elevation.raised}       0 1px 3px rgba(0,0,0,0.06) — Hovered cards, elevated rows
{elevation.floating}     0 4px 12px rgba(0,0,0,0.08) — Modals, dropdowns, tooltips
{elevation.drawer}       0 8px 24px rgba(0,0,0,0.12) — Side drawers, command palettes
{elevation.sticky}       0 2px 8px rgba(0,0,0,0.08) — Sticky headers, sticky columns
{elevation.toast}        0 4px 20px rgba(0,0,0,0.15) — Toast notifications
```

### Dark Theme Shadows

Dark theme shadows use lighter, more diffuse shadows to create depth on dark surfaces:

```
Dark shadows: rgba(0,0,0,0.4) at same pixel values
```

## 16. Border Radius

NexaROS uses a **square-first** geometry for the admin portal — sharp corners signal precision and data authority. Rounded corners are reserved for interactive elements (buttons, badges) and customer surfaces.

```
{radius.none}     0px      — Default for all containers (cards, tables, modals, inputs)
{radius.sm}       2px      — Badges, tags, small indicators
{radius.md}       4px      — Buttons, form inputs (admin portal)
{radius.lg}       6px      — Hover states, elevated elements
{radius.full}     9999px   — Avatars, status dots, pills (admin portal only)

Customer/Marketing surfaces use larger radii:
{radius.customer-md}  8px   — Customer web cards
{radius.customer-lg}  12px  — Customer feature cards
{radius.customer-xl}  16px  — Marketing hero cards
```

**Rule:** Sharp corners for data. Rounded corners for people.

================================================================================
PART 5 — COMPONENT SYSTEM
================================================================================

## 17. Button System

All buttons share a consistent anatomy:
- Uppercase label in `{type.button}` (13px/600/0.3px)
- Square corners (`{radius.md}` = 4px)
- Height: 36px (small), 40px (default), 48px (large)
- Left/right padding: 12px (small), 16px (default), 24px (large)
- Icon + text gap: 8px
- Smooth `0.15s ease` transitions on background, border, and color

### Button Variants

| Variant | BG | Border | Text | Hover | Use |
|---------|----|--------|------|-------|-----|
| **Primary** | `{colors.primary}` | None | `{colors.on-primary}` | Darker shade | Main action per page |
| **Secondary** | `{colors.surface-soft}` | None | `{colors.ink}` | Darker fill | Alternative actions |
| **Outline** | Transparent | `{colors.hairline}` | `{colors.ink}` | Fill + white text | Subtle actions |
| **Ghost** | Transparent | None | `{colors.ink}` | Soft fill | Toolbar actions |
| **Danger** | `{colors.semantic-danger}` | None | White | Darker red | Destructive actions |
| **Link** | Transparent | None | `{colors.primary}` | Underline | Inline text actions |

### Button States

```
Default    → Normal appearance
Hover      → Background darkens 10% (or lightens for dark themes)
Active     → Background darkens 15%, inset shadow 1px
Disabled   → Opacity 0.4, cursor not-allowed, no hover effects
Loading    → Show spinner icon, disable interaction

Focus-visible → 2px solid {colors.primary} outline, 2px offset
```

## 18. Input System

All form inputs share consistent anatomy:
- Height: 40px (default), 32px (compact)
- Square corners (`{radius.md}` = 4px)
- 1px hairline border
- 14px font size, Inter Regular
- Padding: 0 14px
- Transition: `border-color 0.15s ease, box-shadow 0.15s ease`

### Input States

```
Default      → {colors.hairline} border, white bg
Focus        → {colors.ink} border (or primary for customer surfaces)
Hover        → {colors.hairline-strong} border
Disabled     → Opacity 0.4, {colors.canvas-soft} bg
Error        → {colors.semantic-danger} border
Success      → {colors.semantic-success} border
Read-only    → {colors.canvas-soft} bg, normal text
Placeholder  → {colors.muted} text
```

### Input Types

| Type | Variant | Use |
|------|---------|-----|
| **Text Input** | Standard | Default for most fields |
| **Search Input** | Pill shape, search icon prefix, `{radius.full}` | Global search, table search |
| **Password Input** | Toggle visibility icon suffix | Login forms |
| **Phone Input** | Country code prefix dropdown | Owner registration |
| **Currency Input** | Currency symbol prefix, mono font | Pricing, amounts |
| **OTP Input** | 6 individual digit boxes | 2FA verification |
| **Number Input** | Stepper buttons | Quantities, counts |
| **Date Picker** | Calendar dropdown | Reservations, reports |
| **Time Picker** | Clock dropdown | Shift times, business hours |

## 19. Table System

Tables are the most critical component in the admin portal. They must handle thousands of rows with real-time updates.

### Table Anatomy

```
┌─────────────────────────────────────────────────────┐
│ [Checkbox] │ Restaurant ▲│ Owner │ Plan │ Status │ ⋮ │ ← Sticky header row
├─────────────────────────────────────────────────────┤
│ [☐] │ Royal Kitchen     │ Ravi  │ Pro   │ Active  │ ⋮ │ ← Data row (52px)
│ [☑] │ Spice Garden      │ Anil  │ Free  │ Trial   │ ⋮ │ ← Selected row
│ [☐] │ Burger House      │ Sam   │ Ent   │ Active  │ ⋮ │ ← Hovered row
├─────────────────────────────────────────────────────┤
│ Selected: 1  │ [Activate] [Suspend] [Delete]        │ ← Bulk action bar
├─────────────────────────────────────────────────────┤
│ Show 20 ▼ of 1,247  │ ‹ 1 2 3 4 5 ... 63 ›         │ ← Pagination
└─────────────────────────────────────────────────────┘
```

### Table Specifications

```
Row height: 52px (comfortable) / 40px (compact)
Cell padding: 12px 16px
Header height: 40px
Header style: {colors.canvas-soft} bg, 11px/600/0.5px uppercase, {colors.body} text
Divider: 1px {colors.hairline} between rows
Hover: {colors.canvas-soft} background
Selected: {colors.primary-ghost} background (light theme)
Sort indicator: Arrow icon in header, active column bold
Sticky header: Yes, with `{elevation.sticky}` shadow on scroll
Sticky columns: First 1-2 columns (checkbox + name) can be sticky
```

### Table Variants

| Variant | Use |
|---------|-----|
| **Default Table** | Standard data listing |
| **Virtualized Table** | 1000+ rows with windowed rendering |
| **Expandable Table** | Row expands to show details/children |
| **Tree Table** | Tenant → Branches hierarchy |
| **Nested Table** | Sub-table inside expanded row |
| **Kanban Table** | Row grouping by status (orders by status) |

## 20. Card System

### Card Anatomy

```
┌─────────────────────────────────┐
│ Icon  Title              Badge  │ ← Card header
│ Description / Content           │ ← Card body
│ ─────────────────────────────── │
│ Action 1    Action 2            │ ← Card footer (optional)
└─────────────────────────────────┘
```

### Card Specifications

```
Background: {colors.canvas}
Border: 1px {colors.hairline}
Padding: 20px (default)
Border-radius: {radius.none}
Shadow: {elevation.hairline} (default) / {elevation.raised} (hover)
Transition: box-shadow 0.2s ease
```

### Card Variants

| Variant | Use |
|---------|-----|
| **Stat Card** | KPI display: large number, label, optional trend |
| **Metric Card** | Multiple metrics with mini chart |
| **Status Card** | Service/component status (monitoring) |
| **Alert Card** | Warning/error with action button |
| **Info Card** | Information with icon |
| **Pricing Card** | Plan pricing with features list |
| **Dashboard Card** | Widget container for dashboard grid |

## 21. Badge & Status System

### Badge Specifications

```
Height: 20px (default)
Padding: 2px 8px
Font: {type.caption-strong} (11px/600/0.5px uppercase)
Border-radius: {radius.full} (pill shape)
Border: 1px solid
```

### Badge Variants

| Variant | CSS Class | Style | Use |
|---------|-----------|-------|-----|
| **Filled** | `badge-filled` | `--color-ink` bg + white text | Primary status indicators |
| **Outline** | `badge-outline` | Transparent + `--color-ink` text + `--color-hairline` border | Subtle status indicators |
| **Soft** | `badge-soft` | `--color-canvas-soft` bg + `--color-ink` text, no border | Dense lists, tables |
| **Dot** | (inline only) | Just a colored dot, no label | Minimal status |

### Semantic Badge Variants

These add semantic color to the badge system. Available in both filled and outline styles:

| Variant | CSS Class (Filled) | CSS Class (Outline) | Use |
|---------|-------------------|---------------------|-----|
| **Success** | `badge-success` | `badge-outline-success` | Active, online, completed, paid, approved |
| **Warning** | `badge-warning` | `badge-outline-warning` | Pending, preparing, low stock |
| **Danger** | `badge-danger` | `badge-outline-danger` | Suspended, cancelled, failed, error |
| **Info** | `badge-info` | `badge-outline-info` | Trial, setup, draft, info messages |
| **Neutral** | `badge-neutral` | `badge-outline-neutral` | Archived, inactive, offline |

### Status Badge Colors

The `StatusBadge` React component (`@/components/ui/badge`) automatically maps status strings to the correct variant:

```
active, online, completed, paid, approved, verified, enabled  →  success (green)
pending, processing, in_progress, waiting                       →  warning (amber)
inactive, offline, error, failed, cancelled, suspended, banned  →  danger (red)
info, draft, trial, setup                                       →  info (blue)
archived, deleted, expired                                      →  neutral (gray) or outline
```

Usage: `<StatusBadge status="active" />` renders a green success badge.
`<StatusBadge status="suspended" label="Suspended" />` shows "Suspended" in red.

### Badge CSS Implementation

```css
.badge {
  display: inline-flex; align-items: center;
  padding: 2px 8px;
  font-family: var(--font-sans);
  font-size: 11px; font-weight: 600; letter-spacing: 0.5px; text-transform: uppercase;
  border: 1px solid; border-radius: 9999px; line-height: 16px;
}
```

## 22. Dialog & Modal System

### Dialog Specifications

```
Overlay: rgba(0,0,0,0.5), backdrop-blur(2px)
Animation: fadeIn 0.2s + slideInUp 0.3s
Border-radius: {radius.none}
Shadow: {elevation.drawer}

Sizes:
  sm: 400px max-width  — Confirmations, simple forms
  md: 560px max-width  — Default dialogs
  lg: 720px max-width  — Complex forms, detail views
  xl: 960px max-width  — Full detail pages
  full: calc(100vw - 80px) — Near-fullscreen
```

### Dialog Anatomy

```
┌────────────────────────────────┐
│  Title              [Close ×]  │ ← Sticky header
├────────────────────────────────┤
│                                 │
│  Content area (scrollable)      │
│                                 │
├────────────────────────────────┤
│  [Cancel]            [Confirm]  │ ← Sticky footer
└────────────────────────────────┘
```

## 23. Skeleton Loading System

### Specifications

```
Animation: shimmer (gradient sweep left-to-right)
Duration: 1.5s
Gradient: {colors.canvas-soft} → {colors.hairline} → {colors.canvas-soft}
Border-radius: 2px
```

### Skeleton Variants

| Variant | Use |
|---------|-----|
| **Text Skeleton** | Single line (80% width) or multi-line |
| **Card Skeleton** | Card-shaped block with text line inside |
| **Table Skeleton** | Header row + 5 data rows with varying widths |
| **Stat Skeleton** | Stat card shape with number + label placeholders |
| **Chart Skeleton** | Rectangle with chart-like shape inside |
| **Avatar Skeleton** | Circle, 40px |
| **Image Skeleton** | Rectangle with 16:9 ratio |

## 24. Empty State System

### Specifications

```
Layout: Centered vertically and horizontally
Icon: 48-64px, {colors.muted} color, 1px stroke weight
Title: {type.body-lg}, {colors.body}
Description: {type.body-md}, {colors.muted}
Action: Optional primary button below description
```

### Empty State Variants

| Variant | Icon | Title | Description |
|---------|------|-------|-------------|
| **No Data** | Inbox | "No records found" | "Create your first record to get started." |
| **No Results** | SearchX | "No results found" | "Try adjusting your search or filters." |
| **No Access** | Lock | "No access" | "You don't have permission to view this." |
| **Under Construction** | Wrench | "Coming soon" | "This feature is being built." |
| **Error** | AlertTriangle | "Something went wrong" | "Try refreshing the page." |

================================================================================
PART 6 — ENTERPRISE MODULE PATTERNS
================================================================================

## 25. Provisioning Wizard

The 6-step restaurant provisioning flow uses a stepper component:

```
[Step 1 ✓] ─── [Step 2 ✓] ─── [Step 3 ●] ─── [Step 4] ─── [Step 5] ─── [Step 6]

Stepper States:
  Completed:  Filled checkmark in dark circle
  Active:     Current step number in dark circle, bold label
  Upcoming:   Step number in light circle, muted label

Step indicator: 28px circle, centered above label
Connector line: 2px solid, turns dark when step completed
```

### Existing Owner Dialog

When an owner email already exists, show a dialog:

```
┌─────────────────────────────────────────┐
│  Existing Business Found                │
│                                         │
│  Owner: Ravi Kumar                      │
│  Email: ravi@gmail.com                  │
│  Phone: 9876543210                       │
│                                         │
│  Your Businesses:                       │
│  ┌────────────────────────────────────┐ │
│  │  Royal Kitchen — Bangalore     ●   │ │
│  │  Branch: Main Branch           ●   │ │
│  └────────────────────────────────────┘ │
│  ┌────────────────────────────────────┐ │
│  │  Spice Garden — Delhi          ●   │ │
│  │  Branch: Main Branch           ●   │ │
│  └────────────────────────────────────┘ │
│                                         │
│  [Create New Business]  [Add Branch]    │
└─────────────────────────────────────────┘
```

## 26. Multi-Tenant Identifier

Every page in the admin portal must clearly indicate which tenant (and branch) is being viewed:

```
┌─────────────────────────────────────┐
│  Platform (Super Admin)             │ ← Role badge
│                                     │
│  ▼ Royal Kitchen                    │ ← Tenant switcher (dropdown)
│  ├─ Spice Garden                    │
│  └─ Burger House                    │
│                                     │
│  Branch: Main Branch  ▼             │ ← Branch switcher
└─────────────────────────────────────┘
```

**Indicator patterns:**
- **Platform-wide view:** "Platform" label in header, no tenant/branch selector
- **Tenant view:** Tenant name in header with switcher dropdown, branch selector below
- **Branch view:** Tenant + Branch breadcrumb in page header

## 27. Real-Time Indicators

### Live Data Patterns

```
{live.indicator}     — Green pulsing dot + "Live" text (top of real-time pages)
{live.timestamp}     — "Updated 2s ago" (auto-refreshes)
{live.counter}       — Animated number transition (order count, revenue)
{live.badge}         — Count badge with fade-in animation (new orders)
{live.row-highlight} — New row fades in with amber tint for 2s
{live.sync-icon}     — Spinning sync icon when refresh happening
```

### Real-Time Table Updates

When a new row is added to a visible table (e.g., new order):
1. Row appears at top with a brief amber tint background
2. Tint fades to white over 2 seconds
3. Count badge increments with a bounce animation
4. Toast notification appears (if enabled)

## 28. Kanban / KDS (Kitchen Display System)

The KDS is a specialized full-screen view for kitchen operations:

```
┌───────────────┬───────────────┬───────────────┐
│  PENDING      │  PREPARING    │  READY        │
│  ┌─────────┐  │  ┌─────────┐  │  ┌─────────┐  │
│  │ Order 47│  │  │ Order 45│  │  │ Order 42│  │
│  │ Table 3 │  │  │ Table 1 │  │  │ Takeaway│  │
│  │ 3 items │  │  │ 5 items │  │  │ 2 items │  │
│  │ [15:23] │  │  │ [15:18] │  │  │ [15:10] │  │
│  ├─────────┤  │  ├─────────┤  │  ├─────────┤  │
│  │ Item 1  │  │  │ Item 1 ✓│  │  │ All ✓   │  │
│  │ Item 2  │  │  │ Item 2 ⏳│  │  │ Served? │  │
│  │ Item 3  │  │  │ Item 3  │  │  │ [Serve] │  │
│  └─────────┘  │  └─────────┘  │  └─────────┘  │
│  +3 more      │  +2 more      │  +1 more       │
└───────────────┴───────────────┴───────────────┘

Column headers: Sticky, colored by status (amber/blue/green)
Order cards: White bg, {elevation.hairline}, 4px left border by status
Timer: Red text for orders exceeding target time
```

================================================================================
PART 7 — MOTION SYSTEM
================================================================================

## 29. Motion Philosophy

NexaROS motion is **functional, not decorative**. Every animation serves a purpose:
- **Direction:** Elements move in the logical direction (pages slide left/right, modals slide up, drawers slide right)
- **Speed:** Fast enough to feel instant (150-300ms), slow enough to track (never exceed 400ms)
- **Easing:** Natural acceleration/deceleration (ease-out for entrances, ease-in for exits)
- **Reduced motion:** `prefers-reduced-motion` respected — all animations become instant

## 30. Animation Tokens

```
{motion.instant}    0ms       — Opacity toggles, visibility changes
{motion.fast}       100ms     — Hover states, micro-interactions
{motion.default}    200ms     — Button presses, input focus, color transitions
{motion.slow}       300ms     — Panel slides, modal entrances, page transitions
{motion.slower}     400ms     — Large drawer entrances, complex transitions

{motion.ease-out}   cubic-bezier(0, 0, 0.2, 1)     — Entrances
{motion.ease-in}    cubic-bezier(0.4, 0, 1, 1)     — Exits
{motion.ease-in-out} cubic-bezier(0.4, 0, 0.2, 1)  — Emphasis
{motion.spring}     cubic-bezier(0.34, 1.56, 0.64, 1) — Bouncy (sparingly)
```

## 31. Component Animations

| Component | Event | Animation | Duration | Easing |
|-----------|-------|-----------|----------|--------|
| **Button** | Hover in | Background darken | 100ms | ease-out |
| **Button** | Hover out | Background lighten | 200ms | ease-out |
| **Button** | Press | Scale 0.98 + background darken | 100ms | ease-in |
| **Sidebar** | Expand/Collapse | Width transition | 200ms | ease-out |
| **Sidebar link** | Hover | Background + border color | 150ms | ease-out |
| **Modal** | Open | Fade in + slide up 20px | 200ms | ease-out |
| **Modal** | Close | Fade out | 150ms | ease-in |
| **Drawer** | Open | Slide in from right | 300ms | ease-out |
| **Drawer** | Close | Slide out to right | 200ms | ease-in |
| **Toast** | Enter | Slide in from right + fade | 200ms | ease-out |
| **Toast** | Exit | Fade out | 200ms | ease-in |
| **Page** | Transition | Fade in | 200ms | ease-out |
| **Table row** | Hover | Background | 100ms | ease-out |
| **Table sort** | Click | Rotate sort icon | 150ms | ease-out |
| **Dropdown** | Open | Fade in + slide down 8px | 150ms | ease-out |
| **Dropdown** | Close | Fade out | 100ms | ease-in |
| **Skeleton** | Shimmer | Gradient sweep | 1.5s | linear (loop) |
| **Skeleton** → Content | Loaded | Fade in content | 200ms | ease-out |
| **Counter** | Number change | Number flip | 200ms | ease-out |
| **Real-time update** | New row | Row highlight (amber tint → clear) | 2s | ease-out (loop) |
| **Status dot** | Pulse | Opacity pulse | 2s | ease-in-out (loop) |

================================================================================
PART 8 — ACCESSIBILITY
================================================================================

## 32. Standards

NexaROS targets **WCAG 2.2 AA** across all surfaces:

| Criteria | Target | Exceptions |
|----------|--------|------------|
| Color contrast (normal text) | 4.5:1 | Disabled states (3:1) |
| Color contrast (large text) | 3:1 | — |
| Color contrast (UI components) | 3:1 | — |
| Focus visible | 2px solid outline + 2px offset | — |
| Touch targets | 44×44px minimum | Inline links (minimum 24px tap area via padding) |
| Keyboard navigation | All interactive elements reachable | — |
| Screen reader labels | All form inputs labeled | — |
| Motion | Respect `prefers-reduced-motion` | — |
| Color perception | Information never conveyed by color alone | Status badges include text label |

## 33. Focus Management

```
Focus indicator: 2px solid {colors.primary}, 2px offset from element
Focus order: Logical DOM order (left-to-right, top-to-bottom)
Focus trap: Modals and drawers trap focus within themselves
Skip link: First focusable element on page — "Skip to main content"
```

### Special Cases

- **KDS (Kitchen Display):** Large touch targets (min 64px), high contrast, voice-read supported
- **POS Billing:** Keyboard-first (number pad shortcuts), focus stays on input after action
- **Order Management:** Arrow keys navigate order list, Enter opens detail, Esc closes

================================================================================
PART 9 — ENTERPRISE PRODUCTION GUIDELINES
================================================================================

## 34. Folder Structure

```
src/
├── app/                    # Next.js App Router pages
│   ├── (dashboard)/        # Authenticated dashboard layout
│   │   ├── dashboard/      # Overview dashboard
│   │   ├── tenants/        # Tenant management
│   │   ├── branches/       # Branch management
│   │   ├── staff/          # Staff management
│   │   ├── provision/      # Restaurant provisioning
│   │   ├── subscriptions/  # Subscription management
│   │   ├── monitoring/     # System monitoring
│   │   └── ...
│   ├── login/              # Login page
│   └── layout.tsx          # Root layout
│
├── components/
│   ├── layout/             # Shell, sidebar, header, breadcrumbs
│   ├── ui/                 # Atomic components (button, input, table, etc.)
│   ├── charts/             # Chart wrappers (ApexCharts)
│   ├── modules/            # Feature-specific components (provisioning wizard)
│   └── shared/             # Shared patterns (empty-state, skeleton)
│
├── lib/
│   ├── api.ts              # API client
│   ├── utils.ts            # Utility functions
│   └── razorpay.ts         # Payment gateway integration
│
├── stores/                 # Zustand stores
│   ├── auth.store.ts       # Auth + impersonation state
│   └── ui.store.ts         # Toast, theme, sidebar state
│
├── types/                  # TypeScript interfaces
│   └── index.ts
│
└── hooks/                  # Custom React hooks
    ├── use-debounce.ts
    ├── use-intersection.ts
    └── use-real-time.ts
```

## 35. Component Architecture

Every component follows this pattern:

```
1. Imports (React, hooks, components, types)
2. Interface/Type definitions
3. Component function with hooks at top
4. Conditional rendering logic
5. JSX return (flat as possible, extract sub-components)
6. Exported default
```

### Naming Conventions

```
Components: PascalCase (Button, DataTable, ProvisionWizard)
Files: kebab-case (button.tsx, data-table.tsx)
Functions: camelCase (handleSubmit, fetchTenants)
Constants: UPPER_SNAKE_CASE (API_BASE, STORAGE_KEY)
Types/Interfaces: PascalCase (Tenant, Subscription, ProvisionResult)
CSS classes: utility-first (Tailwind), component classes for complex patterns
```

## 36. Performance Design Principles

1. **Virtualize large lists** — Tables with 1000+ rows use windowed rendering
2. **Lazy load below-fold** — Only render what's visible
3. **Debounce search inputs** — 300ms delay before API call
4. **Optimistic updates** — UI updates before API response, revert on error
5. **Skeleton loading** — Every data fetch shows skeleton, not spinner
6. **Preload critical paths** — Dashboard, tenant list preloaded after login
7. **Bundle splitting** — Each route loads independently
8. **Image optimization** — Next.js Image component, WebP format, responsive sizes
9. **Mono font for numbers** — Prevents layout shift in tables
10. **CSS containment** — `contain: content` on independent widgets

## 37. Accessibility Checklist

- [ ] All interactive elements keyboard-accessible
- [ ] Focus indicator visible (2px primary outline + 2px offset)
- [ ] Color contrast 4.5:1 for normal text
- [ ] Color not the only means of conveying information
- [ ] Form inputs have associated labels
- [ ] Images have alt text
- [ ] Tables have proper scope attributes on headers
- [ ] ARIA live regions for real-time updates
- [ ] Error messages associated with inputs via aria-describedby
- [ ] Touch targets 44×44px minimum
- [ ] prefers-reduced-motion respected
- [ ] Skip navigation link available

## 38. Design Tokens Reference

> **Important:** NexaROS uses **Tailwind CSS v4**. Configuration is done via CSS `@theme` blocks, not a JS config file. The legacy `tailwind.config.ts` file is a minimal stub for IDE autocompletion only and is **ignored** by the build.

The `@theme` block is defined in `apps/admin-portal/src/app/globals.css`. Every custom property in `@theme` automatically generates Tailwind utility classes (e.g., `--color-primary` generates `bg-primary`, `text-primary`, `border-primary`, `ring-primary`, etc.).

### CSS Custom Properties (from globals.css `@theme`)

#### Brand Colors

```css
--color-primary:         #E23744;   /* Usage: bg-primary, text-primary, border-primary */
--color-primary-hover:   #C62E3A;   /* Usage: bg-primary-hover, text-primary-hover */
--color-primary-muted:   #FCE4E6;   /* Usage: bg-primary-muted */
--color-primary-ghost:   #FFF0F1;   /* Usage: bg-primary-ghost */
```

#### Surface Colors

```css
--color-ink:             #1A1A1A;   /* Usage: bg-ink, text-ink, border-ink */
--color-ink-soft:        #333333;   /* Usage: text-ink-soft */
--color-canvas:          #FFFFFF;   /* Usage: bg-canvas */
--color-canvas-soft:     #F7F7F8;   /* Usage: bg-canvas-soft */
--color-surface-soft:    #F0F0F1;   /* Usage: bg-surface-soft */
--color-surface-strong:  #E8E8EA;   /* Usage: bg-surface-strong */
--color-hairline:        #E5E5E5;   /* Usage: border-hairline, bg-hairline */
--color-hairline-strong: #D4D4D4;   /* Usage: border-hairline-strong */
```

#### Text Colors

```css
--color-body:            #737373;   /* Usage: text-body */
--color-body-strong:     #525252;   /* Usage: text-body-strong */
--color-muted:           #A3A3A3;   /* Usage: text-muted */
--color-muted-soft:      #D4D4D4;   /* Usage: text-muted-soft (disabled text, placeholders) */
--color-link:            #E23744;   /* Usage: text-link (same as primary) */
```

#### Semantic Colors

```css
--color-semantic-success: #16A34A;  /* Usage: bg-semantic-success, text-semantic-success */
--color-semantic-warning: #D97706;  /* Usage: bg-semantic-warning, text-semantic-warning */
--color-semantic-danger:  #DC2626;  /* Usage: bg-semantic-danger, text-semantic-danger */
--color-semantic-info:    #057DBC;  /* Usage: bg-semantic-info, text-semantic-info */
--color-semantic-neutral: #737373;  /* Usage: bg-semantic-neutral, text-semantic-neutral */

/* Shorthand aliases for common usage */
--color-success: #16A34A;  /* Usage: bg-success, text-success */
--color-warning: #D97706;  /* Usage: bg-warning, text-warning */
--color-danger:  #DC2626;  /* Usage: bg-danger, text-danger */
--color-info:    #057DBC;  /* Usage: bg-info, text-info */
```

#### Typography

```css
--font-display: 'Playfair Display', Georgia, 'Times New Roman', serif;
--font-sans:    'Inter', 'Manrope', system-ui, -apple-system, sans-serif;
--font-mono:    'JetBrains Mono', 'Fira Code', 'SF Mono', monospace;
```

**Tailwind v4 Usage:** `font-display`, `font-sans`, `font-mono`

### Component CSS Classes

These are defined in `@layer components` in globals.css. Use them directly as CSS class names.

#### Buttons

```css
.btn                    /* Base button — all variants use this */
.btn-primary            /* Primary action: bg-primary, white text */
.btn-secondary          /* Alternative action: bg-surface-soft, ink text */
.btn-outline            /* Subtle action: transparent, hairline border, ink text */
.btn-ghost              /* Toolbar action: transparent, ink text, soft hover */
.btn-danger             /* Destructive action: bg-danger, white text */
.btn-sm                 /* Small variant: 7px 12px, 12px font */
.btn-lg                 /* Large variant: 14px 28px, 15px font */
```

#### Inputs

```css
.input              /* Default text input: 40px height, 14px font, 4px radius */
.input.input-error  /* Error state: danger border */
.label              /* Form label: 12px/600/0.3px uppercase */
```

#### Cards

```css
.card             /* Default card: white bg, 1px hairline border, 20px padding */
.card-elevated    /* Elevated card: same + subtle shadow, hover deepens */
```

#### Badges

```css
.badge                 /* Base badge: pill shape, 11px/600/0.5px uppercase */
.badge-filled          /* Filled: ink bg, white text */
.badge-outline         /* Outline: transparent, ink text, hairline border */
.badge-soft            /* Soft tint: canvas-soft bg */
.badge-success         /* Semantic filled: green */
.badge-warning         /* Semantic filled: amber */
.badge-danger          /* Semantic filled: red */
.badge-info            /* Semantic filled: blue */
.badge-neutral         /* Semantic filled: gray */
.badge-outline-success /* Semantic outline: green text/border */
.badge-outline-warning /* Semantic outline: amber text/border */
.badge-outline-danger  /* Semantic outline: red text/border */
.badge-outline-info    /* Semantic outline: blue text/border */
.badge-outline-neutral /* Semantic outline: gray text/border */
```

#### Tables

```css
.table          /* Full table: 11px/600 uppercase headers, 14px data */
.table-compact  /* Compact variant: smaller padding, 13px data */
```

#### Dividers

```css
.divider        /* 1px hairline gray */
.divider-heavy  /* 1px ink black */
```

#### Skeleton Loading

```css
.skeleton  /* Shimmer animation: 1.5s gradient sweep */
```

#### Toast Notifications

```css
.toast-card      /* Toast container: white bg, hairline, shadow, progress bar */
.toast-progress  /* Toast progress bar: ink bottom bar */
```

#### Sidebar

```css
.sidebar-link    /* Nav link: white text on dark, border-left accent */
.sidebar-link.active  /* Active state: white text, white left border, primary icon */
```

#### Dialogs

```css
.dialog-overlay  /* Modal backdrop: 0.5 opacity, blur(2px) */
```

#### Empty States

```css
.empty-state                /* Centered flex container, 48px padding */
.empty-state-icon           /* Muted icon, 16px bottom margin */
.empty-state-title          /* 15px/600 body text */
.empty-state-description    /* 13px muted text, 360px max-width */
```

#### Stat Widgets

```css
.stat-value             /* Large display number: 32px Playfair Display */
.stat-label             /* Uppercase label: 11px/600/0.5px */
.stat-change-positive   /* Positive change: green */
.stat-change-negative   /* Negative change: red */
```

#### Live Indicators & Connection Status

```css
.live-indicator             /* Green pulsing dot + "Live" label */
.connection-bar            /* 3px top bar for WebSocket status */
.connection-bar.connected      → Hidden (opacity 0)
.connection-bar.reconnecting   → Amber bar
.connection-bar.disconnected   → Red bar
.connection-bar.offline        → Dark bar
```

#### Animation Utilities

```css
.animate-slide-in-right  /* Toast entrance: slide 300ms */
.animate-slide-in-up     /* Modal entrance: slide 250ms */
.animate-fade-in         /* General fade: 200ms */
```

### Tailwind v4 Usage Examples

```jsx
// Colors
<div className="bg-primary text-canvas">  // --color-primary bg, white text
<span className="text-body">             // --color-body text
<div className="border-hairline">         // --color-hairline border

// Semantics
<span className="text-semantic-success">  // Green text for success states
<span className="bg-semantic-danger">     // Red bg for danger states

// Typography
<h1 className="font-display">             // Playfair Display
<p className="font-sans">                 // Inter (default, usually omitted)
<code className="font-mono">              // JetBrains Mono

// Component classes
<button className="btn btn-primary">Button</button>
<input className="input" />
<div className="card">Content</div>
<span className="badge badge-success">Active</span>
<div className="divider-heavy" />

// React components (preferred)
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge, StatusBadge } from '@/components/ui/badge';

<Button>Click</Button>
<Card><p>Content</p></Card>
<Badge variant="success">Active</Badge>
<StatusBadge status="active" />   // Automatically maps to correct variant
```

================================================================================
PART 10 — APPENDIX
================================================================================

## 39. Do's and Don'ts

### Do

- Reserve NexaROS Red (`#E23744`) for primary CTAs, active navigation, brand wordmark, small badges
- Keep data tables square-cornered (`{radius.none}`) — sharp corners signal data precision
- Use Playfair Display at weight 400 for section headlines — never weight 700+
- Render every order number, invoice ID, and monetary value in JetBrains Mono
- Show skeleton loading for every data fetch — never show blank page
- Use the dark/light section rhythm for marketing pages
- Keep primary CTAs uppercase, 13px/600/0.3px tracking
- Always show tenant context indicator in admin header
- Use animated status dots for live/real-time indicators
- Respect `prefers-reduced-motion` — transitions become instant

### Don't

- Don't introduce a secondary brand color — NexaROS Red is the only action color
- Don't use curved corners (`{radius.md}` or `{radius.full}`) on data tables — sharp corners only
- Don't bold display copy — Playfair Display at 400 is the spec; bolding shifts the brand voice
- Don't add drop shadow tiers — the system has exactly 5 elevation levels
- Don't use semantic colors as button backgrounds (except danger variant)
- Don't use green/red for order status without text labels — color-blind accessible
- Don't auto-play animations or videos
- Don't hide scrollbars — they communicate content length
- Don't use loading spinners where skeletons can be used
- Don't extract a CTA color from third-party widgets

## 40. Responsive Behavior Summary

| Component | Mobile (<640) | Tablet (640-1024) | Desktop (1024+) |
|-----------|--------------|-------------------|-----------------|
| **Sidebar** | Hidden (hamburger) | Collapsed (icons only) | Expanded (240px) |
| **Data tables** | Horizontal scroll or card view | Horizontal scroll | Full table |
| **Page header** | Stacked (title above actions) | Flex row | Flex row |
| **Stats grid** | 2 columns | 3 columns | 4-6 columns |
| **Action menu** | Bottom sheet | Dropdown | Dropdown |
| **Modals** | Full-screen | Centered | Centered |
| **Forms** | Single column | 2 columns | 2-3 columns |
| **Stepper** | Vertical (icon + label stacked) | Horizontal (icon + label) | Horizontal |
| **KDS** | Not used on mobile | 2-column kanban | 3-column kanban |

## 41. Version History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0.0 | 2026-07-18 | NexaROS Design Team | Initial design system specification |
| 1.1.0 | 2026-07-19 | NexaROS Design Team | Aligned with CSS implementation: updated Design Tokens Reference (Section 38) to match actual globals.css `@theme` tokens, added component CSS classes (badge semantic variants, stat widgets, live indicator, connection bar, dialog overlay, empty state, toast, animation utilities), replaced Tailwind v3 config reference with v4 `@theme` block documentation, added missing tokens (primary-ghost, body-strong, muted-soft, link, semantic-neutral), updated font fallback stacks, added `StatusBadge` component documentation with status-to-variant mapping table. |

================================================================================
END OF DOCUMENT
================================================================================
