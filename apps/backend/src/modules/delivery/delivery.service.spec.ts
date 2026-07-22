import { Test, TestingModule } from '@nestjs/testing';
import { DeliveryService } from './delivery.service';
import { PrismaService } from '../../prisma/prisma.service';
import { EventBusService } from '../../common/event-bus/event-bus.service';
import { NotFoundException, BadRequestException } from '@nestjs/common';

describe('DeliveryService', () => {
  let service: DeliveryService;
  let prisma: jest.Mocked<PrismaService>;
  let eventBus: jest.Mocked<EventBusService>;

  const mockPartner = {
    id: 'partner-1',
    tenantId: 'tenant-1',
    branchId: 'branch-1',
    name: 'John Doe',
    phone: '1234567890',
    email: 'john@example.com',
    vehicleType: 'BIKE',
    licensePlate: 'AB-123',
    isActive: true,
    latitude: null,
    longitude: null,
    totalDeliveries: 0,
    deletedAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockDelivery = {
    id: 'delivery-1',
    orderId: 'order-1',
    branchId: 'branch-1',
    partnerId: null,
    status: 'PENDING',
    customerName: 'Jane Doe',
    customerPhone: '9876543210',
    customerAddress: '123 Main St',
    customerLat: null,
    customerLng: null,
    assignedAt: null,
    pickedUpAt: null,
    deliveredAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockOrder = {
    id: 'order-1',
    orderNumber: 'ORD-001',
    customerName: 'Jane Doe',
    customerPhone: '9876543210',
    totalAmount: 2500,
    type: 'DELIVERY',
  };

  const mockPrisma = {
    deliveryPartner: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      count: jest.fn(),
    },
    delivery: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      count: jest.fn(),
    },
    deliveryLocation: {
      findMany: jest.fn(),
      create: jest.fn(),
    },
    order: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
    },
  };

  const mockEventBus = {
    emitToBranch: jest.fn(),
    emitToTenant: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DeliveryService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: EventBusService, useValue: mockEventBus },
      ],
    }).compile();

    service = module.get<DeliveryService>(DeliveryService);
    prisma = module.get(PrismaService) as jest.Mocked<PrismaService>;
    eventBus = module.get(EventBusService) as jest.Mocked<EventBusService>;
  });

  describe('createPartner', () => {
    it('should create a delivery partner', async () => {
      mockPrisma.deliveryPartner.create.mockResolvedValue(mockPartner);

      const result = await service.createPartner({
        tenantId: 'tenant-1',
        name: 'John Doe',
        phone: '1234567890',
        email: 'john@example.com',
        vehicleType: 'BIKE',
        licensePlate: 'AB-123',
        branchId: 'branch-1',
      });

      expect(result).toMatchObject({ name: 'John Doe' });
      expect(mockPrisma.deliveryPartner.create).toHaveBeenCalledWith({
        data: {
          tenantId: 'tenant-1',
          branchId: 'branch-1',
          name: 'John Doe',
          phone: '1234567890',
          email: 'john@example.com',
          vehicleType: 'BIKE',
          licensePlate: 'AB-123',
        },
      });
    });
  });

  describe('findAllPartners', () => {
    it('should return all partners for a tenant', async () => {
      mockPrisma.deliveryPartner.findMany.mockResolvedValue([mockPartner]);

      const result = await service.findAllPartners('tenant-1');

      expect(result).toHaveLength(1);
      expect(mockPrisma.deliveryPartner.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: { tenantId: 'tenant-1', deletedAt: null } }),
      );
    });

    it('should filter partners by branch', async () => {
      mockPrisma.deliveryPartner.findMany.mockResolvedValue([mockPartner]);

      const result = await service.findAllPartners('tenant-1', 'branch-1');

      expect(result).toHaveLength(1);
      expect(mockPrisma.deliveryPartner.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { tenantId: 'tenant-1', branchId: 'branch-1', deletedAt: null },
        }),
      );
    });
  });

  describe('findPartner', () => {
    it('should return a partner when found', async () => {
      mockPrisma.deliveryPartner.findFirst.mockResolvedValue(mockPartner);

      const result = await service.findPartner('partner-1', 'tenant-1');

      expect(result).toMatchObject({ name: 'John Doe' });
    });

    it('should throw NotFoundException when partner not found', async () => {
      mockPrisma.deliveryPartner.findFirst.mockResolvedValue(null);

      await expect(service.findPartner('missing', 'tenant-1')).rejects.toThrow(NotFoundException);
    });

    it('should throw NotFoundException when partner is soft-deleted', async () => {
      mockPrisma.deliveryPartner.findFirst.mockResolvedValue(null);

      await expect(service.findPartner('partner-1', 'tenant-1')).rejects.toThrow(NotFoundException);
    });
  });

  describe('updatePartner', () => {
    it('should update a partner', async () => {
      mockPrisma.deliveryPartner.findFirst.mockResolvedValue(mockPartner);
      mockPrisma.deliveryPartner.update.mockResolvedValue({ ...mockPartner, name: 'Jane Doe' });

      const result = await service.updatePartner('partner-1', 'tenant-1', { name: 'Jane Doe' });

      expect(result.name).toBe('Jane Doe');
    });

    it('should throw NotFoundException when partner not found', async () => {
      mockPrisma.deliveryPartner.findFirst.mockResolvedValue(null);

      await expect(service.updatePartner('missing', 'tenant-1', { name: 'New' })).rejects.toThrow(NotFoundException);
    });
  });

  describe('deletePartner', () => {
    it('should soft-delete a partner', async () => {
      mockPrisma.deliveryPartner.findFirst.mockResolvedValue(mockPartner);
      mockPrisma.deliveryPartner.update.mockResolvedValue({ ...mockPartner, isActive: false, deletedAt: new Date() });

      const result = await service.deletePartner('partner-1', 'tenant-1');

      expect(result.isActive).toBe(false);
      expect(result.deletedAt).toBeDefined();
      expect(mockPrisma.deliveryPartner.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'partner-1' },
          data: { isActive: false, deletedAt: expect.any(Date) },
        }),
      );
    });

    it('should throw NotFoundException when partner not found', async () => {
      mockPrisma.deliveryPartner.findFirst.mockResolvedValue(null);

      await expect(service.deletePartner('missing', 'tenant-1')).rejects.toThrow(NotFoundException);
    });
  });

  describe('assignDelivery', () => {
    it('should assign delivery to a partner and emit event', async () => {
      const updatedDelivery = {
        ...mockDelivery,
        partnerId: 'partner-1',
        status: 'ASSIGNED',
        assignedAt: new Date(),
        partner: mockPartner,
        order: mockOrder,
      };

      mockPrisma.delivery.findUnique.mockResolvedValue(mockDelivery);
      mockPrisma.deliveryPartner.findUnique.mockResolvedValue(mockPartner);
      mockPrisma.delivery.update.mockResolvedValue(updatedDelivery);
      mockPrisma.deliveryPartner.update.mockResolvedValue(mockPartner);

      const result = await service.assignDelivery('delivery-1', 'partner-1');

      expect(result.status).toBe('ASSIGNED');
      expect(result.partnerId).toBe('partner-1');
      expect(mockPrisma.deliveryPartner.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'partner-1' },
          data: { totalDeliveries: { increment: 1 } },
        }),
      );
      expect(mockEventBus.emitToBranch).toHaveBeenCalledWith(
        'branch-1',
        'delivery:assigned',
        expect.objectContaining({ deliveryId: 'delivery-1', status: 'ASSIGNED' }),
      );
    });

    it('should throw NotFoundException when delivery not found', async () => {
      mockPrisma.delivery.findUnique.mockResolvedValue(null);

      await expect(service.assignDelivery('missing', 'partner-1')).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException when partner not available', async () => {
      mockPrisma.delivery.findUnique.mockResolvedValue(mockDelivery);
      mockPrisma.deliveryPartner.findUnique.mockResolvedValue({ ...mockPartner, isActive: false });

      await expect(service.assignDelivery('delivery-1', 'partner-1')).rejects.toThrow(BadRequestException);
    });
  });

  describe('updateDeliveryStatus', () => {
    it('should update delivery status and emit event', async () => {
      const updatedDelivery = {
        ...mockDelivery,
        partnerId: 'partner-1',
        status: 'PICKED_UP',
        pickedUpAt: new Date(),
        partner: mockPartner,
        order: { orderNumber: 'ORD-001' },
      };

      mockPrisma.delivery.findUnique.mockResolvedValue(mockDelivery);
      mockPrisma.delivery.update.mockResolvedValue(updatedDelivery);

      const result = await service.updateDeliveryStatus('delivery-1', 'PICKED_UP');

      expect(result.status).toBe('PICKED_UP');
      expect(mockEventBus.emitToBranch).toHaveBeenCalledWith(
        'branch-1',
        'delivery:status-changed',
        expect.objectContaining({ deliveryId: 'delivery-1', status: 'PICKED_UP' }),
      );
    });

    it('should record location when provided', async () => {
      const updatedDelivery = {
        ...mockDelivery,
        status: 'DELIVERED',
        deliveredAt: new Date(),
        partner: mockPartner,
        order: { orderNumber: 'ORD-001' },
      };

      mockPrisma.delivery.findUnique.mockResolvedValue(mockDelivery);
      mockPrisma.delivery.update.mockResolvedValue(updatedDelivery);
      mockPrisma.deliveryLocation.create.mockResolvedValue({ id: 'loc-1', deliveryId: 'delivery-1', latitude: 12.34, longitude: 56.78, timestamp: new Date() });

      const result = await service.updateDeliveryStatus('delivery-1', 'DELIVERED', { lat: 12.34, lng: 56.78 });

      expect(result.status).toBe('DELIVERED');
      expect(mockPrisma.deliveryLocation.create).toHaveBeenCalled();
    });

    it('should throw NotFoundException when delivery not found', async () => {
      mockPrisma.delivery.findUnique.mockResolvedValue(null);

      await expect(service.updateDeliveryStatus('missing', 'DELIVERED')).rejects.toThrow(NotFoundException);
    });
  });

  describe('getDashboardStats', () => {
    it('should return dashboard stats', async () => {
      mockPrisma.delivery.count.mockResolvedValueOnce(3).mockResolvedValueOnce(5).mockResolvedValueOnce(10);
      mockPrisma.deliveryPartner.count.mockResolvedValue(4);

      const result = await service.getDashboardStats('branch-1');

      expect(result).toMatchObject({
        activeCount: 3,
        pendingCount: 5,
        todayCount: 10,
        availablePartners: 4,
      });
    });
  });

  describe('getActiveDeliveries', () => {
    it('should return active deliveries', async () => {
      mockPrisma.delivery.findMany.mockResolvedValue([{ ...mockDelivery, status: 'ASSIGNED', partner: mockPartner, order: mockOrder }]);

      const result = await service.getActiveDeliveries('branch-1');

      expect(result).toHaveLength(1);
      expect(mockPrisma.delivery.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ branchId: 'branch-1' }),
        }),
      );
    });
  });

  describe('getDeliveryHistory', () => {
    it('should return paginated delivery history', async () => {
      const delivered = { ...mockDelivery, status: 'DELIVERED', partner: mockPartner, order: mockOrder };
      mockPrisma.delivery.findMany.mockResolvedValue([delivered]);
      mockPrisma.delivery.count.mockResolvedValue(1);

      const result = await service.getDeliveryHistory('branch-1', 1, 20);

      expect(result.deliveries).toHaveLength(1);
      expect(result.total).toBe(1);
      expect(result.page).toBe(1);
      expect(result.pages).toBe(1);
    });

    it('should apply correct pagination params', async () => {
      mockPrisma.delivery.findMany.mockResolvedValue([]);
      mockPrisma.delivery.count.mockResolvedValue(25);

      const result = await service.getDeliveryHistory('branch-1', 2, 10);

      expect(result.page).toBe(2);
      expect(result.pages).toBe(3);
      expect(mockPrisma.delivery.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ skip: 10, take: 10 }),
      );
    });
  });
});
