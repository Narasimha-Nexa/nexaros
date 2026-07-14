# Public Facade (Customer-Facing)

## Overview

The Public API provides customer-facing endpoints for online ordering and table booking.

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/public/restaurant/:slug` | Get restaurant info |
| GET | `/public/restaurant/:slug/menu` | Get restaurant menu |
| GET | `/public/restaurant/:slug/tables` | Get table availability |
| POST | `/public/orders` | Place customer order |
| GET | `/public/orders/:id` | Track order |
| POST | `/public/reservations` | Make reservation |

## Restaurant Info

```typescript
async getRestaurant(slug: string) {
  return this.prisma.tenant.findUnique({
    where: { slug },
    select: {
      name: true,
      logo: true,
      address: true,
      phone: true,
      operatingHours: true,
    }
  });
}
```

## Public Menu

```typescript
async getMenu(slug: string) {
  const tenant = await this.prisma.tenant.findUnique({
    where: { slug }
  });
  
  return this.prisma.menuItem.findMany({
    where: {
      tenantId: tenant.id,
      isAvailable: true
    },
    include: {
      category: true,
      images: true,
      variants: true,
      addOns: true
    }
  });
}
```

## Public Order Flow

```
1. Customer visits restaurant page
2. Customer browses menu
3. Customer adds items to cart
4. Customer enters table number
5. Customer places order
6. System creates order
7. System notifies kitchen
8. Customer tracks order status
```

## Rate Limiting

```typescript
// Public endpoints have stricter rate limits
@UseGuards(PublicRateLimitGuard)
@Controller('public')
export class PublicController {
  @Get('restaurant/:slug')
  async getRestaurant(@Param('slug') slug: string) {
    // 30 requests per minute
  }
}
```

## Customer Web Integration

```typescript
// Customer web app (app.nexaros.com)
// Uses public API endpoints
// No authentication required
// Read-only access to restaurant data
```

## Related Documents

- [Customer Web](33_CUSTOMER_WEB.md)
- [API Documentation](21_API_DOCUMENTATION.md)
- [Modules](08_MODULES.md)
