# DESIGN.md — NexaROS Design System

> Complete design specifications for all NexaROS applications.  
> Every component, color, spacing, and layout decision is documented here.

---

## Brand Identity

### Company

- **Name:** NexaROS
- **Full Name:** NexaROS — AI-Powered Restaurant Operating System
- **Tagline:** The Complete Restaurant Operating System
- **Category:** Enterprise SaaS / B2B / Restaurant Technology

### Brand Voice

- Professional
- Confident
- Simple
- Trustworthy
- Modern
- Enterprise-grade

---

## Color System

### Primary Palette

| Name | Hex | RGB | Usage |
|---|---|---|---|
| Primary | #2563EB | 37, 99, 235 | Buttons, links, active states |
| Primary Dark | #1D4ED8 | 29, 78, 216 | Hover states, emphasis |
| Primary Light | #3B82F6 | 59, 130, 246 | Secondary accents |
| Primary 50 | #EFF6FF | 239, 246, 255 | Light backgrounds |
| Primary 100 | #DBEAFE | 219, 234, 254 | Card backgrounds |

### Secondary Palette

| Name | Hex | RGB | Usage |
|---|---|---|---|
| Secondary | #7C3AED | 124, 58, 237 | AI features, premium |
| Secondary Dark | #6D28D9 | 109, 40, 217 | Hover states |
| Secondary Light | #8B5CF6 | 139, 92, 246 | AI accents |

### Semantic Colors

| Name | Hex | RGB | Usage |
|---|---|---|---|
| Success | #10B981 | 16, 185, 129 | Success messages, completed orders |
| Success Dark | #059669 | 5, 150, 105 | Hover states |
| Success Light | #D1FAE5 | 209, 250, 229 | Success backgrounds |
| Warning | #F59E0B | 245, 158, 11 | Warnings, pending states |
| Warning Dark | #D97706 | 217, 119, 6 | Hover states |
| Warning Light | #FEF3C7 | 254, 243, 199 | Warning backgrounds |
| Danger | #EF4444 | 239, 68, 68 | Errors, cancellations |
| Danger Dark | #DC2626 | 220, 38, 38 | Hover states |
| Danger Light | #FEE2E2 | 254, 226, 226 | Error backgrounds |
| Info | #06B6D4 | 6, 182, 212 | Information, tips |
| Info Light | #CFFAFE | 207, 250, 254 | Info backgrounds |

### Neutral Palette

| Name | Hex | RGB | Usage |
|---|---|---|---|
| White | #FFFFFF | 255, 255, 255 | Backgrounds, cards |
| Gray 50 | #F8FAFC | 248, 250, 252 | Page background |
| Gray 100 | #F1F5F9 | 241, 245, 249 | Card backgrounds |
| Gray 200 | #E2E8F0 | 226, 232, 240 | Borders, dividers |
| Gray 300 | #CBD5E1 | 203, 213, 225 | Disabled states |
| Gray 400 | #94A3B8 | 148, 163, 184 | Placeholder text |
| Gray 500 | #64748B | 100, 116, 139 | Muted text |
| Gray 600 | #475569 | 71, 85, 105 | Secondary text |
| Gray 700 | #334155 | 51, 65, 85 | Body text |
| Gray 800 | #1E293B | 30, 41, 59 | Headings |
| Gray 900 | #0F172A | 15, 23, 42 | Primary text, dark mode bg |

### Table Status Colors (Restaurant-Specific)

| Status | Hex | Usage |
|---|---|---|
| Free | #10B981 | Table is available |
| Occupied | #F59E0B | Table has customers |
| Reserved | #8B5CF6 | Table is reserved |
| Cleaning | #94A3B8 | Table is being cleaned |
| Order Ready | #06B6D4 | Food is ready to serve |
| Billing | #3B82F6 | Bill is being processed |

### Order Status Colors

| Status | Hex | Usage |
|---|---|---|
| Pending | #F59E0B | New order received |
| Confirmed | #3B82F6 | Order confirmed |
| Preparing | #F97316 | Kitchen is preparing |
| Ready | #10B981 | Food is ready |
| Served | #06B6D4 | Delivered to table |
| Completed | #64748B | Order finished |
| Cancelled | #EF4444 | Order cancelled |

---

## Typography

### Font Families

| Type | Font | Fallback |
|---|---|---|
| Headings | Inter | system-ui, sans-serif |
| Body | Inter | system-ui, sans-serif |
| Monospace | JetBrains Mono | monospace |
| Hindi | Noto Sans Devanagari | sans-serif |
| Kannada | Noto Sans Kannada | sans-serif |
| Telugu | Noto Sans Telugu | sans-serif |

### Type Scale

| Name | Size | Weight | Line Height | Letter Spacing | Usage |
|---|---|---|---|---|---|
| Display XL | 60px | 800 | 1.1 | -0.02em | Marketing hero |
| Display LG | 48px | 700 | 1.15 | -0.02em | Marketing headings |
| Display MD | 36px | 700 | 1.2 | -0.015em | Page titles |
| Display SM | 30px | 600 | 1.25 | -0.015em | Section headings |
| H1 | 24px | 600 | 1.3 | -0.01em | Screen titles |
| H2 | 20px | 600 | 1.35 | -0.01em | Section headings |
| H3 | 16px | 600 | 1.4 | -0.005em | Card titles |
| H4 | 14px | 600 | 1.45 | 0 | Subsection headings |
| Body LG | 16px | 400 | 1.6 | 0 | Body text (large) |
| Body | 14px | 400 | 1.6 | 0 | Body text |
| Body SM | 13px | 400 | 1.5 | 0 | Compact text |
| Caption | 12px | 400 | 1.5 | 0 | Labels, captions |
| Overline | 11px | 600 | 1.5 | 0.05em | UPPERCASE labels |
| Mono | 13px | 400 | 1.6 | 0 | Code, IDs |

### Responsive Typography

On smaller screens, reduce heading sizes:

| Element | Desktop | Tablet | Mobile |
|---|---|---|---|
| Display XL | 60px | 48px | 36px |
| Display LG | 48px | 36px | 30px |
| Display MD | 36px | 30px | 24px |
| H1 | 24px | 20px | 18px |
| H2 | 20px | 18px | 16px |

---

## Spacing System

### Base Unit: 4px

All spacing values are multiples of 4px.

| Name | Value | Usage |
|---|---|---|
| xs | 2px | Micro spacing (icon gaps) |
| sm | 4px | Tight spacing |
| md | 8px | Default spacing |
| lg | 12px | Comfortable spacing |
| xl | 16px | Section spacing |
| 2xl | 20px | Card padding |
| 3xl | 24px | Section padding |
| 4xl | 32px | Page padding |
| 5xl | 40px | Large sections |
| 6xl | 48px | Hero spacing |
| 7xl | 64px | Page sections |
| 8xl | 80px | Major sections |
| 9xl | 96px | Hero padding |

### Responsive Spacing

| Element | Desktop | Tablet | Mobile |
|---|---|---|---|
| Page padding | 32px | 24px | 16px |
| Card padding | 24px | 20px | 16px |
| Section gap | 32px | 24px | 16px |
| Element gap | 16px | 12px | 8px |

---

## Border Radius

| Name | Value | Usage |
|---|---|---|
| none | 0px | No radius |
| sm | 4px | Small elements (badges, chips) |
| md | 6px | Buttons, inputs |
| lg | 8px | Cards, modals |
| xl | 12px | Large cards |
| 2xl | 16px | Feature cards |
| 3xl | 20px | Hero sections |
| full | 9999px | Avatars, pills |

---

## Shadows

| Name | Value | Usage |
|---|---|---|
| none | none | No shadow |
| sm | 0 1px 2px 0 rgba(0,0,0,0.05) | Subtle elevation |
| md | 0 4px 6px -1px rgba(0,0,0,0.1) | Cards |
| lg | 0 10px 15px -3px rgba(0,0,0,0.1) | Dropdowns, modals |
| xl | 0 20px 25px -5px rgba(0,0,0,0.1) | Popovers |
| 2xl | 0 25px 50px -12px rgba(0,0,0,0.25) | Modals |
| inner | inset 0 2px 4px 0 rgba(0,0,0,0.05) | Input focus |

---

## Component Design Specifications

### Buttons

#### Primary Button

```
Height: 40px
Padding: 0 16px
Background: #2563EB
Text: White, 14px, 500
Border Radius: 6px
Hover: #1D4ED8
Active: #1E40AF
Disabled: #94A3B8, cursor: not-allowed
```

#### Secondary Button

```
Height: 40px
Padding: 0 16px
Background: White
Border: 1px solid #E2E8F0
Text: #334155, 14px, 500
Border Radius: 6px
Hover: #F8FAFC
Active: #F1F5F9
```

#### Danger Button

```
Height: 40px
Padding: 0 16px
Background: #EF4444
Text: White, 14px, 500
Border Radius: 6px
Hover: #DC2626
Active: #B91C1C
```

#### Ghost Button

```
Height: 40px
Padding: 0 16px
Background: transparent
Text: #64748B, 14px, 500
Border Radius: 6px
Hover: #F1F5F9
Active: #E2E8F0
```

#### Icon Button

```
Height: 40px
Width: 40px
Background: transparent
Icon: 20px, #64748B
Border Radius: 6px
Hover: #F1F5F9
```

#### Button Sizes

| Size | Height | Padding | Font Size | Icon Size |
|---|---|---|---|---|
| XS | 28px | 0 8px | 12px | 14px |
| SM | 32px | 0 12px | 13px | 16px |
| MD | 40px | 0 16px | 14px | 20px |
| LG | 48px | 0 24px | 16px | 24px |
| XL | 56px | 0 32px | 18px | 28px |

---

### Cards

#### Default Card

```
Background: White
Border: 1px solid #E2E8F0
Border Radius: 8px
Padding: 24px
Shadow: 0 1px 2px 0 rgba(0,0,0,0.05)
```

#### Interactive Card

```
Background: White
Border: 1px solid #E2E8F0
Border Radius: 8px
Padding: 24px
Shadow: 0 1px 2px 0 rgba(0,0,0,0.05)
Hover: border-color #3B82F6, shadow-md
Cursor: pointer
```

#### KPI Card

```
Background: White
Border: 1px solid #E2E8F0
Border Radius: 8px
Padding: 20px

Layout:
├── Icon (40x40, rounded-lg, primary-50 bg)
├── Label (12px, gray-500, uppercase)
├── Value (24px, gray-900, bold)
└── Change indicator (12px, green/red)
```

#### Stat Card

```
Background: White
Border: 1px solid #E2E8F0
Border Radius: 12px
Padding: 24px

Layout:
├── Title (14px, gray-500)
├── Value (32px, gray-900, bold)
├── Chart area (64px height)
└── Footer (12px, gray-400)
```

---

### Forms

#### Text Input

```
Height: 40px
Padding: 0 12px
Background: White
Border: 1px solid #E2E8F0
Border Radius: 6px
Text: 14px, gray-900
Placeholder: 14px, gray-400
Focus: border-color #3B82F6, ring 3px rgba(59,130,246,0.1)
Error: border-color #EF4444, ring 3px rgba(239,68,68,0.1)
Disabled: background #F1F5F9, cursor: not-allowed
```

#### Select Input

```
Same as text input
Plus: chevron-down icon (16px, gray-400)
```

#### Textarea

```
Min Height: 80px
Padding: 12px
Same border/style as text input
Resize: vertical
```

#### Checkbox

```
Size: 16x16
Border: 2px solid #CBD5E1
Border Radius: 4px
Checked: background #2563EB, border #2563EB
Check icon: white, 12px
```

#### Radio

```
Size: 16x16
Border: 2px solid #CBD5E1
Border Radius: 50%
Selected: border #2563EB, inner dot #2563EB (8px)
```

#### Toggle/Switch

```
Width: 44px
Height: 24px
Border Radius: 12px
Off background: #CBD5E1
On background: #2563EB
Knob: 20x20, white, shadow
```

---

### Tables

#### Table Header

```
Background: #F8FAFC
Border Bottom: 1px solid #E2E8F0
Text: 12px, gray-500, 600, UPPERCASE
Padding: 12px 16px
```

#### Table Row

```
Background: White
Border Bottom: 1px solid #F1F5F9
Padding: 12px 16px
Hover: #F8FAFC
```

#### Table Cell

```
Text: 14px, gray-700
Padding: 12px 16px
Vertical Align: middle
```

#### Mobile Table (Card List)

```
On mobile, tables convert to card lists:
┌─────────────────────────────┐
│ Order #123                  │
│ Customer: Ravi | Table: T5  │
│ Status: [Badge] | ₹650     │
│ 2 min ago                   │
└─────────────────────────────┘
```

---

### Badges / Status Indicators

#### Status Badge

```
Padding: 2px 8px
Border Radius: 9999px
Font: 12px, 500

Variants:
- Success: bg #D1FAE5, text #065F46
- Warning: bg #FEF3C7, text #92400E
- Danger: bg #FEE2E2, text #991B1B
- Info: bg #CFFAFE, text #155E75
- Neutral: bg #F1F5F9, text #475569
```

#### Table Status Indicator

```
Dot: 8x8 circle
Status colors:
- Free: #10B981
- Occupied: #F59E0B
- Reserved: #8B5CF6
- Cleaning: #94A3B8
- Order Ready: #06B6D4
- Billing: #3B82F6

Label: 12px, gray-600
```

---

### Navigation

#### Desktop Sidebar

```
Width: 240px (expanded), 64px (collapsed)
Background: White
Border Right: 1px solid #E2E8F0
Padding: 16px 12px

Logo: 140x32px
Nav Items: 40px height, 12px padding
Active: bg primary-50, text primary, left border 3px primary
Hover: bg gray-50
Icon: 20px
Text: 14px, gray-600 (active: gray-900)
```

#### Mobile Bottom Navigation

```
Height: 64px
Background: White
Border Top: 1px solid #E2E8F0
Items: 5 maximum
Active: text primary, icon filled
Inactive: text gray-400, icon outline
Label: 10px, below icon
```

#### Tablet Navigation Rail

```
Width: 72px
Background: White
Border Right: 1px solid #E2E8F0
Items: 56x56
Active: bg primary-50, text primary, rounded-lg
Hover: bg gray-50
Label: 10px below icon (only for active)
```

---

### Modal / Dialog

```
Overlay: rgba(0,0,0,0.5)
Container: max-width 480px (sm), 640px (md), 800px (lg)
Background: White
Border Radius: 12px
Padding: 24px
Shadow: 2xl

Header:
├── Title: 18px, 600, gray-900
├── Description: 14px, gray-500
└── Close button: top-right, 20px icon

Body:
└── Content with 24px padding

Footer:
├── Buttons aligned right
├── Gap: 12px
└── Cancel (secondary) + Confirm (primary)
```

---

### Toast / Notification

```
Width: 380px
Max Width: calc(100vw - 32px)
Background: White
Border Radius: 8px
Padding: 16px
Shadow: lg

Layout:
├── Icon (24px, colored by type)
├── Title (14px, 600)
├── Message (14px, gray-500)
└── Close button

Position: top-right (desktop), top-center (mobile)
Animation: slide in from right, fade out after 5s
```

---

### Loading States

#### Skeleton Loader

```
Background: linear-gradient(90deg, #F1F5F9 25%, #E2E8F0 50%, #F1F5F9 75%)
Animation: shimmer 1.5s infinite
Border Radius: 4px (text), 8px (cards)
```

#### Spinner

```
Size: 20px (sm), 24px (md), 32px (lg), 40px (xl)
Color: primary (#2563EB)
Stroke: 3px
Animation: rotate 1s linear infinite
```

#### Full Page Loader

```
Center of screen
Spinner: 40px
Text below: "Loading..." (14px, gray-500)
Background: White with 80% opacity
```

---

## Layout Specifications

### Page Layout (Desktop)

```
┌──────────────────────────────────────────────────────────┐
│ Header (64px height, white, border-bottom)               │
│ ├── Logo (left)                                          │
│ ├── Search bar (center)                                  │
│ └── User menu (right)                                    │
├──────────┬───────────────────────────────────────────────┤
│ Sidebar  │ Content Area                                  │
│ 240px    │ padding: 32px                                 │
│          │                                                │
│ Nav      │ Page Title                                    │
│ items    │ Breadcrumb                                    │
│          │                                                │
│          │ Content                                       │
│          │                                                │
│          │                                                │
└──────────┴───────────────────────────────────────────────┘
```

### Page Layout (Tablet)

```
┌──────────────────────────────────────────┐
│ Header (56px)                             │
├──────────────────────────────────────────┤
│ Content Area                              │
│ padding: 24px                             │
│                                           │
│ Page Title                                │
│ Content                                   │
│                                           │
│                                           │
└──────────────────────────────────────────┘

Nav Rail: 72px (toggleable)
```

### Page Layout (Mobile)

```
┌──────────────────────┐
│ Header (56px)         │
├──────────────────────┤
│ Content Area          │
│ padding: 16px         │
│                       │
│ Page Title            │
│ Content               │
│                       │
│                       │
├──────────────────────┤
│ Bottom Nav (64px)     │
└──────────────────────┘
```

### Page Layout (TV / Kitchen Display)

```
┌──────────────────────────────────────────────────────────┐
│ Header (48px, large text, high contrast)                  │
├──────────────────────────────────────────────────────────┤
│                                                          │
│ Large, glanceable content                                │
│ Font sizes: 2x desktop                                   │
│ Colors: High contrast                                    │
│ Touch targets: Minimum 48px                              │
│                                                          │
│ Order columns with large cards                           │
│                                                          │
└──────────────────────────────────────────────────────────┘
```

---

## Screen Specifications

### Login Screen

```
Layout: Centered card on gradient background

Card:
├── Logo (140x32)
├── "Welcome to NexaROS" (H1)
├── "Sign in to your restaurant" (Body, gray-500)
├── Email input
├── Password input
├── "Forgot password?" link
├── Sign In button (primary, full width)
├── Divider with "or"
├── Google sign-in button
└── "Don't have an account? Sign up" link
```

### Dashboard — Owner (Desktop)

```
Layout: Grid system

Row 1: KPI Cards (4 columns)
├── Today's Revenue (₹)
├── Today's Orders (count)
├── Active Tables (count)
└── Avg Order Value (₹)

Row 2: Two columns
├── Revenue Chart (line chart, 60% width)
└── Recent Orders (list, 40% width)

Row 3: Two columns
├── Top Selling Items (bar chart)
└── Table Status Grid (4x4 or larger)

Row 4: Full width
├── Live Activity Feed (real-time updates)
```

### Dashboard — Owner (Mobile)

```
Layout: Single column, scrollable

├── Greeting + Date
├── Today's Revenue (card)
├── Today's Orders (card)
├── Quick Actions (POS, New Order, etc.)
├── Recent Orders (list)
├── Table Status (grid, 2 columns)
└── Bottom Navigation
```

### POS Screen (Tablet/Desktop)

```
Layout: Two columns

Left (60%): Menu
├── Category tabs (horizontal scroll)
├── Menu items grid (3 columns)
│   ├── Image
│   ├── Name
│   ├── Price
│   └── Add button
└── Search bar

Right (40%): Current Order
├── Table selector
├── Order items list
│   ├── Item name
│   ├── Quantity (+/-)
│   ├── Price
│   └── Remove button
├── Order notes
├── Subtotal
├── Tax
├── Total
├── Discount button
├── Payment buttons
│   ├── Cash
│   ├── UPI
│   ├── Card
│   └── Split
└── Print KOT / Print Bill buttons
```

### Kitchen Display System (TV)

```
Layout: Multi-column kanban board

Columns:
├── NEW (red background header)
│   └── Order cards (large, high contrast)
├── PREPARING (orange header)
│   └── Order cards with timer
├── READY (green header)
│   └── Order cards
└── COMPLETED (gray header)
    └── Order cards (auto-remove after 5s)

Each Order Card:
├── Order # (large, 24px)
├── Table # (large)
├── Items list (16px)
├── Time since order (countdown)
├── Special notes (highlighted)
└── Status button (tap to move to next column)
```

### Menu Management (Desktop)

```
Layout: Two panels

Left Panel (30%): Categories
├── List of categories
├── Add category button
├── Drag to reorder
└── Click to filter

Right Panel (70%): Menu Items
├── Search + Filter bar
├── Grid/List toggle
├── Items table or grid
│   ├── Image thumbnail
│   ├── Name
│   ├── Category
│   ├── Price
│   ├── Status toggle (available/unavailable)
│   └── Actions (edit, delete)
└── Add item button
```

### Table Management (Tablet)

```
Layout: Floor plan grid

Grid of table cards:
├── Table number (large)
├── Status color (background/border)
├── Capacity (e.g., "4 seats")
├── Current order info (if occupied)
├── Time occupied
└── Quick actions (view order, free table)

Tap a table:
├── If free → Start new order
├── If occupied → View order details
├── If reserved → Show reservation info
└── If cleaning → Mark as free
```

---

## Animation Specifications

### Transitions

| Type | Duration | Easing | Usage |
|---|---|---|---|
| Instant | 0ms | - | Toggle states |
| Fast | 150ms | ease-in-out | Hover, focus |
| Normal | 200ms | ease-in-out | Page transitions |
| Slow | 300ms | ease-in-out | Modal open/close |
| Slower | 500ms | ease-in-out | Complex animations |

### Micro-Interactions

| Action | Animation |
|---|---|
| Button press | Scale 0.98, 150ms |
| Card hover | Shadow md, border-color change, 150ms |
| Toast appear | Slide in from right, 300ms |
| Toast disappear | Fade out, 200ms |
| Modal open | Fade in overlay + scale up content, 200ms |
| Modal close | Fade out overlay + scale down, 150ms |
| Page transition | Fade in, 200ms |
| Skeleton shimmer | Linear gradient animation, 1.5s infinite |
| Loading spinner | Rotate, 1s linear infinite |
| Status badge | Scale pulse on change, 300ms |

### Reduced Motion

Respect `prefers-reduced-motion`:

```css
@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}
```

---

## Responsive Breakpoints

| Breakpoint | Width | Device | Columns |
|---|---|---|---|
| Mobile | < 600px | Phone | 1 |
| Tablet | 600-1024px | Tablet | 2 |
| Desktop | 1024-1440px | Laptop/Desktop | 4 |
| Large | 1440-1920px | Large monitor | 4-6 |
| TV | > 1920px | Kitchen display | 6+ |

### Grid System

```
Mobile:  4 columns, 16px gap, 16px padding
Tablet:  8 columns, 16px gap, 24px padding
Desktop: 12 columns, 16px gap, 32px padding
```

---

## Accessibility (WCAG AA)

### Color Contrast

| Element | Foreground | Background | Ratio |
|---|---|---|---|
| Body text | #334155 | #FFFFFF | 10.4:1 |
| Muted text | #64748B | #FFFFFF | 5.0:1 |
| Primary button | #FFFFFF | #2563EB | 4.6:1 |
| Links | #2563EB | #FFFFFF | 4.6:1 |

### Focus States

```
Outline: 2px solid #3B82F6
Outline Offset: 2px
Border Radius: matches element
```

### Keyboard Navigation

- All interactive elements must be focusable
- Tab order follows visual order
- Escape closes modals
- Enter activates buttons
- Arrow keys navigate menus
- Skip-to-content link

### Screen Reader Support

- All images have alt text
- All form inputs have labels
- All buttons have accessible names
- ARIA labels for icon-only buttons
- Live regions for dynamic content

### Touch Targets

- Minimum touch target: 44x44px (mobile)
- Minimum touch target: 32x32px (desktop)
- Adequate spacing between touch targets

---

## Dark Mode (Future)

| Element | Light | Dark |
|---|---|---|
| Background | #F8FAFC | #0F172A |
| Surface | #FFFFFF | #1E293B |
| Border | #E2E8F0 | #334155 |
| Text Primary | #0F172A | #F8FAFC |
| Text Secondary | #64748B | #94A3B8 |
| Primary | #2563EB | #3B82F6 |

---

## Icon System

### Library: Lucide React (web) / Phosphor Icons (Flutter)

### Sizes

| Name | Size | Usage |
|---|---|---|
| xs | 12px | Inline badges |
| sm | 16px | Table cells, compact UI |
| md | 20px | Buttons, nav items |
| lg | 24px | Headers, cards |
| xl | 32px | Feature icons |
| 2xl | 48px | Empty states |
| 3xl | 64px | Hero icons |

### Colors

- Default: inherit from parent text color
- Primary: #2563EB
- Success: #10B981
- Warning: #F59E0B
- Danger: #EF4444
- Muted: #94A3B8

---

## Print Styles

### Receipt (80mm thermal)

```
Width: 480px (80mm at 96dpi)
Font: Monospace
Font Size: 12px
Line Height: 1.5

Layout:
├── Restaurant Name (center, bold, 16px)
├── Address (center, 10px)
├── Phone (center, 10px)
├── Divider (──────────────)
├── Order # / Table # / Date / Time
├── Divider
├── Items
│   ├── Qty x Item Name    Price
│   └── ...
├── Divider
├── Subtotal           ₹XXX
├── Tax (GST)           ₹XXX
├── Total             ₹XXX
├── Divider
├── Payment Method
├── Amount Paid         ₹XXX
├── Change              ₹XXX
├── Divider
├── Thank you message (center)
└── QR code (optional)
```

### KOT (Kitchen Order Ticket)

```
Width: 80mm
Font: Monospace
Font Size: 14px (larger for kitchen readability)

Layout:
├── KOT # / Table # / Waiter
├── Date / Time
├── Divider
├── Items (large font)
│   ├── 2x Butter Chicken
│   ├── 1x Naan
│   └── 1x Lassi
├── Divider
├── Special Notes (highlighted, bold)
└── Urgent: No spicy
```

---

*Document version: 1.0*  
*Last updated: July 2026*  
*Project: NexaROS — AI-Powered Restaurant Operating System*
