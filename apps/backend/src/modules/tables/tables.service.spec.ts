import { Test, TestingModule } from '@nestjs/testing';
import { TablesService } from './tables.service';
import { PrismaService } from '../../prisma/prisma.service';
import { EventBusService } from '../../common/event-bus/event-bus.service';
import { NotFoundException } from '@nestjs/common';

describe('TablesService', () => {
  let service: TablesService;
  let prisma: jest.Mocked<PrismaService>;
  let eventBus: jest.Mocked<EventBusService>;

  const mockTable = {
    id: 'table-1',
    branchId: 'branch-1',
    number: 5,
    name: 'Table 5',
    capacity: 4,
    status: 'FREE',
    qrCode: null,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockPrisma = {
    restaurantTable: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    branch: {
      findFirst: jest.fn().mockResolvedValue({ id: 'branch-1', tenantId: 'tenant-1', isActive: true }),
    },
  };

  const mockEventBus = {
    emitToBranch: jest.fn(),
    emitToTenant: jest.fn(),
    tableStatusChanged: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TablesService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: EventBusService, useValue: mockEventBus },
      ],
    }).compile();

    service = module.get<TablesService>(TablesService);
    prisma = module.get(PrismaService) as jest.Mocked<PrismaService>;
    eventBus = module.get(EventBusService) as jest.Mocked<EventBusService>;
  });

  describe('findAll', () => {
    it('should return tables for a branch with active orders and reservations', async () => {
      mockPrisma.restaurantTable.findMany.mockResolvedValue([mockTable]);

      const result = await service.findAll('branch-1', 'tenant-1');

      expect(result).toHaveLength(1);
      expect(mockPrisma.restaurantTable.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: { branchId: 'branch-1' } }),
      );
    });
  });

  describe('findOne', () => {
    it('should return table when found', async () => {
      mockPrisma.restaurantTable.findFirst.mockResolvedValue({ ...mockTable, branch: { id: 'branch-1', tenantId: 'tenant-1' } });
      mockPrisma.restaurantTable.findUnique.mockResolvedValue(mockTable);

      const result = await service.findOne('table-1', 'tenant-1');

      expect(result).toMatchObject({ number: 5, status: 'FREE' });
    });

    it('should throw NotFoundException when table not found', async () => {
      mockPrisma.restaurantTable.findFirst.mockResolvedValue(null);

      await expect(service.findOne('missing', 'tenant-1')).rejects.toThrow(NotFoundException);
    });
  });

  describe('create', () => {
    it('should create a new table', async () => {
      mockPrisma.restaurantTable.create.mockResolvedValue(mockTable);

      const result = await service.create('branch-1', { number: 5, capacity: 4 }, 'tenant-1');

      expect(result).toMatchObject({ number: 5 });
      expect(mockPrisma.restaurantTable.create).toHaveBeenCalledWith({
        data: { number: 5, capacity: 4, branchId: 'branch-1' },
      });
    });
  });

  describe('update', () => {
    it('should update table details', async () => {
      mockPrisma.restaurantTable.findFirst.mockResolvedValue({ ...mockTable, branch: { id: 'branch-1', tenantId: 'tenant-1' } });
      mockPrisma.restaurantTable.update.mockResolvedValue({ ...mockTable, capacity: 6 });

      const result = await service.update('table-1', { capacity: 6 }, 'tenant-1');

      expect(result.capacity).toBe(6);
    });

    it('should throw NotFoundException when table not found', async () => {
      mockPrisma.restaurantTable.findFirst.mockResolvedValue(null);

      await expect(service.update('missing', { name: 'New' }, 'tenant-1')).rejects.toThrow(NotFoundException);
    });
  });

  describe('updateStatus', () => {
    it('should update table status and emit event', async () => {
      mockPrisma.restaurantTable.findFirst.mockResolvedValue({ ...mockTable, branch: { id: 'branch-1', tenantId: 'tenant-1' } });
      mockPrisma.restaurantTable.update.mockResolvedValue({ ...mockTable, status: 'OCCUPIED' });

      const result = await service.updateStatus('table-1', 'OCCUPIED', 'tenant-1');

      expect(result.status).toBe('OCCUPIED');
      expect(mockEventBus.emitToBranch).toHaveBeenCalledWith(
        'branch-1',
        'table:status-changed',
        expect.objectContaining({ tableId: 'table-1', status: 'OCCUPIED' }),
      );
    });
  });

  describe('generateQrCode', () => {
    it('should generate a QR code URL for the table', async () => {
      mockPrisma.restaurantTable.findFirst.mockResolvedValue({ ...mockTable, branch: { id: 'branch-1', tenantId: 'tenant-1' } });
      mockPrisma.restaurantTable.update.mockResolvedValue({
        ...mockTable,
        qrCode: 'http://localhost:3000/order/branch-1/table-1?token=abc',
      });

      const result = await service.generateQrCode('table-1', 'tenant-1');

      expect(result).toHaveProperty('qrCode');
      expect(result.qrCode).toContain('/order/');
      expect(mockPrisma.restaurantTable.update).toHaveBeenCalledWith(
        expect.objectContaining({ where: { id: 'table-1' } }),
      );
    });

    it('should throw NotFoundException when table not found', async () => {
      mockPrisma.restaurantTable.findFirst.mockResolvedValue(null);

      await expect(service.generateQrCode('missing', 'tenant-1')).rejects.toThrow(NotFoundException);
    });
  });

  describe('remove', () => {
    it('should delete the table', async () => {
      mockPrisma.restaurantTable.findFirst.mockResolvedValue({ ...mockTable, branch: { id: 'branch-1', tenantId: 'tenant-1' } });
      mockPrisma.restaurantTable.delete.mockResolvedValue(mockTable);

      const result = await service.remove('table-1', 'tenant-1');

      expect(result).toMatchObject({ id: 'table-1' });
    });
  });

  describe('getFloorPlan', () => {
    it('should return tables with status summary', async () => {
      mockPrisma.restaurantTable.findMany.mockResolvedValue([
        mockTable,
        { ...mockTable, id: 'table-2', number: 6, status: 'OCCUPIED' },
      ]);

      const result = await service.getFloorPlan('branch-1', 'tenant-1');

      expect(result.tables).toHaveLength(2);
      expect(result.summary).toMatchObject({
        total: 2,
        free: 1,
        occupied: 1,
        reserved: 0,
      });
    });
  });
});
