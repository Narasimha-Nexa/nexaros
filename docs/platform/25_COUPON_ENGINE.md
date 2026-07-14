# Coupon Engine

> Detailed source: [apps/backend/src/modules/coupons/](../../apps/backend/src/modules/coupons/)

## Overview

The coupon engine supports festival campaigns, manual discounts, and automated promotions.

## Coupon Types

| Type | Description | Example |
|------|-------------|---------|
| PERCENTAGE | % discount on order | 10% off |
| FIXED | Fixed amount discount | ₹100 off |
| FREE_ITEM | Add free item | Free dessert |
| FREE_DELIVERY | Waive delivery charge | Free delivery |
| BUY_X_GET_Y | Buy X get Y free | Buy 2 Get 1 |

## Coupon Model

```typescript
Coupon {
  id: string
  code: string
  type: CouponType
  value: number
  minOrderAmount: number
  maxDiscount: number
  maxUses: number
  usedCount: number
  validFrom: Date
  validUntil: Date
  isActive: boolean
  applicablePlans: string[]
  applicableBranches: string[]
  festivalName: string
  metadata: Json
}
```

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/coupons/validate` | Validate coupon code |
| POST | `/coupons` | Create coupon (admin) |
| GET | `/coupons` | List coupons (admin) |
| PUT | `/coupons/:id` | Update coupon (admin) |
| GET | `/coupons/:id/stats` | Usage stats (admin) |
| POST | `/coupons/apply` | Apply coupon (admin) |
| POST | `/coupons/festival-campaign` | Create festival campaign |

## Validation Flow

```
1. User applies coupon code
2. POST /api/coupons/validate
   Body: { code, orderAmount, branchId }

3. Backend checks:
   - Code exists
   - Coupon is active
   - Current date within valid range
   - Order amount meets minimum
   - Usage limit not exceeded
   - Applicable to user's plan
   - Applicable to user's branch

4. Returns: { valid, discount, message }
```

## Festival Campaigns

### Pre-configured Festivals

| Festival | Month | Typical Discount |
|----------|-------|------------------|
| Pongal | January | 15% off |
| Holi | March | 20% off |
| Ugadi | March/April | 10% off |
| Vishu | April | 10% off |
| Ramadan | Varies | 15% off |
| Diwali | October/November | 25% off |
| Christmas | December | 20% off |

### Campaign Creation

```typescript
POST /api/coupons/festival-campaign
Body: {
  festivalName: "Diwali",
  discountType: "PERCENTAGE",
  discountValue: 25,
  minOrderAmount: 500,
  maxDiscount: 500,
  validFrom: "2024-10-20",
  validUntil: "2024-11-05",
  maxUsesPerUser: 2,
  totalMaxUses: 10000
}
```

## Usage Tracking

```typescript
CouponUsage {
  id: string
  couponId: string
  tenantId: string
  orderId: string
  amount: number
  discount: number
  createdAt: Date
}
```

## Admin Analytics

- Total usage count
- Revenue generated
- Average order value with coupon
- Usage by branch
- Usage over time

## Related Documents

- [Coupon Engine](25_COUPON_ENGINE.md)
- [Billing & Subscription](24_BILLING_SUBSCRIPTION.md)
- [Modules](08_MODULES.md)
