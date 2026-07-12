import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { GatewayService } from '../websockets/gateway.service';

@Injectable()
export class MenuService {
  constructor(
    private prisma: PrismaService,
    private gateway: GatewayService,
  ) {}

  // ─── Categories ───

  async findAllCategories(tenantId: string) {
    return this.prisma.category.findMany({
      where: { tenantId },
      include: {
        _count: { select: { items: true } },
      },
      orderBy: { sortOrder: 'asc' },
    });
  }

  async createCategory(tenantId: string, data: any) {
    const category = await this.prisma.category.create({
      data: { ...data, tenantId },
    });
    this.gateway.emitToTenant(tenantId, 'menu:updated', { type: 'category', action: 'created' });
    return category;
  }

  async updateCategory(id: string, tenantId: string, data: any) {
    await this.prisma.category.findFirst({ where: { id, tenantId } });
    const category = await this.prisma.category.update({ where: { id }, data });
    this.gateway.emitToTenant(tenantId, 'menu:updated', { type: 'category', action: 'updated' });
    return category;
  }

  async removeCategory(id: string, tenantId: string) {
    await this.prisma.category.findFirst({ where: { id, tenantId } });
    await this.prisma.category.delete({ where: { id } });
    this.gateway.emitToTenant(tenantId, 'menu:updated', { type: 'category', action: 'deleted' });
    return { message: 'Category deleted' };
  }

  // ─── Menu Items ───

  async findAllItems(tenantId: string, categoryId?: string) {
    return this.prisma.menuItem.findMany({
      where: {
        tenantId,
        ...(categoryId ? { categoryId } : {}),
      },
      include: {
        category: { select: { id: true, name: true } },
        variants: true,
        addOns: true,
      },
      orderBy: { sortOrder: 'asc' },
    });
  }

  async findOneItem(id: string, tenantId: string) {
    const item = await this.prisma.menuItem.findFirst({
      where: { id, tenantId },
      include: {
        category: { select: { id: true, name: true } },
        variants: true,
        addOns: true,
      },
    });
    if (!item) throw new NotFoundException('Menu item not found');
    return item;
  }

  async createItem(tenantId: string, data: any) {
    const item = await this.prisma.menuItem.create({
      data: {
        tenantId,
        categoryId: data.categoryId,
        name: data.name,
        description: data.description,
        price: data.price,
        costPrice: data.costPrice,
        sku: data.sku,
        barcode: data.barcode,
        image: data.image,
        isVeg: data.isVeg || false,
        isAvailable: data.isAvailable ?? true,
        prepTimeMin: data.prepTimeMin,
        sortOrder: data.sortOrder || 0,
        taxRate: data.taxRate || 0,
        tags: data.tags || [],
        variants: data.variants
          ? { create: data.variants }
          : undefined,
        addOns: data.addOns
          ? { create: data.addOns }
          : undefined,
      },
      include: { variants: true, addOns: true },
    });
    this.gateway.emitToTenant(tenantId, 'menu:updated', { type: 'item', action: 'created' });
    return item;
  }

  async updateItem(id: string, tenantId: string, data: any) {
    await this.findOneItem(id, tenantId);

    const { variants, addOns, ...updateData } = data;

    const item = await this.prisma.menuItem.update({
      where: { id },
      data: updateData,
      include: { variants: true, addOns: true },
    });

    this.gateway.emitToTenant(tenantId, 'menu:updated', { type: 'item', action: 'updated' });
    return item;
  }

  async toggleAvailability(id: string, tenantId: string) {
    const item = await this.findOneItem(id, tenantId);
    const updated = await this.prisma.menuItem.update({
      where: { id },
      data: { isAvailable: !item.isAvailable },
    });
    this.gateway.emitToTenant(tenantId, 'menu:updated', { type: 'item', action: 'availability_changed' });
    return updated;
  }

  async removeItem(id: string, tenantId: string) {
    await this.findOneItem(id, tenantId);
    await this.prisma.menuItem.delete({ where: { id } });
    this.gateway.emitToTenant(tenantId, 'menu:updated', { type: 'item', action: 'deleted' });
    return { message: 'Menu item deleted' };
  }
}
