# Printer Integration

## Overview

NexaROS supports thermal receipt printers, kitchen printers, and standard printers via ESC/POS protocol.

## Printer Types

| Type | Usage | Protocol |
|------|-------|----------|
| Thermal Receipt | Customer receipts | ESC/POS |
| Kitchen Printer | KOT printing | ESC/POS |
| Standard Printer | Reports, invoices | PDF/HTML |

## ESC/POS Protocol

### Commands

| Command | Description |
|---------|-------------|
| `INIT` | Initialize printer |
| `CUT` | Cut paper |
| `BOLD` | Enable bold |
| `NORMAL` | Disable bold |
| `CENTER` | Center align |
| `LEFT` | Left align |
| `RIGHT` | Right align |
| `LINE_FEED` | New line |

### Receipt Format

```typescript
interface Receipt {
  header: {
    logo: Buffer;
    name: string;
    address: string;
    phone: string;
  };
  body: {
    orderNumber: string;
    tableNumber: string;
    items: ReceiptItem[];
    subtotal: number;
    tax: number;
    total: number;
  };
  footer: {
    thankYouMessage: string;
    qrCode: Buffer;
  };
}
```

## Printer Service

```typescript
@Injectable()
export class PrinterService {
  // Print receipt
  async printReceipt(orderId: string, printerId: string);
  
  // Print KOT
  async printKOT(orderId: string, printerId: string);
  
  // Print report
  async printReport(reportId: string, printerId: string);
  
  // Get available printers
  async getPrinters(tenantId: string);
}
```

## Flutter Printer Integration

### Printer Service

```dart
class PrinterService {
  // Discover printers
  Future<List<Printer>> discoverPrinters();
  
  // Connect to printer
  Future<void> connect(Printer printer);
  
  // Print receipt
  Future<void> printReceipt(Receipt receipt);
  
  // Print KOT
  Future<void> printKOT(KOT kot);
  
  // Check printer status
  Future<PrinterStatus> getStatus();
}
```

### Bluetooth Printing

```dart
class BluetoothPrinter {
  // Scan for Bluetooth printers
  Future<List<Printer>> scan();
  
  // Pair with printer
  Future<void> pair(Printer printer);
  
  // Send data
  Future<void> send(List<int> data);
}
```

### USB Printing

```dart
class USBPrinter {
  // Discover USB printers
  Future<List<Printer>> discover();
  
  // Open connection
  Future<void> open(Printer printer);
  
  // Write data
  Future<void> write(List<int> data);
  
  // Close connection
  Future<void> close();
}
```

## Receipt Templates

### Standard Receipt

```
┌─────────────────────────────┐
│       [Restaurant Logo]     │
│      Restaurant Name        │
│   Address, City, Phone      │
├─────────────────────────────┤
│ Order #: 12345              │
│ Table: 5                    │
│ Date: 2024-01-15 12:30      │
├─────────────────────────────┤
│ 1x Burger          ₹200     │
│ 1x Fries            ₹80     │
│ 1x Coke             ₹40     │
├─────────────────────────────┤
│ Subtotal:          ₹320     │
│ Tax (5%):           ₹16     │
│ Total:             ₹336     │
├─────────────────────────────┤
│ Payment: Cash       ₹336    │
│ Thank you for dining!       │
│ [QR Code]                   │
└─────────────────────────────┘
```

### KOT Format

```
┌─────────────────────────────┐
│ KOT #12345                  │
│ Table: 5                    │
│ Time: 12:30                 │
├─────────────────────────────┤
│ 1x Burger          [NUTS]   │
│ 1x Fries                    │
│ 1x Coke                     │
├─────────────────────────────┤
│ Special: No onions          │
└─────────────────────────────┘
```

## Printer Configuration

```typescript
interface PrinterConfig {
  name: string;
  type: 'thermal' | 'kitchen' | 'standard';
  connection: 'usb' | 'bluetooth' | 'network';
  address: string;
  paperWidth: number; // 58mm or 80mm
  autoCut: boolean;
  cashDrawer: boolean;
}
```

## Error Handling

```dart
class PrinterError {
  // Paper out
  // Cover open
  // Low battery
  // Connection lost
  // Print head error
}
```

## Related Documents

- [Modules](08_MODULES.md)
- [Flutter App](32_FLUTTER_APP.md)
- [Hardware Setup](47_HARDWARE.md)
