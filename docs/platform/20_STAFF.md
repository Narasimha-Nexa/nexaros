# Staff Management

## Overview

NexaROS manages staff profiles, shifts, attendance, and clock in/out.

## Staff Model

```typescript
Staff {
  id: string
  tenantId: string
  branchId: string
  name: string
  phone: string
  email: string
  pin: string
  role: string
  isActive: boolean
  hireDate: Date
  emergencyContact: string
  documents: Json
}
```

## Shift Model

```typescript
Shift {
  id: string
  tenantId: string
  branchId: string
  name: string
  startTime: string
  endTime: string
  isActive: boolean
}

StaffShift {
  id: string
  staffId: string
  shiftId: string
  date: Date
  status: ShiftStatus
}

enum ShiftStatus {
  SCHEDULED
  CHECKED_IN
  CHECKED_OUT
  ABSENT
  ON_LEAVE
}
```

## Attendance Model

```typescript
Attendance {
  id: string
  staffId: string
  date: Date
  checkIn: Date
  checkOut: Date
  status: AttendanceStatus
  notes: string
}

enum AttendanceStatus {
  PRESENT
  ABSENT
  LATE
  HALF_DAY
  ON_LEAVE
}
```

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/staff` | List staff |
| POST | `/staff` | Create staff |
| PATCH | `/staff/:id` | Update staff |
| DELETE | `/staff/:id` | Delete staff |
| POST | `/staff/:id/clock-in` | Clock in |
| POST | `/staff/:id/clock-out` | Clock out |
| GET | `/staff/:id/attendance` | Get attendance |
| GET | `/staff/attendance` | List attendance |
| GET | `/staff/shifts` | List shifts |
| POST | `/staff/shifts` | Create shift |
| POST | `/staff/:id/assign-shift` | Assign shift |

## Clock In/Out Flow

### Clock In

```
1. Staff enters PIN
2. System validates PIN
3. System checks existing clock-in
4. Creates attendance record
5. Updates staff shift status
6. Logs timestamp
```

### Clock Out

```
1. Staff enters PIN
2. System validates PIN
3. Finds active attendance
4. Updates check-out time
5. Calculates hours worked
6. Updates shift status
```

## PIN-Based Authentication

```typescript
// Staff PIN validation
async validatePin(staffId: string, pin: string): Promise<boolean> {
  const staff = await this.prisma.staff.findUnique({
    where: { id: staffId }
  });
  
  return staff.pin === pin; // In production, hash and compare
}
```

## Shift Management

### Create Shift

```typescript
async createShift(tenantId: string, createShiftDto: CreateShiftDto) {
  return this.prisma.shift.create({
    data: {
      tenantId,
      name: createShiftDto.name,
      startTime: createShiftDto.startTime,
      endTime: createShiftDto.endTime,
    }
  });
}
```

### Assign Shift

```typescript
async assignShift(staffId: string, shiftId: string, date: Date) {
  return this.prisma.staffShift.create({
    data: {
      staffId,
      shiftId,
      date,
      status: 'SCHEDULED'
    }
  });
}
```

## Flutter Staff UI

### Staff List

```dart
class StaffList extends StatelessWidget {
  // List of staff
  // Filter by role
  // Filter by status
  // Search by name
}
```

### Clock In/Out

```dart
class ClockInOut extends StatelessWidget {
  // PIN input
  // Clock in/out button
  // Current status
  // Today's hours
}
```

### Shift Calendar

```dart
class ShiftCalendar extends StatelessWidget {
  // Monthly calendar
  // Shift assignments
  // Drag to assign
  // Color-coded by shift
}
```

## Staff Reports

- Attendance summary
- Hours worked
- Shift coverage
- Overtime tracking

## Related Documents

- [Modules](08_MODULES.md)
- [Reports](32_REPORTS.md)
- [Flutter App](32_FLUTTER_APP.md)
