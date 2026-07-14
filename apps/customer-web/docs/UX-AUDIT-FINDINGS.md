# NexaROS Customer Web — UX/UI Audit Findings

## 1. Customer Journey Gaps

| Stage | Status | Issue |
|-------|--------|-------|
| Discovery | ✅ Good | SEO metadata, Open Graph, JSON-LD present |
| Browse Menu | ✅ Good | Category tabs, search, filters, grid/list view |
| Item Detail | ⚠️ Partial | Missing: related items, frequently bought together recommendations |
| Cart | ⚠️ Partial | Missing: standalone /cart page, edit in cart drawer |
| Checkout | ⚠️ Partial | Missing: form validation (react-hook-form + zod not used), payment gateway integration |
| Payment | ❌ Missing | No /payment page, no actual payment flow |
| Order Confirmation | ❌ Missing | No /order-success page |
| Order Tracking | ❌ Missing | No /orders or /track-order page (old restaurant/[slug] routes exist) |
| Post-Order | ❌ Missing | No reorder flow, no review prompt |
| Auth (Login/Signup) | ⚠️ Partial | Login exists, signup and forgot-password missing |
| Profile Management | ❌ Missing | Dashboard exists, all 8 sub-pages missing |
| Reservations | ✅ Good | Full flow exists (date, time, guests, confirm) |
| FAQ | ❌ Missing | No /faq page |
| Blog | ❌ Missing | No /blog or /blog/[slug] pages |

## 2. Spacing & Typography Inconsistencies

### Issues:
- **Hero section**: `py-16 sm:py-24` inconsistent with `py-16 sm:py-20` in other sections — no single spacing scale
- **Section headers**: Some use `mb-6 sm:mb-8`, others use `mb-4` — inconsistent
- **Font scale**: Body text uses `text-sm` and `text-base` interchangeably — needs semantic text styles
- **Line heights**: `leading-relaxed` in some places, none in others — inconsistent readability
- **Color tokens**: `text-body` vs `text-ink/80` vs `text-gray-500` — color token usage is inconsistent across pages

### Recommendations:
- Create a spacing scale: `section-py: sm:py-16 md:py-20 lg:py-24`
- Use semantic text utility classes (`.text-body`, `.text-caption`, `.text-display`)
- Audit all hardcoded colors and replace with CSS variable tokens

## 3. Color System Audit

### Current tokens:
- `--color-ink: #171717` — text color (OK)
- `--color-body: #737373` — secondary text (OK)
- `--color-hairline: #e5e5e5` — borders (OK)
- `--color-primary: #2563eb` — primary blue (OK)
- `--color-success: #10b981`, `--color-warning: #f59e0b`, `--color-danger: #ef4444` (OK)

### Issues:
- No `--color-secondary` or `--color-accent` tokens
- Dark mode contrast: `--color-hairline: #404040` too close to `--color-ink-light: #262626` — insufficient contrast
- Success/error banners use hardcoded `bg-green-100` and `bg-red-100` instead of tokenized values

## 4. Accessibility Issues (WCAG 2.2 AA)

| Issue | Severity | Location |
|-------|----------|----------|
| Images missing meaningful `alt` text | High | All food cards, menu items, gallery thumbnails |
| Interactive elements missing `aria-pressed` | Medium | Filter chips, category tabs |
| Color contrast on dark mode text | Medium | `#a3a3a3 text-body` on `#262626 bg-ink-light` (contrast ~3.5:1, needs 4.5:1) |
| Focus indicators inconsistent | Medium | Some use `ring-2`, others use `outline` |
| Skip link implementation | Low | Present but may not work in all browsers |
| Keyboard navigation for carousel | Medium | Hero carousel arrow buttons not focusable when hidden |
| Form fields missing labels when using placeholders only | High | Checkout page, reservation form |
| Touch target size (< 44px) | Medium | Quantity selector buttons (24px), content filter chips |

## 5. Mobile Responsiveness Issues

| Issue | Location |
|-------|----------|
| Menu category tabs overflow hidden | Menu page (`.scrollbar-none` without horizontal scroll hint) |
| Cart drawer takes full width on all screens | Good — proper sm:w-[420px] |
| Checkout grid collapses properly | Good — lg:grid-cols-3 → 1 column |
| Hero text wraps well | Good — responsive font sizes |
| Footer stacks well | Good — grid → 1 column |
| Gallery grid responsive | Good — 2 → 3 → 4 columns |
| Reservation form OK | Good — responsive |
| **Missing**: Bottom navigation bar for mobile | Common pattern for restaurant apps |
| **Missing**: Touch-friendly filter controls | Filter buttons too small on mobile |

## 6. Performance Bottlenecks

| Issue | Impact | Fix |
|-------|--------|-----|
| `<img>` instead of `next/image` | High — missing optimization, lazy loading prioritization | Replace with `Image` component |
| Google Fonts via `<link>` | Medium — render-blocking external request | Use `next/font` |
| No React.Suspense boundaries | Medium — no streaming SSR | Add `<Suspense>` around heavy sections |
| No TanStack Query caching | Medium — no cache layer, refetch on every mount | Wrap API calls with `useQuery` |
| No code splitting | Low — page-level code splitting is default in Next.js | OK |
| Large hero images | Medium — no responsive srcset | Use `next/image` with `sizes` attribute |
| No prefetching | Low — Next.js auto-prefetches links | OK |

## 7. SEO Completeness

| Feature | Status |
|---------|--------|
| Dynamic metadata | ✅ Good — template-based titles |
| Open Graph | ✅ Present |
| Twitter Cards | ✅ Present |
| JSON-LD Schema | ✅ Present (Restaurant schema) |
| Sitemap | ❌ Missing |
| Robots.txt | ❌ Missing |
| Canonical URLs | ⚠️ Not explicitly set on all pages |
| Breadcrumbs | ⚠️ Only on menu item page |
| Semantic HTML | ⚠️ Some `<div>` could be `<section>`, `<article>`, `<nav>` |
| Heading hierarchy | ⚠️ H1 → H2 → H3 generally good, but some pages skip levels |

## 8. Empty / Loading / Error States

| State | Coverage |
|-------|----------|
| Loading (skeleton) | ⚠️ Present on home, menu, gallery pages. Missing on checkout, offers, profile |
| Empty state | ⚠️ Present in cart, menu (no results). Missing in order history, reservations list |
| Error state | ⚠️ Only global error.tsx. Missing page-level error boundaries |
| Network offline | ❌ No offline notification or PWA offline page |
| 404 page | ⚠️ Exists but outdated (old layout) |
| Form validation errors | ❌ No react-hook-form validation in checkout or reservation |

## 9. Trust Signals Audit

| Signal | Status |
|--------|--------|
| Customer reviews/testimonials | ✅ Present on home page |
| Rating display | ✅ Present (stars + count) |
| Awards & recognition | ✅ Present on about page |
| Secure payment badges | ❌ Missing |
| SSL/security indicators | ❌ Missing |
| FSSAI/GST/food safety | ❌ Missing (important for Indian restaurants) |
| Delivery guarantees | ❌ Missing |
| Money-back promises | ❌ Missing |
| Social proof (order counts) | ✅ Present (stats counter on home page) |

## 10. Conversion Optimization

| Element | Status |
|---------|--------|
| Hero CTA clarity | ✅ Good — clear "Explore Menu", "Reserve a Table" |
| Cart visibility | ✅ Floating cart bar |
| Checkout flow steps | ❌ No progress indicator |
| Guest checkout | ✅ Supported |
| Coupon application | ✅ Supported |
| Urgency (Limited time) | ⚠️ Present on Today's Special but missing countdown timers |
| Social proof during checkout | ❌ "X people are ordering" widget missing |
| Exit-intent popups | ❌ Not implemented |
| Abandoned cart recovery | ❌ Not implemented |

## 11. Multi-tenant CMS Readiness

| Requirement | Status |
|-------------|--------|
| All data from mock API layer | ✅ Good — api.ts acts as data layer |
| Sections map to CMS blocks | ⚠️ Partial — home page sections not easily togglable |
| Theme colors from CSS variables | ✅ Good — all colors use CSS variables |
| Images from configurable URLs | ⚠️ Hardcoded in mock-data.ts, not from API |
| Content text from API | ⚠️ Hardcoded in components (e.g., "Why Choose Us" section) |
| Component-level enable/disable | ❌ Not implemented — no feature flags |
| SEO fields from API | ⚠️ Static in layout.tsx, not dynamic per tenant |

## Priority Fixes Required

1. **Critical**: Create remaining 25+ missing pages
2. **High**: Replace `<img>` with `next/image` + use `next/font`
3. **High**: Reactify cart store getters for reactivity
4. **High**: Add form validation with react-hook-form + zod
5. **Medium**: Add framer-motion animations
6. **Medium**: Add floating WhatsApp + scroll-to-top
7. **Medium**: Create sitemap.ts + robots.ts
8. **Medium**: Add trust signals (payment badges, FSSAI)
9. **Medium**: Implement proper loading/empty/error states everywhere
10. **Low**: Add countdown timers to offers
11. **Low**: Add bottom navigation bar for mobile
12. **Low**: Add TanStack Query for caching

## Audit Methodology

This audit was performed against:
- WCAG 2.2 AA accessibility guidelines
- Core Web Vitals (LCP, FID, CLS) best practices
- Material Design 3 / Shadcn UI component standards
- Enterprise SaaS patterns (Shopify, Toast, Squarespace)
- Indian restaurant industry UX conventions (Zomato, Swiggy)
- Next.js 15 App Router performance patterns
