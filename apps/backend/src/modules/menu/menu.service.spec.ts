import { Test, TestingModule } from '@nestjs/testing';
import { MenuService } from './menu.service';
import { PrismaService } from '../../prisma/prisma.service';
import { GatewayService } from '../websockets/gateway.service';
import { RedisService } from '../../common/redis/redis.service';
import { NotFoundException } from '@nestjs/common';

// Mock fs/promises unlink (used when deleting images)
jest.mock('fs/promises', () => ({
  unlink: jest.fn().mockResolvedValue(undefined),
}));

describe('MenuService', () => {
  let service: MenuService;
  let prisma: jest.Mocked<PrismaService>;
  let gateway: jest.Mocked<GatewayService>;
  let redis: jest.Mocked<RedisService>;

  const mockCategory = {
    id: 'cat-1',
    tenantId: 'tenant-1',
    name: 'Starters',
    description: 'Appetizers',
    sortOrder: 0,
    isActive: true,
    image: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockMenuItem = {
    id: 'item-1',
    tenantId: 'tenant-1',
    categoryId: 'cat-1',
    name: 'Butter Chicken',
    description: 'Creamy tomato gravy',
    price: 350,
    costPrice: 150,
    sku: 'BC-001',
    barcode: null,
    image: null,
    isVeg: false,
    isAvailable: true,
    prepTimeMin: 20,
    sortOrder: 0,
    taxRate: 5,
    tags: ['popular'],
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockPrisma = {
    category: {
      findMany: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    menuItem: {
      findMany: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
    },
    menuItemImage: {
      create: jest.fn(),
      update: jest.fn(),
      updateMany: jest.fn(),
      findFirst: jest.fn(),
      delete: jest.fn(),
    },
  };

  const mockGateway = { emitToTenant: jest.fn() };

  const mockRedis = {
    get: jest.fn().mockResolvedValue(null),
    set: jest.fn().mockResolvedValue(undefined),
    del: jest.fn().mockResolvedValue(undefined),
    delPattern: jest.fn().mockResolvedValue(undefined),
    isReady: jest.fn().mockReturnValue(true),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MenuService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: GatewayService, useValue: mockGateway },
        { provide: RedisService, useValue: mockRedis },
      ],
    }).compile();

    service = module.get<MenuService>(MenuService);
    prisma = module.get(PrismaService) as jest.Mocked<PrismaService>;
    gateway = module.get(GatewayService) as jest.Mocked<GatewayService>;
    redis = module.get(RedisService) as jest.Mocked<RedisService>;
  });

  // ── CATEGORIES ──

  describe('findAllCategories', () => {
    it('should return categories with item counts', async () => {
      mockPrisma.category.findMany.mockResolvedValue([mockCategory]);

      const result = await service.findAllCategories('tenant-1');

      expect(result).toHaveLength(1);
    });
  });

  describe('createCategory', () => {
    it('should create category and emit event', async () => {
      mockPrisma.category.create.mockResolvedValue(mockCategory);

      const result = await service.createCategory('tenant-1', {
        name: 'Starters',
        description: 'Appetizers',
        sortOrder: 0,
      });

      expect(result).toMatchObject({ name: 'Starters' });
      expect(mockGateway.emitToTenant).toHaveBeenCalledWith(
        'tenant-1',
        'menu:updated',
        expect.objectContaining({ type: 'category', action: 'created' }),
      );
    });
  });

  describe('updateCategory', () => {
    it('should update category and emit event', async () => {
      mockPrisma.category.findFirst.mockResolvedValue(mockCategory);
      mockPrisma.category.update.mockResolvedValue({ ...mockCategory, name: 'Mains' });

      const result = await service.updateCategory('cat-1', 'tenant-1', { name: 'Mains' });

      expect(result.name).toBe('Mains');
      expect(mockGateway.emitToTenant).toHaveBeenCalledWith(
        'tenant-1',
        'menu:updated',
        expect.objectContaining({ type: 'category', action: 'updated' }),
      );
    });
  });

  describe('removeCategory', () => {
    it('should delete category and emit event', async () => {
      mockPrisma.category.findFirst.mockResolvedValue(mockCategory);
      mockPrisma.category.delete.mockResolvedValue(mockCategory);

      const result = await service.removeCategory('cat-1', 'tenant-1');

      expect(result).toMatchObject({ message: 'Category deleted' });
      expect(mockGateway.emitToTenant).toHaveBeenCalledWith(
        'tenant-1',
        'menu:updated',
        expect.objectContaining({ type: 'category', action: 'deleted' }),
      );
    });
  });

  // ── MENU ITEMS ──

  describe('findAllItems', () => {
    it('should return paginated menu items', async () => {
      mockPrisma.menuItem.findMany.mockResolvedValue([mockMenuItem]);
      mockPrisma.menuItem.count.mockResolvedValue(1);

      const result = await service.findAllItems('tenant-1') as any;

      expect(result.items).toHaveLength(1);
      expect(result.total).toBe(1);
    });

    it('should filter by category when provided', async () => {
      mockPrisma.menuItem.findMany.mockResolvedValue([]);
      mockPrisma.menuItem.count.mockResolvedValue(0);

      await service.findAllItems('tenant-1', 'cat-1');

      expect(mockPrisma.menuItem.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ categoryId: 'cat-1' }),
        }),
      );
    });

    it('should search items by name when search query provided', async () => {
      mockPrisma.menuItem.findMany.mockResolvedValue([]);
      mockPrisma.menuItem.count.mockResolvedValue(0);

      await service.findAllItems('tenant-1', undefined, 'chicken');

      expect(mockPrisma.menuItem.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            OR: expect.arrayContaining([
              expect.objectContaining({ name: expect.objectContaining({ contains: 'chicken' }) }),
            ]),
          }),
        }),
      );
    });
  });

  describe('findOneItem', () => {
    it('should return item when found', async () => {
      mockPrisma.menuItem.findFirst.mockResolvedValue(mockMenuItem);

      const result = await service.findOneItem('item-1', 'tenant-1');

      expect(result).toMatchObject({ name: 'Butter Chicken' });
    });

    it('should throw NotFoundException when item not found', async () => {
      mockPrisma.menuItem.findFirst.mockResolvedValue(null);

      await expect(service.findOneItem('missing', 'tenant-1')).rejects.toThrow(NotFoundException);
    });
  });

  describe('createItem', () => {
    const createDto = {
      categoryId: 'cat-1',
      name: 'New Dish',
      price: 299,
      description: 'Test',
      isVeg: true,
      taxRate: 5,
      tags: ['new'],
      variants: [{ name: 'Regular', price: 299 }],
      addOns: [{ name: 'Extra Cheese', price: 30 }],
    };

    it('should create item with variants and add-ons', async () => {
      mockPrisma.menuItem.create.mockResolvedValue({
        ...mockMenuItem,
        name: 'New Dish',
        variants: createDto.variants,
        addOns: createDto.addOns,
        images: [],
      });

      const result = await service.createItem('tenant-1', createDto as any);

      expect(result.name).toBe('New Dish');
      expect(mockPrisma.menuItem.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            name: 'New Dish',
            tenantId: 'tenant-1',
            variants: expect.objectContaining({ create: createDto.variants }),
          }),
        }),
      );
      expect(mockGateway.emitToTenant).toHaveBeenCalledWith(
        'tenant-1',
        'menu:updated',
        expect.objectContaining({ type: 'item', action: 'created' }),
      );
    });
  });

  describe('updateItem', () => {
    it('should update item details', async () => {
      mockPrisma.menuItem.findFirst.mockResolvedValue(mockMenuItem);
      mockPrisma.menuItem.update.mockResolvedValue({ ...mockMenuItem, price: 399 });

      const result = await service.updateItem('item-1', 'tenant-1', { price: 399 });

      expect(result.price).toBe(399);
      expect(mockGateway.emitToTenant).toHaveBeenCalled();
    });
  });

  describe('toggleAvailability', () => {
    it('should toggle item availability from true to false', async () => {
      mockPrisma.menuItem.findFirst.mockResolvedValue(mockMenuItem);
      mockPrisma.menuItem.update.mockResolvedValue({ ...mockMenuItem, isAvailable: false });

      const result = await service.toggleAvailability('item-1', 'tenant-1');

      expect(result.isAvailable).toBe(false);
    });

    it('should toggle item availability from false to true', async () => {
      mockPrisma.menuItem.findFirst.mockResolvedValue({ ...mockMenuItem, isAvailable: false });
      mockPrisma.menuItem.update.mockResolvedValue({ ...mockMenuItem, isAvailable: true });

      const result = await service.toggleAvailability('item-1', 'tenant-1');

      expect(result.isAvailable).toBe(true);
    });
  });

  describe('uploadImages', () => {
    const mockFile = { filename: 'test.jpg', fieldname: 'images', originalname: 'test.jpg', encoding: '7bit', mimetype: 'image/jpeg', size: 1024, stream: null as any, destination: '', path: '', buffer: Buffer.from('') };

    it('should upload images and emit event', async () => {
      mockPrisma.menuItem.findFirst.mockResolvedValue(mockMenuItem);
      mockPrisma.menuItemImage.create.mockResolvedValue({
        id: 'img-1',
        menuItemId: 'item-1',
        url: '/uploads/menu-items/test.jpg',
        sortOrder: 0,
        isPrimary: true,
        createdAt: new Date(),
      });

      const result = await service.uploadImages('item-1', 'tenant-1', [mockFile]);

      expect(result).toHaveLength(1);
      expect(mockGateway.emitToTenant).toHaveBeenCalled();
    });
  });

  describe('deleteImage', () => {
    it('should delete image and emit event', async () => {
      mockPrisma.menuItem.findFirst.mockResolvedValue(mockMenuItem);
      mockPrisma.menuItemImage.findFirst.mockResolvedValue({
        id: 'img-1',
        menuItemId: 'item-1',
        url: '/uploads/menu-items/test.jpg',
        sortOrder: 0,
        isPrimary: false,
        createdAt: new Date(),
      });
      mockPrisma.menuItemImage.delete.mockResolvedValue({} as any);

      const result = await service.deleteImage('item-1', 'img-1', 'tenant-1');

      expect(result).toMatchObject({ message: 'Image deleted' });
      expect(mockGateway.emitToTenant).toHaveBeenCalled();
    });
  });
});
