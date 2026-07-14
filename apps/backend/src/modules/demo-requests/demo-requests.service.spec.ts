import { Test, TestingModule } from '@nestjs/testing';
import { DemoRequestsService } from './demo-requests.service';
import { PrismaService } from '../../prisma/prisma.service';
import { NotFoundException } from '@nestjs/common';

describe('DemoRequestsService', () => {
  let service: DemoRequestsService;
  let prisma: jest.Mocked<PrismaService>;

  const mockRequest = {
    id: 'demo-1',
    restaurantName: 'Spice Garden',
    contactName: 'Raj Kumar',
    email: 'raj@spicegarden.com',
    phone: '+919876543210',
    city: 'Bangalore',
    state: 'Karnataka',
    status: 'NEW',
    currentPos: 'None',
    message: 'Looking for a modern POS',
    source: 'website',
    assignedTo: null,
    notes: null,
    createdAt: new Date(),
  };

  const mockPrisma = {
    demoRequest: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      count: jest.fn(),
      update: jest.fn(),
    },
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DemoRequestsService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<DemoRequestsService>(DemoRequestsService);
    prisma = module.get(PrismaService) as jest.Mocked<PrismaService>;
  });

  describe('create', () => {
    it('should create a demo request', async () => {
      mockPrisma.demoRequest.create.mockResolvedValue(mockRequest as any);

      const result = await service.create({
        restaurantName: 'Spice Garden',
        contactName: 'Raj Kumar',
        email: 'raj@spicegarden.com',
        phone: '+919876543210',
        city: 'Bangalore',
        state: 'Karnataka',
      });

      expect(result.restaurantName).toBe('Spice Garden');
      expect(result.email).toBe('raj@spicegarden.com');
    });
  });

  describe('findAll', () => {
    it('should return paginated demo requests', async () => {
      mockPrisma.demoRequest.findMany.mockResolvedValue([mockRequest] as any);
      mockPrisma.demoRequest.count.mockResolvedValue(1);

      const result = await service.findAll(1, 10);

      expect(result.requests).toHaveLength(1);
      expect(result.total).toBe(1);
    });

    it('should filter by status', async () => {
      mockPrisma.demoRequest.findMany.mockResolvedValue([]);
      mockPrisma.demoRequest.count.mockResolvedValue(0);

      await service.findAll(1, 10, 'CONTACTED');

      expect(mockPrisma.demoRequest.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { status: 'CONTACTED' },
        }),
      );
    });
  });

  describe('findOne', () => {
    it('should return demo request by id', async () => {
      mockPrisma.demoRequest.findUnique.mockResolvedValue(mockRequest as any);

      const result = await service.findOne('demo-1');

      expect(result.restaurantName).toBe('Spice Garden');
    });

    it('should throw NotFoundException for missing request', async () => {
      mockPrisma.demoRequest.findUnique.mockResolvedValue(null);

      await expect(service.findOne('missing')).rejects.toThrow(NotFoundException);
    });
  });

  describe('updateStatus', () => {
    it('should update demo request status', async () => {
      mockPrisma.demoRequest.findUnique.mockResolvedValue(mockRequest as any);
      mockPrisma.demoRequest.update.mockResolvedValue({
        ...mockRequest, status: 'CONTACTED',
      } as any);

      const result = await service.updateStatus('demo-1', 'CONTACTED', {
        assignedTo: 'sales-1',
        notes: 'Called, interested in demo',
      });

      expect(result.status).toBe('CONTACTED');
    });

    it('should throw NotFoundException for missing request', async () => {
      mockPrisma.demoRequest.findUnique.mockResolvedValue(null);

      await expect(service.updateStatus('missing', 'SCHEDULED')).rejects.toThrow(NotFoundException);
    });
  });

  describe('getStats', () => {
    it('should return demo request statistics', async () => {
      mockPrisma.demoRequest.count
        .mockResolvedValueOnce(25)   // total
        .mockResolvedValueOnce(10)   // new
        .mockResolvedValueOnce(5)    // contacted
        .mockResolvedValueOnce(4)    // scheduled
        .mockResolvedValueOnce(4)    // converted
        .mockResolvedValueOnce(2);   // lost

      const result = await service.getStats();

      expect(result.total).toBe(25);
      expect(result.pipeline.new).toBe(10);
      expect(result.pipeline.converted).toBe(4);
      expect(result.conversionRate).toBe('16.0');
    });

    it('should return 0% conversion rate when no requests', async () => {
      mockPrisma.demoRequest.count.mockResolvedValue(0);

      const result = await service.getStats();

      expect(result.conversionRate).toBe('0');
    });
  });
});
