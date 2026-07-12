import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { GatewayService } from '../websockets/gateway.service';
import { unlink } from 'fs/promises';
import { join } from 'path';

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

  async findAllItems(tenantId: string, categoryId?: string, search?: string) {
    const where: any = { tenantId };

    if (categoryId) {
      where.categoryId = categoryId;
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { tags: { has: search } },
      ];
    }

    return this.prisma.menuItem.findMany({
      where,
      include: {
        category: { select: { id: true, name: true } },
        variants: true,
        addOns: true,
        images: { orderBy: { sortOrder: 'asc' } },
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
        images: { orderBy: { sortOrder: 'asc' } },
      },
    });
    if (!item) throw new NotFoundException('Menu item not found');
    return item;
  }

  async createItem(tenantId: string, data: any) {
    const { variants, addOns, ...itemData } = data;
    const item = await this.prisma.menuItem.create({
      data: {
        tenantId,
        ...itemData,
        variants: variants ? { create: variants } : undefined,
        addOns: addOns ? { create: addOns } : undefined,
      },
      include: { variants: true, addOns: true, images: true },
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
      include: { variants: true, addOns: true, images: true },
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
    const item = await this.findOneItem(id, tenantId);

    // Delete image files from disk
    for (const img of item.images) {
      try {
        const filePath = join(process.cwd(), 'uploads', 'menu-items', img.url.split('/').pop()!);
        await unlink(filePath);
      } catch {}
    }

    await this.prisma.menuItem.delete({ where: { id } });
    this.gateway.emitToTenant(tenantId, 'menu:updated', { type: 'item', action: 'deleted' });
    return { message: 'Menu item deleted' };
  }

  // ─── Images ───

  async uploadImages(itemId: string, tenantId: string, files: Express.Multer.File[]) {
    // Verify item exists and belongs to tenant
    await this.findOneItem(itemId, tenantId);

    const createdImages = await Promise.all(
      files.map((file, index) =>
        this.prisma.menuItemImage.create({
          data: {
            menuItemId: itemId,
            url: `/uploads/menu-items/${file.filename}`,
            sortOrder: index,
            isPrimary: index === 0,
          },
        }),
      ),
    );

    this.gateway.emitToTenant(tenantId, 'menu:updated', { type: 'item', action: 'images_uploaded' });
    return createdImages;
  }

  async deleteImage(itemId: string, imageId: string, tenantId: string) {
    await this.findOneItem(itemId, tenantId);

    const image = await this.prisma.menuItemImage.findFirst({
      where: { id: imageId, menuItemId: itemId },
    });
    if (!image) throw new NotFoundException('Image not found');

    // Delete file from disk
    try {
      const filePath = join(process.cwd(), 'uploads', 'menu-items', image.url.split('/').pop()!);
      await unlink(filePath);
    } catch {}

    await this.prisma.menuItemImage.delete({ where: { id: imageId } });
    this.gateway.emitToTenant(tenantId, 'menu:updated', { type: 'item', action: 'image_deleted' });
    return { message: 'Image deleted' };
  }

  async setPrimaryImage(itemId: string, imageId: string, tenantId: string) {
    await this.findOneItem(itemId, tenantId);

    // Reset all images to non-primary, then set the target
    await this.prisma.menuItemImage.updateMany({
      where: { menuItemId: itemId },
      data: { isPrimary: false },
    });

    const image = await this.prisma.menuItemImage.update({
      where: { id: imageId },
      data: { isPrimary: true },
    });

    this.gateway.emitToTenant(tenantId, 'menu:updated', { type: 'item', action: 'primary_changed' });
    return image;
  }
}
