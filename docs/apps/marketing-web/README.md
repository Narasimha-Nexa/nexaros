# Marketing Website Documentation

> Detailed source: [apps/marketing-web/](../../apps/marketing-web/)

## Overview

NexaROS marketing website at nexaros.com — Next.js 15 with Tailwind CSS, 24 routes.

## Features

### Landing Page (12 Sections)

1. Hero with CTA
2. Features overview
3. How it works
4. Pricing
5. Testimonials
6. Use cases
7. Integration partners
8. Security & compliance
9. Success stories
10. FAQ
11. CTA banner
12. Footer

### Public Pages (24 Routes)

| Route | Page |
|-------|------|
| `/` | Landing page |
| `/about` | About NexaROS |
| `/pricing` | Pricing plans |
| `/contact` | Contact sales |
| `/demo` | Request demo |
| `/features` | Features overview |
| `/solutions` | Industry solutions |
| `/case-studies` | Success stories |
| `/blog` | Blog listing |
| `/blog/[slug]` | Blog post |
| `/docs` | Documentation |
| `/docs/[slug]` | Doc page |
| `/careers` | Careers |
| `/privacy` | Privacy policy |
| `/terms` | Terms of service |
| `/register` | Restaurant registration |
| `/login` | Restaurant login |
| `/checkout` | Subscription checkout |
| `/checkout/success` | Checkout success |
| `/help` | Help center |
| `/support` | Support |
| `/status` | System status |

### Registration Flow

1. Business type (10 options)
2. Restaurant details
3. Owner information
4. Address (Indian states)
5. Password creation
6. Email verification (planned)

### Login Flow

1. Email/password
2. Post-login: "Open NexaROS Flutter App"
3. Download links (Android/iOS)

## Tech Stack

- Next.js 15 (App Router)
- Tailwind CSS
- Custom UI components
- TypeScript
- SEO optimized

## Components

### Shared UI (ui.tsx)

- Button
- Card
- Badge
- Input
- Modal
- Accordion
- Tabs
- Toast
- Navbar
- Footer

### SEO

- `sitemap.ts` — Dynamic sitemap
- `robots.ts` — Robots.txt
- `metadata` — Per-page metadata

## Docker

```bash
# Build
docker build -f docker/Dockerfile.marketing -t nexaros-marketing .

# Run
docker run -p 3002:3002 nexaros-marketing
```

## Related Documents

- [Marketing Website](33_MARKETING_WEBSITE.md)
- [SEO](41_SEO.md)
- [Registration Flow](14_E2E_FLOW.md)
