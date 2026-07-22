import { Test, TestingModule } from '@nestjs/testing';
import { FinanceService } from './finance.service';
import { PrismaService } from '../../prisma/prisma.service';
import { NotFoundException } from '@nestjs/common';

describe('FinanceService', () => {
  let service: FinanceService;
  let prisma: jest.Mocked<PrismaService>;

  const branchId = 'branch-1';

  const mockTransaction = {
    id: 'tx-1',
    branchId,
    type: 'INCOME',
    amount: 1000,
    category: 'Sales',
    description: 'Order payment',
    reference: 'ORD-001',
    date: new Date(),
    orderId: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockExpense = {
    id: 'tx-2',
    branchId,
    type: 'EXPENSE',
    amount: 500,
    category: 'Supplies',
    description: 'Kitchen supplies',
    reference: 'SUP-001',
    date: new Date(),
    orderId: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockPrisma = {
    transaction: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      count: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    branch: {
      findUnique: jest.fn(),
    },
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FinanceService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<FinanceService>(FinanceService);
    prisma = module.get(PrismaService) as jest.Mocked<PrismaService>;
  });

  describe('getOverview', () => {
    it('should return income, expenses, and net profit', async () => {
      mockPrisma.transaction.findMany.mockResolvedValue([mockTransaction, mockExpense]);

      const result = await service.getOverview(branchId);

      expect(result.totalIncome).toBe(1000);
      expect(result.totalExpenses).toBe(500);
      expect(result.netProfit).toBe(500);
      expect(result.transactionCount).toBe(2);
    });

    it('should apply date filters when provided', async () => {
      mockPrisma.transaction.findMany.mockResolvedValue([]);

      await service.getOverview(branchId, '2024-01-01', '2024-12-31');

      expect(mockPrisma.transaction.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            branchId,
            date: {
              gte: expect.any(Date),
              lte: expect.any(Date),
            },
          }),
        }),
      );
    });
  });

  describe('getTransactions', () => {
    it('should return paginated transactions', async () => {
      mockPrisma.transaction.findMany.mockResolvedValue([mockTransaction]);
      mockPrisma.transaction.count.mockResolvedValue(1);

      const result = await service.getTransactions(branchId, { page: 1, limit: 20 });

      expect(result.transactions).toHaveLength(1);
      expect(result.total).toBe(1);
      expect(result.page).toBe(1);
      expect(result.limit).toBe(20);
      expect(result.totalPages).toBe(1);
    });

    it('should apply filters', async () => {
      mockPrisma.transaction.findMany.mockResolvedValue([]);
      mockPrisma.transaction.count.mockResolvedValue(0);

      await service.getTransactions(branchId, {
        type: 'INCOME',
        category: 'Sales',
        page: 1,
        limit: 20,
      });

      expect(mockPrisma.transaction.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            branchId,
            type: 'INCOME',
            category: 'Sales',
          }),
        }),
      );
    });
  });

  const tenantId = 'tenant-1';

  describe('getTransaction', () => {
    it('should return a transaction by id', async () => {
      mockPrisma.transaction.findFirst.mockResolvedValue(mockTransaction);

      const result = await service.getTransaction('tx-1', tenantId);

      expect(result).toEqual(mockTransaction);
    });

    it('should throw NotFoundException if not found', async () => {
      mockPrisma.transaction.findFirst.mockResolvedValue(null);

      await expect(service.getTransaction('invalid', tenantId)).rejects.toThrow(NotFoundException);
    });
  });

  describe('createTransaction', () => {
    it('should create and return a transaction', async () => {
      const dto = {
        type: 'INCOME' as const,
        amount: 2000,
        category: 'Sales',
        description: 'Test',
        reference: 'REF-001',
      };

      const created = {
        ...mockTransaction,
        id: 'tx-new',
        ...dto,
        orderId: undefined,
      };
      mockPrisma.branch.findUnique.mockResolvedValue({ id: branchId, tenantId: 'tenant-1' });
      mockPrisma.transaction.create.mockResolvedValue(created);

      const result = await service.createTransaction(branchId, dto);

      expect(result).toEqual(created);
      expect(mockPrisma.transaction.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            branchId,
            tenantId: 'tenant-1',
            ...dto,
            date: expect.any(Date),
          }),
        }),
      );
    });
  });

  describe('updateTransaction', () => {
    it('should update and return the transaction', async () => {
      const dto = { amount: 1500 };
      const updated = { ...mockTransaction, amount: 1500 };

      mockPrisma.transaction.findFirst.mockResolvedValue(mockTransaction);
      mockPrisma.transaction.update.mockResolvedValue(updated);

      const result = await service.updateTransaction('tx-1', dto, tenantId);

      expect(result.amount).toBe(1500);
      expect(mockPrisma.transaction.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'tx-1' },
          data: dto,
        }),
      );
    });

    it('should throw if transaction not found', async () => {
      mockPrisma.transaction.findFirst.mockResolvedValue(null);

      await expect(service.updateTransaction('invalid', {}, tenantId)).rejects.toThrow(NotFoundException);
    });
  });

  describe('deleteTransaction', () => {
    it('should delete and return the transaction', async () => {
      mockPrisma.transaction.findFirst.mockResolvedValue(mockTransaction);
      mockPrisma.transaction.delete.mockResolvedValue(mockTransaction);

      const result = await service.deleteTransaction('tx-1', tenantId);

      expect(result).toEqual(mockTransaction);
      expect(mockPrisma.transaction.delete).toHaveBeenCalledWith({
        where: { id: 'tx-1' },
      });
    });

    it('should throw if transaction not found', async () => {
      mockPrisma.transaction.findFirst.mockResolvedValue(null);

      await expect(service.deleteTransaction('invalid', tenantId)).rejects.toThrow(NotFoundException);
    });
  });

  describe('getExpensesByCategory', () => {
    it('should group expenses by category', async () => {
      mockPrisma.transaction.findMany.mockResolvedValue([
        { ...mockExpense, category: 'Supplies', amount: 500 },
        { ...mockExpense, category: 'Supplies', amount: 300 },
        { ...mockExpense, category: 'Utilities', amount: 200 },
      ]);

      const result = await service.getExpensesByCategory(branchId);

      expect(result).toEqual([
        { category: 'Supplies', amount: 800 },
        { category: 'Utilities', amount: 200 },
      ]);
    });
  });

  describe('getIncomeByCategory', () => {
    it('should group income by category', async () => {
      mockPrisma.transaction.findMany.mockResolvedValue([
        { ...mockTransaction, category: 'Sales', amount: 1000 },
        { ...mockTransaction, category: 'Sales', amount: 500 },
        { ...mockTransaction, category: 'Services', amount: 300 },
      ]);

      const result = await service.getIncomeByCategory(branchId);

      expect(result).toEqual([
        { category: 'Sales', amount: 1500 },
        { category: 'Services', amount: 300 },
      ]);
    });
  });
});
