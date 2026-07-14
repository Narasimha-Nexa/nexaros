import { Test, TestingModule } from '@nestjs/testing';
import { SupportService } from './support.service';
import { PrismaService } from '../../prisma/prisma.service';
import { NotFoundException } from '@nestjs/common';

describe('SupportService', () => {
  let service: SupportService;
  let prisma: jest.Mocked<PrismaService>;

  const mockTicket = {
    id: 'ticket-1',
    tenantId: 'tenant-1',
    subject: 'Payment issue',
    description: 'Unable to process refund',
    status: 'OPEN',
    priority: 'HIGH',
    assignedTo: null,
    messages: [],
    createdAt: new Date(),
  };

  const mockPrisma = {
    supportTicket: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      count: jest.fn(),
      update: jest.fn(),
      groupBy: jest.fn(),
    },
    ticketMessage: {
      create: jest.fn(),
    },
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SupportService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<SupportService>(SupportService);
    prisma = module.get(PrismaService) as jest.Mocked<PrismaService>;
  });

  describe('createTicket', () => {
    it('should create a support ticket', async () => {
      mockPrisma.supportTicket.create.mockResolvedValue(mockTicket as any);

      const result = await service.createTicket({
        tenantId: 'tenant-1',
        subject: 'Payment issue',
        description: 'Unable to process refund',
        priority: 'HIGH',
      });

      expect(result.subject).toBe('Payment issue');
      expect(result.priority).toBe('HIGH');
    });
  });

  describe('findAll', () => {
    it('should return paginated tickets', async () => {
      mockPrisma.supportTicket.findMany.mockResolvedValue([mockTicket] as any);
      mockPrisma.supportTicket.count.mockResolvedValue(1);

      const result = await service.findAll(1, 10);

      expect(result.tickets).toHaveLength(1);
      expect(result.total).toBe(1);
    });

    it('should filter by status', async () => {
      mockPrisma.supportTicket.findMany.mockResolvedValue([]);
      mockPrisma.supportTicket.count.mockResolvedValue(0);

      await service.findAll(1, 10, { status: 'RESOLVED' });

      expect(mockPrisma.supportTicket.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ status: 'RESOLVED' }),
        }),
      );
    });

    it('should filter by priority', async () => {
      mockPrisma.supportTicket.findMany.mockResolvedValue([]);
      mockPrisma.supportTicket.count.mockResolvedValue(0);

      await service.findAll(1, 10, { priority: 'URGENT' });

      expect(mockPrisma.supportTicket.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ priority: 'URGENT' }),
        }),
      );
    });
  });

  describe('findOne', () => {
    it('should return ticket with messages', async () => {
      mockPrisma.supportTicket.findUnique.mockResolvedValue({
        ...mockTicket,
        messages: [{ id: 'msg-1', message: 'Hello' }],
      } as any);

      const result = await service.findOne('ticket-1');

      expect(result.messages).toHaveLength(1);
    });

    it('should throw NotFoundException for missing ticket', async () => {
      mockPrisma.supportTicket.findUnique.mockResolvedValue(null);

      await expect(service.findOne('missing')).rejects.toThrow(NotFoundException);
    });
  });

  describe('addMessage', () => {
    it('should add message to ticket', async () => {
      mockPrisma.supportTicket.findUnique.mockResolvedValue(mockTicket as any);
      mockPrisma.ticketMessage.create.mockResolvedValue({
        id: 'msg-1', message: 'Here is the fix',
      } as any);

      const result = await service.addMessage('ticket-1', {
        senderType: 'ADMIN',
        senderId: 'admin-1',
        message: 'Here is the fix',
      });

      expect(result.message).toBe('Here is the fix');
    });

    it('should throw NotFoundException for missing ticket', async () => {
      mockPrisma.supportTicket.findUnique.mockResolvedValue(null);

      await expect(service.addMessage('missing', {
        senderType: 'ADMIN', senderId: 'a1', message: 'test',
      })).rejects.toThrow(NotFoundException);
    });
  });

  describe('updateStatus', () => {
    it('should update ticket status', async () => {
      mockPrisma.supportTicket.findUnique.mockResolvedValue(mockTicket as any);
      mockPrisma.supportTicket.update.mockResolvedValue({
        ...mockTicket, status: 'IN_PROGRESS',
      } as any);

      const result = await service.updateStatus('ticket-1', 'IN_PROGRESS');

      expect(result.status).toBe('IN_PROGRESS');
    });

    it('should throw NotFoundException for missing ticket', async () => {
      mockPrisma.supportTicket.findUnique.mockResolvedValue(null);

      await expect(service.updateStatus('missing', 'RESOLVED')).rejects.toThrow(NotFoundException);
    });
  });

  describe('getStats', () => {
    it('should return ticket statistics', async () => {
      mockPrisma.supportTicket.count
        .mockResolvedValueOnce(10)   // total
        .mockResolvedValueOnce(3)    // open
        .mockResolvedValueOnce(2)    // inProgress
        .mockResolvedValueOnce(1)    // waitingCustomer
        .mockResolvedValueOnce(3)    // resolved
        .mockResolvedValueOnce(1);   // closed

      mockPrisma.supportTicket.groupBy.mockResolvedValue([
        { priority: 'HIGH', _count: { id: 2 } },
        { priority: 'NORMAL', _count: { id: 3 } },
      ] as any);

      const result = await service.getStats();

      expect(result.total).toBe(10);
      expect(result.active).toBe(6);
      expect(result.byPriority).toHaveLength(2);
    });
  });
});
