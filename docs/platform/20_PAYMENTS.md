# Payments & Invoicing

## Overview

NexaROS supports 6 payment methods with GST-compliant invoicing.

## Payment Model

```typescript
Payment {
  id: string
  orderId: string
  method: PaymentMethod
  amount: number
  status: PaymentStatus
  reference: string
  metadata: Json
  processedAt: Date
}

enum PaymentMethod {
  CASH
  UPI
  CARD
  NET_BANKING
  WALLET
  ONLINE
}

enum PaymentStatus {
  PENDING
  COMPLETED
  FAILED
  REFUNDED
}
```

## Invoice Model

```typescript
Invoice {
  id: string
  paymentId: string
  invoiceNumber: string
  tenantId: string
  branchId: string
  orderId: string
  subtotal: number
  taxRate: number
  taxAmount: number
  serviceCharge: number
  discount: number
  total: number
  items: InvoiceItem[]
  createdAt: Date
}

interface InvoiceItem {
  name: string
  quantity: number
  unitPrice: number
  total: number
  taxRate: number
}
```

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/payments/orders/:orderId` | Process payment |
| GET | `/payments/orders/:orderId` | Get order payments |
| POST | `/payments/:id/refund` | Process refund |
| POST | `/invoices/payments/:paymentId` | Generate invoice |
| GET | `/invoices` | List invoices |
| GET | `/invoices/:id/pdf` | Get invoice PDF |
| GET | `/invoices/:id` | Get invoice details |

## Payment Flow

```
1. Order is ready for payment
2. Staff selects payment method
3. System processes payment:
   - Cash: Record payment
   - UPI: Generate QR code
   - Card: Process via gateway
   - Online: Redirect to gateway
4. Payment status updated
5. Invoice generated
6. Receipt printed
7. Table status → FREE
```

## GST Invoice

### Invoice Structure

```
┌─────────────────────────────────────┐
│       [Restaurant Logo]             │
│      Restaurant Name                │
│   GSTIN: XXXXXXXXXXXXXXX           │
│   Address, City, State              │
├─────────────────────────────────────┤
│ Invoice #: INV-2024-001             │
│ Date: 2024-01-15 12:30             │
│ Table: 5                            │
├─────────────────────────────────────┤
│ 1x Burger          ₹200.00         │
│ 1x Fries            ₹80.00         │
│ 1x Coke             ₹40.00         │
├─────────────────────────────────────┤
│ Subtotal:          ₹320.00         │
│ CGST (2.5%):         ₹8.00         │
│ SGST (2.5%):         ₹8.00         │
│ Service (10%):      ₹32.00         │
│ Total:             ₹368.00         │
├─────────────────────────────────────┤
│ Payment: Cash       ₹368.00        │
│ Thank you for dining!               │
│ [QR Code]                           │
└─────────────────────────────────────┘
```

### GST Calculation

```typescript
async calculateGST(invoice: Invoice) {
  const cgstRate = invoice.taxRate / 2;
  const sgstRate = invoice.taxRate / 2;
  
  invoice.cgstAmount = invoice.subtotal * (cgstRate / 100);
  invoice.sgstAmount = invoice.subtotal * (sgstRate / 100);
  invoice.totalTax = invoice.cgstAmount + invoice.sgstAmount;
  invoice.total = invoice.subtotal + invoice.totalTax + invoice.serviceCharge;
}
```

## Refund Flow

```
1. Customer requests refund
2. Staff initiates refund
3. System processes refund:
   - Cash: Manual refund
   - UPI/Card: Gateway refund
4. Refund status updated
5. Invoice updated
6. Inventory adjusted (if needed)
```

## Flutter Payment UI

### Payment Screen

```dart
class PaymentScreen extends StatelessWidget {
  // Order summary
  // Payment method selection
  // Amount input
  // Process button
  // Receipt preview
}
```

### UPI QR Code

```dart
class UPIQRCode extends StatelessWidget {
  // UPI ID
  // Amount
  // QR code display
  // Auto-refresh
}
```

## Related Documents

- [Modules](08_MODULES.md)
- [API Documentation](21_API_DOCUMENTATION.md)
- [Flutter App](32_FLUTTER_APP.md)
