# Customer Web Documentation

> Detailed source: [apps/customer-web/](../../apps/customer-web/)

## Overview

Customer-facing web app at app.nexaros.com — 4 routes for online ordering.

## Routes

| Route | Page |
|-------|------|
| `/` | Restaurant page |
| `/menu` | Menu browsing |
| `/order` | Order placement |
| `/track` | Order tracking |

## Features

### Restaurant Page

- Restaurant info
- Operating hours
- Contact details
- Location map

### Menu Browsing

- Category navigation
- Item details
- Images
- Prices
- Add-ons

### Order Placement

- Cart management
- Table selection
- Special instructions
- Payment method

### Order Tracking

- Real-time status
- Estimated time
- Order history

## Tech Stack

- Next.js 15 (App Router)
- Tailwind CSS
- TypeScript
- Public API integration

## Docker

```bash
# Build
docker build -f docker/Dockerfile.customer -t nexaros-customer .

# Run
docker run -p 3001:3001 nexaros-customer
```

## Related Documents

- [Customer Web](33_CUSTOMER_WEB.md)
- [Public API](39_PUBLIC_FACADE.md)
- [E2E Flows](14_E2E_FLOW.md)
