# Reservations

## Overview

NexaROS manages table reservations with real-time availability tracking.

## Reservation Model

```typescript
Reservation {
  id: string
  tenantId: string
  branchId: string
  tableId: string
  guestName: string
  guestPhone: string
  guestEmail: string
  partySize: number
  date: Date
  time: string
  duration: number
  status: ReservationStatus
  notes: string
  createdBy: string
  createdAt: Date
}

enum ReservationStatus {
  PENDING
  CONFIRMED
  CHECKED_IN
  COMPLETED
  CANCELLED
  NO_SHOW
}
```

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/reservations` | List reservations |
| GET | `/reservations/today` | Today's reservations |
| GET | `/reservations/available` | Check availability |
| POST | `/reservations` | Create reservation |
| PATCH | `/reservations/:id` | Update reservation |
| DELETE | `/reservations/:id` | Cancel reservation |
| PATCH | `/reservations/:id/check-in` | Check in guest |
| PATCH | `/reservations/:id/complete` | Complete reservation |

## Availability Check

```typescript
async checkAvailability(
  tenantId: string,
  branchId: string,
  date: Date,
  time: string,
  partySize: number
): Promise<Table[]> {
  // Find tables with capacity >= partySize
  // Exclude tables with overlapping reservations
  // Return available tables
}
```

## Reservation Flow

```
1. Guest calls or walks in
2. Staff checks availability
3. Staff creates reservation
4. System confirms booking
5. Guest receives confirmation (SMS/email planned)
6. On reservation date:
   - Guest arrives → Check in
   - Guest no-show → Mark as no-show
   - Guest cancels → Cancel reservation
7. After dining → Complete reservation
```

## Table Blocking

```typescript
// Block table for reservation
async blockTable(tableId: string, reservationId: string) {
  await this.prisma.restaurantTable.update({
    where: { id: tableId },
    data: { status: 'RESERVED' }
  });
}
```

## Flutter Reservation UI

### Reservation Calendar

```dart
class ReservationCalendar extends StatelessWidget {
  // Monthly view
  // Day view with time slots
  // Color-coded by status
}
```

### Create Reservation

```dart
class CreateReservation extends StatelessWidget {
  // Guest details
  // Date/time picker
  // Party size
  // Table selection
  // Special requests
}
```

## Related Documents

- [Tables](08_MODULES.md)
- [Flutter App](32_FLUTTER_APP.md)
