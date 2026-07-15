import { Test, TestingModule } from '@nestjs/testing';
import { PlatformService } from './platform.service';
import { PrismaService } from '../../prisma/prisma.service';

describe('PlatformService', () => {
  let service: PlatformService;
  let prisma: jest.Mocked<PrismaService>;

  const mockPrisma = {
    platformSettings: {
      findUnique: jest.fn(),
      upsert: jest.fn(),
      findMany: jest.fn(),
    },
    tenant: { count: jest.fn() },
    user: { count: jest.fn() },
    menuItem: { count: jest.fn() },
    order: { count: jest.fn() },
    subscription: { count: jest.fn() },
    supportTicket: { count: jest.fn() },
    adminAuditLog: { findMany: jest.fn() },
    $queryRawUnsafe: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PlatformService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<PlatformService>(PlatformService);
    prisma = module.get(PrismaService) as jest.Mocked<PrismaService>;
  });

  describe('getSetting', () => {
    it('should return setting value', async () => {
      mockPrisma.platformSettings.findUnique.mockResolvedValue({
        key: 'maintenance_mode',
        value: { enabled: false },
      } as any);

      const result = await service.getSetting('maintenance_mode');

      expect(result).toEqual({ enabled: false });
    });

    it('should return undefined for missing setting', async () => {
      mockPrisma.platformSettings.findUnique.mockResolvedValue(null);

      const result = await service.getSetting('nonexistent');

      expect(result).toBeUndefined();
    });
  });

  describe('setSetting', () => {
    it('should upsert setting', async () => {
      mockPrisma.platformSettings.upsert.mockResolvedValue({
        key: 'theme',
        value: { dark: true },
        description: 'App theme',
      } as any);

      const result = await service.setSetting('theme', { dark: true }, 'App theme');

      expect(result.key).toBe('theme');
      expect(mockPrisma.platformSettings.upsert).toHaveBeenCalled();
    });
  });

  describe('getAllSettings', () => {
    it('should return all settings', async () => {
      mockPrisma.platformSettings.findMany.mockResolvedValue([
        { key: 'maintenance_mode', value: { enabled: false } },
        { key: 'theme', value: { dark: true } },
      ] as any);

      const result = await service.getAllSettings();

      expect(result).toHaveLength(2);
    });
  });

  describe('getMaintenanceMode', () => {
    it('should return maintenance mode settings', async () => {
      mockPrisma.platformSettings.findUnique.mockResolvedValue({
        key: 'maintenance_mode',
        value: { enabled: true, message: 'Upgrading' },
      } as any);

      const result = await service.getMaintenanceMode() as Record<string, any>;

      expect(result.enabled).toBe(true);
    });

    it('should return default maintenance mode when not set', async () => {
      mockPrisma.platformSettings.findUnique.mockResolvedValue(null);

      const result = await service.getMaintenanceMode() as Record<string, any>;

      expect(result.enabled).toBe(false);
    });
  });

  describe('setMaintenanceMode', () => {
    it('should enable maintenance mode', async () => {
      mockPrisma.platformSettings.upsert.mockResolvedValue({} as any);

      await service.setMaintenanceMode(true, 'System upgrade in progress');

      expect(mockPrisma.platformSettings.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { key: 'maintenance_mode' },
          create: expect.objectContaining({
            key: 'maintenance_mode',
            value: expect.objectContaining({ enabled: true }),
          }),
        }),
      );
    });
  });

  describe('getPlatformStats', () => {
    it('should return aggregated platform statistics', async () => {
      mockPrisma.tenant.count
        .mockResolvedValueOnce(50)   // totalTenants
        .mockResolvedValueOnce(45);  // activeTenants
      mockPrisma.user.count.mockResolvedValue(120);
      mockPrisma.menuItem.count.mockResolvedValue(300);
      mockPrisma.order.count.mockResolvedValue(5000);
      mockPrisma.subscription.count
        .mockResolvedValueOnce(45)   // totalSubscriptions
        .mockResolvedValueOnce(30)   // activeSubscriptions
        .mockResolvedValueOnce(15);  // trialSubscriptions
      mockPrisma.supportTicket.count.mockResolvedValue(3);
      mockPrisma.adminAuditLog.findMany.mockResolvedValue([]);
      mockPrisma.$queryRawUnsafe.mockResolvedValue([{ total: '0' }]);

      const result = await service.getPlatformStats();

      expect(result.tenants.total).toBe(50);
      expect(result.tenants.active).toBe(45);
      expect(result.subscriptions.active).toBe(30);
      expect(result.subscriptions.trial).toBe(15);
    });
  });
});
