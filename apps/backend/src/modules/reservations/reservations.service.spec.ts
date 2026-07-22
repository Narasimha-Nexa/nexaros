import { Test, TestingModule } from '@nestjs/testing';
import { ReservationsService } from './reservations.service';
import { PrismaService } from '../../prisma/prisma.service';
import { EventBusService } from '../../common/event-bus/event-bus.service';
import { NotFoundException, BadRequestException } from '@nestjs/common';

describe('ReservationsService', () => {
  let service: ReservationsService;
  let prisma: jest.Mocked<PrismaService>;
  let eventBus: jest.Mocked<EventBusService>;

  const mockReservation = {
    id: 'res-1',
    tenantId: 'tenant-1',
    customerName: 'John Doe',
    customerPhone: '+911234567890',
    date: new Date('2026-07-13T00:00:00.000Z'),
    time: '19:00',
    guestCount: 4,
    tableId: 'table-1',
    notes: null,
    status: 'CONFIRMED',
    createdAt: new Date(),
    updatedAt: new Date(),
    table: {
      id: 'table-1',
      number: 5,
      name: 'Table 5',
      capacity: 4,
    },
  };

  const mockPrisma = {
    reservation: {
      findMany: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    restaurantTable: {
      update: jest.fn(),
    },
  };

  const mockEventBus = {
    emitToTenant: jest.fn(),
    reservationCreated: jest.fn(),
    reservationUpdated: jest.fn(),
    reservationDeleted: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ReservationsService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: EventBusService, useValue: mockEventBus },
      ],
    }).compile();

    service = module.get<ReservationsService>(ReservationsService);
    prisma = module.get(PrismaService) as jest.Mocked<PrismaService>;
    eventBus = module.get(EventBusService) as jest.Mocked<EventBusService>;
  });

  describe('findAll', () => {
    it('should return reservations for tenant', async () => {
      mockPrisma.reservation.findMany.mockResolvedValue([mockReservation]);

      const result = await service.findAll('tenant-1', {});

      expect(result).toHaveLength(1);
      expect(mockPrisma.reservation.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: expect.objectContaining({ tenantId: 'tenant-1' }) }),
      );
    });

    it('should filter by date when provided', async () => {
      mockPrisma.reservation.findMany.mockResolvedValue([]);

      await service.findAll('tenant-1', { date: '2026-07-13' });

      expect(mockPrisma.reservation.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            tenantId: 'tenant-1',
            date: { gte: expect.any(Date), lte: expect.any(Date) },
          }),
        }),
      );
    });

    it('should filter by status when provided', async () => {
      mockPrisma.reservation.findMany.mockResolvedValue([]);

      await service.findAll('tenant-1', { status: 'CONFIRMED' });

      expect(mockPrisma.reservation.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ tenantId: 'tenant-1', status: 'CONFIRMED' }),
        }),
      );
    });

    it('should filter by branchId when provided', async () => {
      mockPrisma.reservation.findMany.mockResolvedValue([]);

      await service.findAll('tenant-1', { branchId: 'branch-1' });

      expect(mockPrisma.reservation.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            tenantId: 'tenant-1',
            table: { branchId: 'branch-1' },
          }),
        }),
      );
    });
  });

  describe('findOne', () => {
    it('should return reservation by id', async () => {
      mockPrisma.reservation.findFirst.mockResolvedValue(mockReservation);

      const result = await service.findOne('res-1', 'tenant-1');

      expect(result).toMatchObject({ id: 'res-1', customerName: 'John Doe' });
    });

    it('should throw NotFoundException when not found', async () => {
      mockPrisma.reservation.findFirst.mockResolvedValue(null);

      await expect(service.findOne('missing', 'tenant-1')).rejects.toThrow(NotFoundException);
    });
  });

  describe('create', () => {
    const createDto = {
      customerName: 'Jane Smith',
      customerPhone: '+919876543210',
      date: '2026-07-13',
      time: '20:00',
      guestCount: 2,
      tableId: 'table-1',
      notes: 'Window seat',
    };

    it('should create reservation with CONFIRMED status', async () => {
      mockPrisma.reservation.findFirst.mockResolvedValue(null);
      mockPrisma.reservation.create.mockResolvedValue({
        ...mockReservation,
        customerName: 'Jane Smith',
      });

      const result = await service.create('tenant-1', createDto);

      expect(result.status).toBe('CONFIRMED');
      expect(mockPrisma.reservation.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            tenantId: 'tenant-1',
            customerName: 'Jane Smith',
            status: 'CONFIRMED',
          }),
        }),
      );
    });

    it('should mark table as RESERVED', async () => {
      mockPrisma.reservation.findFirst.mockResolvedValue(null);
      mockPrisma.reservation.create.mockResolvedValue(mockReservation);

      await service.create('tenant-1', createDto);

      expect(mockPrisma.restaurantTable.update).toHaveBeenCalledWith({
        where: { id: 'table-1' },
        data: { status: 'RESERVED' },
      });
    });

    it('should emit reservation:created event', async () => {
      mockPrisma.reservation.findFirst.mockResolvedValue(null);
      mockPrisma.reservation.create.mockResolvedValue(mockReservation);

      await service.create('tenant-1', createDto);

      expect(mockEventBus.emitToTenant).toHaveBeenCalledWith(
        'tenant-1',
        'reservation:created',
        expect.objectContaining({ customerName: 'John Doe' }),
      );
    });
  });

  describe('create overlap', () => {
    it('should throw BadRequestException when table has overlapping reservation', async () => {
      mockPrisma.reservation.findFirst.mockResolvedValue(mockReservation);

      await expect(
        service.create('tenant-1', {
          customerName: 'Bob',
          customerPhone: '+911111111111',
          date: '2026-07-13',
          time: '19:00',
          guestCount: 2,
          tableId: 'table-1',
        }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('update', () => {
    beforeEach(() => {
      mockPrisma.reservation.findFirst.mockResolvedValue(mockReservation);
    });

    it('should update reservation', async () => {
      mockPrisma.reservation.update.mockResolvedValue({
        ...mockReservation,
        customerName: 'Updated Name',
      });

      const result = await service.update('res-1', 'tenant-1', { customerName: 'Updated Name' });

      expect(result.customerName).toBe('Updated Name');
    });

    it('should free old table and reserve new table when table changes', async () => {
      mockPrisma.reservation.update.mockResolvedValue({
        ...mockReservation,
        tableId: 'table-2',
        table: { ...mockReservation.table, id: 'table-2', number: 6 },
      });

      await service.update('res-1', 'tenant-1', { tableId: 'table-2' });

      expect(mockPrisma.restaurantTable.update).toHaveBeenCalledWith({
        where: { id: 'table-1' },
        data: { status: 'FREE' },
      });
      expect(mockPrisma.restaurantTable.update).toHaveBeenCalledWith({
        where: { id: 'table-2' },
        data: { status: 'RESERVED' },
      });
    });

    it('should mark table as OCCUPIED when status changes to ARRIVED', async () => {
      mockPrisma.reservation.update.mockResolvedValue({
        ...mockReservation,
        status: 'ARRIVED',
      });

      await service.update('res-1', 'tenant-1', { status: 'ARRIVED' as any });

      expect(mockPrisma.restaurantTable.update).toHaveBeenCalledWith({
        where: { id: 'table-1' },
        data: { status: 'OCCUPIED' },
      });
    });
  });

  describe('remove', () => {
    it('should delete reservation and free table', async () => {
      mockPrisma.reservation.findFirst.mockResolvedValue(mockReservation);
      mockPrisma.reservation.delete.mockResolvedValue(mockReservation);

      const result = await service.remove('res-1', 'tenant-1');

      expect(result).toMatchObject({ message: 'Reservation deleted' });
      expect(mockPrisma.restaurantTable.update).toHaveBeenCalledWith({
        where: { id: 'table-1' },
        data: { status: 'FREE' },
      });
      expect(mockPrisma.reservation.delete).toHaveBeenCalledWith({ where: { id: 'res-1' } });
    });

    it('should emit reservation:deleted event', async () => {
      mockPrisma.reservation.findFirst.mockResolvedValue(mockReservation);
      mockPrisma.reservation.delete.mockResolvedValue(mockReservation);

      await service.remove('res-1', 'tenant-1');

      expect(mockEventBus.emitToTenant).toHaveBeenCalledWith('tenant-1', 'reservation:deleted', {
        id: 'res-1',
      });
    });
  });

  describe('getTodayReservations', () => {
    it('should filter by today\'s date range', async () => {
      mockPrisma.reservation.findMany.mockResolvedValue([mockReservation]);

      const result = await service.getTodayReservations('tenant-1');

      expect(result).toHaveLength(1);
      expect(mockPrisma.reservation.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            tenantId: 'tenant-1',
            date: { gte: expect.any(Date), lte: expect.any(Date) },
            status: { not: 'CANCELLED' },
          }),
        }),
      );
    });
  });

  describe('getUpcomingReservations', () => {
    it('should filter by upcoming dates with CONFIRMED or ARRIVED status', async () => {
      mockPrisma.reservation.findMany.mockResolvedValue([mockReservation]);

      const result = await service.getUpcomingReservations('tenant-1', 5);

      expect(result).toHaveLength(1);
      expect(mockPrisma.reservation.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            tenantId: 'tenant-1',
            date: { gte: expect.any(Date) },
            status: { in: ['CONFIRMED', 'ARRIVED'] },
          }),
          take: 5,
        }),
      );
    });
  });
});
