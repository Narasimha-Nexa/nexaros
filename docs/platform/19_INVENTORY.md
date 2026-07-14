# Inventory Management

## Overview

NexaROS tracks inventory levels, manages stock movements, and alerts for low stock.

## Inventory Model

```typescript
InventoryItem {
  id: string
  tenantId: string
  branchId: string
  name: string
  sku: string
  unit: string
  quantity: number
  minStock: number
  maxStock: number
  costPrice: number
  supplierId: string
  lastRestocked: Date
  isActive: boolean
}
```

## Stock Movements

```typescript
StockMovement {
  id: string
  inventoryItemId: string
  type: StockMovementType
  quantity: number
  reference: string
  notes: string
  createdBy: string
  createdAt: Date
}

enum StockMovementType {
  PURCHASE    // Stock in from supplier
  SALE        // Stock out from sale
  ADJUSTMENT  // Manual adjustment
  WASTE       // Waste/expiration
  TRANSFER    // Between branches
}
```

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/inventory` | List inventory items |
| POST | `/inventory` | Create item |
| PATCH | `/inventory/:id` | Update item |
| DELETE | `/inventory/:id` | Delete item |
| POST | `/inventory/:id/adjust` | Adjust stock |
| GET | `/inventory/low-stock` | Low stock alerts |
| GET | `/inventory/movements` | Stock movement history |
| POST | `/inventory/transfer` | Transfer between branches |

## Stock Adjustment Flow

```
1. Staff selects inventory item
2. Enters adjustment quantity (+ or -)
3. Selects reason (waste, count, etc.)
4. Adds notes
5. System updates quantity
6. Creates stock movement record
7. Checks against min/max stock
8. Sends alert if below minimum
```

## Low Stock Alerts

```typescript
// Check low stock
async checkLowStock(tenantId: string, branchId: string) {
  const items = await this.prisma.inventoryItem.findMany({
    where: {
      tenantId,
      branchId,
      quantity: { lte: Prisma.raw('minStock') }
    }
  });
  
  if (items.length > 0) {
    await this.notificationService.sendLowStockAlert(items);
  }
}
```

## Auto-Reorder (Planned)

```typescript
// Future feature
async autoReorder(tenantId: string, branchId: string) {
  const items = await this.getLowStockItems(tenantId, branchId);
  
  for (const item of items) {
    if (item.autoReorder) {
      await this.purchaseService.createReorder(item);
    }
  }
}
```

## Recipe Management

```typescript
// Menu item → Inventory items
RecipeItem {
  id: string
  menuItemId: string
  inventoryItemId: string
  quantity: number
  unit: string
}

// When order is placed, inventory is deducted
async deductInventory(orderId: string) {
  const order = await this.getOrder(orderId);
  
  for (const item of order.items) {
    const recipes = await this.getRecipes(item.menuItemId);
    
    for (const recipe of recipes) {
      await this.inventoryService.deductStock(
        recipe.inventoryItemId,
        recipe.quantity * item.quantity
      );
    }
  }
}
```

## Flutter Inventory UI

### Inventory List

```dart
class InventoryList extends StatelessWidget {
  // Search by name/SKU
  // Filter by category
  // Sort by quantity
  // Color-coded: green (ok), yellow (low), red (critical)
}
```

### Stock Adjustment

```dart
class StockAdjustment extends StatelessWidget {
  // Item details
  // Current quantity
  // Adjustment input
  // Reason selector
  // Notes field
  // Confirm button
}
```

## Related Documents

- [Modules](08_MODULES.md)
- [Reports](32_REPORTS.md)
- [Flutter App](32_FLUTTER_APP.md)
