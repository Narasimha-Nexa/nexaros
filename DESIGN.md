# NexaROS Design System

Comprehensive design system for nexaros.com marketing website.
Pinterest-inspired: clean, warm, content-first, high-contrast.

---

## 1. Colors

### Neutrals

| Token             | Value       | Usage                          |
| ----------------- | ----------- | ------------------------------ |
| `--bg-primary`    | `#FFF9F5`   | Main page background (warm cream) |
| `--bg-secondary`  | `#F7F3EF`   | Cards, secondary surfaces       |
| `--bg-tertiary`   | `#EFEAE5`   | Hover states, subtle fills      |
| `--text-primary`  | `#1A1A1A`   | Headings, primary text          |
| `--text-secondary`| `#5F5F5F`   | Body text, descriptions         |
| `--text-muted`    | `#9E9E9E`   | Placeholders, captions          |
| `--border`        | `#E8E0D8`   | Card borders, dividers          |
| `--border-light`  | `#F0EBE6`   | Subtle separators               |

### Accent (Crimson — energetic, restaurant-friendly)

| Token              | Value     | Usage                        |
| ------------------ | --------- | ---------------------------- |
| `--accent`         | `#E23744` | Primary CTA, key highlights  |
| `--accent-hover`   | `#C62828` | Hover state                  |
| `--accent-light`   | `#FDECEE` | Accent background tints      |
| `--accent-text`    | `#FFFFFF` | Text on accent backgrounds   |

### Secondary Accent (Emerald — success, trust)

| Token              | Value     | Usage                        |
| ------------------ | --------- | ---------------------------- |
| `--success`        | `#2DB67D` | Success states, pricing      |
| `--success-light`  | `#E8F8F0` | Success background tints     |

### Feature Colors (for module cards)

| Module          | Color   | Hex       |
| --------------- | ------- | --------- |
| POS System      | Red     | `#E23744` |
| Kitchen Display | Orange  | `#F58220` |
| Inventory       | Amber   | `#F5A623` |
| Staff Mgmt      | Emerald | `#2DB67D` |
| Analytics       | Blue    | `#2F80ED` |
| QR Ordering     | Purple  | `#9B51E0` |
| Online Orders   | Indigo  | `#4A6CF7` |
| Multi-Branch    | Teal    | `#00BFA5` |

### Dark Mode Overrides

```css
[data-theme="dark"] {
  --bg-primary: #0D0D0D;
  --bg-secondary: #1A1A1A;
  --bg-tertiary: #252525;
  --text-primary: #F5F5F5;
  --text-secondary: #A0A0A0;
  --text-muted: #666666;
  --border: #2A2A2A;
  --border-light: #1F1F1F;
}
```

---

## 2. Typography

### Font Stack

```css
--font-display: 'Inter', system-ui, -apple-system, sans-serif;
--font-body: 'Inter', system-ui, -apple-system, sans-serif;
--font-mono: 'JetBrains Mono', monospace;
```

> Inter: geometric, clean, excellent for SaaS. Free from Google Fonts.

### Scale (Desktop → Mobile)

| Element       | Desktop          | Tablet        | Mobile         | Weight  |
| ------------- | ---------------- | ------------- | -------------- | ------- |
| Hero H1       | 72px / 80px     | 56px / 64px   | 40px / 44px    | 800     |
| Section H2    | 48px / 56px     | 40px / 48px   | 32px / 40px    | 700     |
| Section H3    | 32px / 40px     | 28px / 36px   | 24px / 32px    | 600     |
| Card Title    | 20px / 28px     | 18px / 26px   | 18px / 26px    | 600     |
| Body Large    | 20px / 32px     | 18px / 28px   | 16px / 26px    | 400     |
| Body          | 16px / 26px     | 16px / 24px   | 16px / 24px    | 400     |
| Small/Caption | 14px / 20px     | 13px / 18px   | 13px / 18px    | 400     |
| Eyebrow       | 13px / 18px     | 12px / 16px   | 12px / 16px    | 600     |

> Eyebrow: uppercase, letter-spacing 0.08em, accent color.

### Line Heights

- Tight: 1.1 — hero headlines
- Snug: 1.25 — section headlines
- Normal: 1.5 — body text
- Relaxed: 1.6 — long-form content

---

## 3. Layout

### Max Widths

| Container    | Width    | Padding      |
| ------------ | -------- | ------------ |
| Full-bleed   | 100%     | 0            |
| Standard     | 1200px   | 24px sides   |
| Narrow       | 768px    | 24px sides   |
| Card grid    | 1200px   | 0 internal   |

### Spacing Scale

```
4px  — xs
8px  — sm
12px — md
16px — lg
24px — xl
32px — 2xl
48px — 3xl
64px — 4xl
80px — 5xl
96px — 6xl
```

### Section Spacing

- Between sections: 80px (desktop) / 64px (tablet) / 48px (mobile)
- Section internal padding: 80px top/bottom (desktop) / 48px (mobile)

### Border Radius

| Element          | Radius     |
| ---------------- | ---------- |
| Buttons          | 16px       |
| Cards            | 20px       |
| Images           | 20px       |
| Input fields     | 12px       |
| Tags/chips       | 16px       |
| Modals           | 24px       |

---

## 4. Navbar

### Structure

```
┌──────────────────────────────────────────────────────────────┐
│ Logo    Features  Pricing  Custom Plan  About  Blog    CTA  │
└──────────────────────────────────────────────────────────────┘
```

### Behavior

- Sticky, blur backdrop
- Transparent at top, solid background on scroll
- Height: 64px
- CTA button: crimson background, 16px radius, bold
- Mobile: hamburger menu, full-screen overlay

---

## 5. Home Page Sections

### Hero

```
┌─────────────────────────────────────────────────┐
│                                                 │
│  EYEBROW: AI-POWERED RESTAURANT OS              │
│                                                 │
│  Run Your Restaurant                            │
│  Like a Fortune 500 Company                     │
│                                                 │
│  One platform for POS, kitchen, inventory,      │
│  ordering, and analytics. Built for India.      │
│  Free to start.                                 │
│                                                 │
│  [Start Free Trial]  [Book a Demo]              │
│                                                 │
│  Trusted by 500+ restaurants across India       │
│                                                 │
└─────────────────────────────────────────────────┘
```

- Background: warm cream gradient
- Hero image: abstract restaurant illustration (CSS/SVG)
- CTA: crimson for primary, outline for secondary

### Pain Points (Wall of Love — inverted)

```
┌──────────────────────────────────────────────────┐
│  Restaurants Face These Problems Every Day        │
│                                                  │
│  📶 Unreliable Internet    💸 Expensive Software  │
│  🔒 Vendor Lock-in         📱 Disconnected Tools  │
│  🌐 No Online Presence     📊 No Real-Time Data   │
│                                                  │
│  NexaROS solves all of them. →                    │
└──────────────────────────────────────────────────┘
```

### Feature Modules (Alternating Layout)

```
┌─────────────────────────────────────────────────┐
│  [Icon]  Point of Sale                          │
│                                                  │
│  Fast, intuitive POS with table management,     │
│  split bills, and multiple payment methods.      │
│                                                  │
│  • Touch-optimized interface                     │
│  • Visual floor plan with drag-and-drop          │
│  • Cash, UPI, cards, wallets                     │
│                                                  │
│           [────────── DASHBOARD PREVIEW ──────]  │
└─────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────┐
│           [───── KITCHEN DISPLAY PREVIEW ────]   │
│                                                  │
│  [Icon]  Kitchen Display System                  │
│                                                  │
│  Real-time order queue with timers, color-coded  │
│  status, and sound alerts.                       │
│                                                  │
│  • Orders appear instantly on kitchen screens    │
│  • Color-coded: red → yellow → green             │
│  • Timer per order for performance tracking      │
└─────────────────────────────────────────────────┘
```

- Each feature gets full-width alternating section
- Left: text + bullet list; Right: dashboard preview (CSS mockup)
- Alternates: text-left/image-right ↔ image-left/text-right

### Device Showcase (Multi-Device)

```
┌─────────────────────────────────────────────────┐
│  One Platform. Every Device.                     │
│                                                  │
│  ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐           │
│  │Desktop│ │Tablet│ │Mobile│ │ KDS  │           │
│  │  POS  │ │Order │ │ Mgmt │ │ TV   │           │
│  └──────┘ └──────┘ └──────┘ └──────┘           │
│                                                  │
│  All connected. All in sync.                     │
└─────────────────────────────────────────────────┘
```

- Device mockups: CSS frames with rounded corners
- Subtle floating animation
- Responsive: stack on mobile

### How It Works (3 Steps)

```
┌─────────────────────────────────────────────────┐
│  Up and Running in Minutes                       │
│                                                  │
│  ① Register    →    ② Configure    →    ③ Go Live│
│                                                  │
└─────────────────────────────────────────────────┘
```

- Horizontal timeline on desktop, vertical on mobile
- Numbered circles with connecting line

### Testimonials / Social Proof

```
┌─────────────────────────────────────────────────┐
│  Loved by Restaurant Owners                      │
│                                                  │
│  ┌─────────┐ ┌─────────┐ ┌─────────┐           │
│  │ ⭐⭐⭐⭐⭐ │ │ ⭐⭐⭐⭐⭐ │ │ ⭐⭐⭐⭐⭐ │           │
│  │ "Quote" │ │ "Quote" │ │ "Quote" │           │
│  │ — Name  │ │ — Name  │ │ — Name  │           │
│  └─────────┘ └─────────┘ └─────────┘           │
└─────────────────────────────────────────────────┘
```

- 3-column grid on desktop, 1-column on mobile
- Subtle border, warm cream background

### Pricing Preview

```
┌─────────────────────────────────────────────────┐
│  Simple, Transparent Pricing                     │
│                                                  │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐        │
│  │ Starter  │ │ Growth   │ │Enterprise│        │
│  │ Free     │ │ ₹2,999/m │ │ ₹7,999/m │        │
│  │ [Start]  │ │ [Trial]  │ │ [Contact] │        │
│  └──────────┘ └──────────┘ └──────────┘        │
│                                                  │
│  View detailed comparison →                      │
└─────────────────────────────────────────────────┘
```

- Growth plan highlighted with crimson border
- Feature comparison with checkmarks

### FAQ

```
┌─────────────────────────────────────────────────┐
│  Frequently Asked Questions                      │
│                                                  │
│  How does the free plan work?              [▼]   │
│  What happens when the internet goes down? [▼]   │
│  Can I switch plans later?                 [▼]   │
│                                                  │
│  All questions answered →                        │
└─────────────────────────────────────────────────┘
```

- Accordion style with smooth expand/collapse
- Border-bottom separators

### Final CTA

```
┌─────────────────────────────────────────────────┐
│  ┌─────────────────────────────────────────────┐│
│  │                                             ││
│  │  Ready to Transform Your Restaurant?        ││
│  │                                             ││
│  │  Join 500+ restaurants using NexaROS.       ││
│  │                                             ││
│  │  [Start Free Trial]  [Request Custom Plan]  ││
│  │                                             ││
│  └─────────────────────────────────────────────┘│
└─────────────────────────────────────────────────┘
```

- Crimson background, white text
- Rounded container with subtle shadow

---

## 6. Features Page

### Layout

- Hero with section title
- Feature groups: each group = title + 6-card grid
- Alternating background (cream / slightly darker)
- Each card: icon + title + description
- Bottom CTA

---

## 7. Pricing Page

### Layout

- Hero with title
- 3-column pricing cards (Starter / Growth / Enterprise)
- Growth card elevated with crimson border
- Feature list with checkmarks
- FAQ section
- Bottom CTA

---

## 8. Components

### Buttons

```css
/* Primary — crimson */
.btn-primary {
  background: var(--accent);
  color: white;
  border-radius: 16px;
  padding: 12px 32px;
  font-weight: 600;
  transition: background 0.2s, transform 0.1s;
}
.btn-primary:hover {
  background: var(--accent-hover);
  transform: translateY(-1px);
}

/* Secondary — outline */
.btn-secondary {
  background: transparent;
  color: var(--text-primary);
  border: 2px solid var(--border);
  border-radius: 16px;
  padding: 12px 32px;
  font-weight: 600;
}
.btn-secondary:hover {
  border-color: var(--text-primary);
  background: var(--bg-tertiary);
}

/* Ghost — text only */
.btn-ghost {
  color: var(--text-secondary);
  font-weight: 500;
}
.btn-ghost:hover {
  color: var(--text-primary);
}
```

### Cards

```css
.card {
  background: var(--bg-secondary);
  border: 1px solid var(--border);
  border-radius: 20px;
  padding: 24px;
  transition: box-shadow 0.2s, transform 0.2s;
}
.card:hover {
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.06);
  transform: translateY(-2px);
}
```

### Tags / Chips

```css
.tag {
  background: var(--accent-light);
  color: var(--accent);
  padding: 6px 16px;
  border-radius: 16px;
  font-size: 13px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.08em;
}
```

### Inputs

```css
.input {
  background: var(--bg-primary);
  border: 2px solid var(--border);
  border-radius: 12px;
  padding: 12px 16px;
  font-size: 16px;
  transition: border-color 0.2s, box-shadow 0.2s;
}
.input:focus {
  border-color: var(--accent);
  box-shadow: 0 0 0 4px var(--accent-light);
  outline: none;
}
```

---

## 9. Responsive Breakpoints

```css
/* Desktop: 1200px+ */
@media (min-width: 1200px) { ... }

/* Tablet: 768px–1199px */
@media (min-width: 768px) and (max-width: 1199px) { ... }

/* Mobile: <768px */
@media (max-width: 767px) { ... }
```

### Mobile Adaptations

- Navbar: hamburger → full-screen overlay menu
- Hero: stack vertically, smaller text
- Feature grids: 1 column
- Pricing cards: 1 column, no scale effect
- Footer: 2-column grid
- All touch targets: minimum 44px

---

## 10. Animations

### Scroll Reveal

```css
.reveal {
  opacity: 0;
  transform: translateY(20px);
  transition: opacity 0.6s ease, transform 0.6s ease;
}
.reveal.visible {
  opacity: 1;
  transform: translateY(0);
}
```

### Hover Effects

- Cards: lift 2px + shadow
- Buttons: lift 1px + darker shade
- Links: underline slide-in

### Transitions

- All transitions: 200ms ease
- Complex transitions: 400ms ease
- Page transitions: fade

---

## 11. Dark Mode

### Toggle

- Sun/moon icon in navbar
- Persists to localStorage
- Respects `prefers-color-scheme`

### Implementation

- CSS custom properties on `[data-theme]`
- All colors via tokens, never hardcoded
- Images: invert or use dark variants
- Shadows: soften in dark mode

---

## 12. Accessibility

- All interactive elements: 44px minimum touch target
- Focus visible: 2px accent outline with 2px offset
- Color contrast: WCAG AA minimum
- Skip-to-content link
- Semantic HTML: landmarks, headings hierarchy
- Alt text on all images
- Keyboard navigation support
- `prefers-reduced-motion` respected

---

## 13. SEO

- Unique `<title>` and `<meta description>` per page
- Open Graph tags for social sharing
- JSON-LD structured data (Organization, FAQ, Product)
- Semantic HTML headings (h1 → h2 → h3)
- Internal linking between pages
- Sitemap.xml and robots.txt
