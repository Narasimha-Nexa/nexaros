import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { EventBusService } from '../../common/event-bus/event-bus.service';
import { RedisService } from '../../common/redis/redis.service';
import { unlink } from 'fs/promises';
import { join } from 'path';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { CreateMenuItemDto } from './dto/create-menu-item.dto';
import { UpdateMenuItemDto } from './dto/update-menu-item.dto';

@Injectable()
export class MenuService {
  private readonly CACHE_TTL = 300; // 5 minutes

  constructor(
    private prisma: PrismaService,
    private eventBus: EventBusService,
    private redis: RedisService,
  ) {}

  // ── Helper: emit menu updates to public namespace ──

  /**
   * Emit menu:updated to both the internal tenant room AND the public /public namespace
   * so that customer-facing pages can receive real-time menu changes without a page refresh.
   */
  private async emitMenuUpdate(tenantId: string, data: { type: string; action: string }) {
    // Always emit to internal tenant room (staff/admin apps)
    this.eventBus.emitToTenant(tenantId, 'menu:updated', data);

    // Also emit to public tenant room so the customer website gets real-time updates
    try {
      const tenant = await this.prisma.tenant.findUnique({
        where: { id: tenantId },
        select: { slug: true },
      });
      if (tenant?.slug) {
        this.eventBus.emitToTenantPublicBySlug(tenant.slug, 'menu:updated', data);
        // Invalidate public menu cache so customer website gets fresh data on next poll
        await this.redis.delPattern(`public:menu:${tenant.slug}*`);
      }
    } catch {
      // Silently fail — public emission is best-effort
    }
  }

  // ─── Categories ───

  async findAllCategories(tenantId: string) {
    const cacheKey = `menu:categories:${tenantId}`;
    const cached = await this.redis.get(cacheKey);
    if (cached) return cached;

    const categories = await this.prisma.category.findMany({
      where: { tenantId },
      include: {
        _count: { select: { items: true } },
      },
      orderBy: { sortOrder: 'asc' },
    });

    await this.redis.set(cacheKey, categories, this.CACHE_TTL);
    return categories;
  }

  async createCategory(tenantId: string, dto: CreateCategoryDto) {
    const category = await this.prisma.category.create({
      data: { ...dto, tenantId },
    });
    await this.redis.delPattern(`menu:categories:${tenantId}*`);
    await this.emitMenuUpdate(tenantId, { type: 'category', action: 'created' });
    return category;
  }

  async updateCategory(id: string, tenantId: string, dto: UpdateCategoryDto) {
    const existing = await this.prisma.category.findFirst({ where: { id, tenantId } });
    if (!existing) throw new NotFoundException('Category not found');
    const category = await this.prisma.category.update({ where: { id }, data: dto });
    await this.redis.delPattern(`menu:categories:${tenantId}*`);
    await this.emitMenuUpdate(tenantId, { type: 'category', action: 'updated' });
    return category;
  }

  async removeCategory(id: string, tenantId: string) {
    const category = await this.prisma.category.findFirst({ where: { id, tenantId } });
    if (!category) throw new NotFoundException('Category not found');

    // Check if category has menu items
    const itemCount = await this.prisma.menuItem.count({ where: { categoryId: id } });
    if (itemCount > 0) {
      throw new Error(`Cannot delete category with ${itemCount} menu item(s). Move or delete items first.`);
    }

    await this.prisma.category.delete({ where: { id } });
    await this.redis.delPattern(`menu:categories:${tenantId}*`);
    await this.redis.delPattern(`menu:items:${tenantId}*`);
    await this.emitMenuUpdate(tenantId, { type: 'category', action: 'deleted' });
    return { message: 'Category deleted' };
  }

  // ─── Menu Items ───

  async findAllItems(tenantId: string, categoryId?: string, search?: string, skip = 0, take = 50) {
    const cacheKey = `menu:items:${tenantId}:${categoryId || 'all'}:${search || ''}:${skip}:${take}`;
    const cached = await this.redis.get(cacheKey);
    if (cached) return cached;

    const where: { tenantId: string; categoryId?: string; OR?: object[] } = { tenantId };

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

    const [items, total] = await Promise.all([
      this.prisma.menuItem.findMany({
        where,
        skip,
        take,
        include: {
          category: { select: { id: true, name: true } },
          variants: true,
          addOns: true,
          images: { orderBy: { sortOrder: 'asc' } },
        },
        orderBy: { sortOrder: 'asc' },
      }),
      this.prisma.menuItem.count({ where }),
    ]);

    const result = { items, total, skip, take };
    await this.redis.set(cacheKey, result, this.CACHE_TTL);
    return result;
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

  async createItem(tenantId: string, dto: CreateMenuItemDto) {
    const { variants, addOns, ...itemData } = dto;
    const item = await this.prisma.menuItem.create({
      data: {
        tenantId,
        ...itemData,
        variants: variants ? { create: variants } : undefined,
        addOns: addOns ? { create: addOns } : undefined,
      },
      include: { variants: true, addOns: true, images: true },
    });
    await this.redis.delPattern(`menu:items:${tenantId}*`);
    await this.emitMenuUpdate(tenantId, { type: 'item', action: 'created' });
    return item;
  }

  async updateItem(id: string, tenantId: string, dto: UpdateMenuItemDto) {
    await this.findOneItem(id, tenantId);

    const { variants, addOns, ...updateData } = dto;

    // Handle variants: sync by deleting removed ones and creating/updating provided ones
    const variantOps: Promise<any>[] = [];
    if (variants !== undefined) {
      // Delete existing variants not in the update list
      const existingVariants = await this.prisma.menuItemVariant.findMany({
        where: { menuItemId: id },
        select: { id: true },
      });
      const incomingIds = variants.filter((v: any) => v.id).map((v: any) => v.id);
      const toDelete = existingVariants.filter((v) => !incomingIds.includes(v.id));
      if (toDelete.length > 0) {
        variantOps.push(
          this.prisma.menuItemVariant.deleteMany({
            where: { id: { in: toDelete.map((v) => v.id) } },
          }),
        );
      }
      // Create new or update existing variants
      for (const v of variants) {
        if ((v as any).id) {
          variantOps.push(
            this.prisma.menuItemVariant.update({
              where: { id: (v as any).id },
              data: { name: v.name, price: v.price, ...(v.isActive !== undefined && { isActive: v.isActive }) },
            }),
          );
        } else {
          variantOps.push(
            this.prisma.menuItemVariant.create({
              data: { menuItemId: id, name: v.name, price: v.price, ...(v.isActive !== undefined && { isActive: v.isActive }) },
            }),
          );
        }
      }
    }

    // Handle addOns: sync by deleting removed ones and creating/updating provided ones
    const addOnOps: Promise<any>[] = [];
    if (addOns !== undefined) {
      const existingAddOns = await this.prisma.menuItemAddOn.findMany({
        where: { menuItemId: id },
        select: { id: true },
      });
      const incomingIds = addOns.filter((a: any) => a.id).map((a: any) => a.id);
      const toDelete = existingAddOns.filter((a) => !incomingIds.includes(a.id));
      if (toDelete.length > 0) {
        addOnOps.push(
          this.prisma.menuItemAddOn.deleteMany({
            where: { id: { in: toDelete.map((a) => a.id) } },
          }),
        );
      }
      for (const a of addOns) {
        if ((a as any).id) {
          addOnOps.push(
            this.prisma.menuItemAddOn.update({
              where: { id: (a as any).id },
              data: { name: a.name, price: a.price, ...(a.isActive !== undefined && { isActive: a.isActive }) },
            }),
          );
        } else {
          addOnOps.push(
            this.prisma.menuItemAddOn.create({
              data: { menuItemId: id, name: a.name, price: a.price, ...(a.isActive !== undefined && { isActive: a.isActive }) },
            }),
          );
        }
      }
    }

    await Promise.all([...variantOps, ...addOnOps]);

    const item = await this.prisma.menuItem.update({
      where: { id },
      data: updateData,
      include: { variants: true, addOns: true, images: true },
    });

    await this.redis.delPattern(`menu:items:${tenantId}*`);
    await this.emitMenuUpdate(tenantId, { type: 'item', action: 'updated' });
    return item;
  }

  async toggleAvailability(id: string, tenantId: string) {
    const item = await this.findOneItem(id, tenantId);
    const updated = await this.prisma.menuItem.update({
      where: { id },
      data: { isAvailable: !item.isAvailable },
    });
    await this.redis.delPattern(`menu:items:${tenantId}*`);
    await this.emitMenuUpdate(tenantId, { type: 'item', action: 'availability_changed' });
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
    await this.redis.delPattern(`menu:items:${tenantId}*`);
    await this.emitMenuUpdate(tenantId, { type: 'item', action: 'deleted' });
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

    await this.emitMenuUpdate(tenantId, { type: 'item', action: 'images_uploaded' });
    await this.redis.delPattern(`menu:items:${tenantId}*`);
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
    await this.redis.delPattern(`menu:items:${tenantId}*`);
    await this.emitMenuUpdate(tenantId, { type: 'item', action: 'image_deleted' });
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

    await this.redis.delPattern(`menu:items:${tenantId}*`);
    await this.emitMenuUpdate(tenantId, { type: 'item', action: 'primary_changed' });
    return image;
  }

  // ─── Combos ───

  async findAllCombos(tenantId: string) {
    const cacheKey = `menu:combos:${tenantId}`;
    const cached = await this.redis.get(cacheKey);
    if (cached) return cached;

    const combos = await this.prisma.combo.findMany({
      where: { tenantId, deletedAt: null },
      include: {
        items: {
          include: {
            menuItem: { select: { id: true, name: true, price: true, image: true, isVeg: true } },
          },
        },
      },
      orderBy: { sortOrder: 'asc' },
    });

    await this.redis.set(cacheKey, combos, this.CACHE_TTL);
    return combos;
  }

  async findOneCombo(id: string, tenantId: string) {
    const combo = await this.prisma.combo.findFirst({
      where: { id, tenantId, deletedAt: null },
      include: {
        items: {
          include: {
            menuItem: { select: { id: true, name: true, price: true, image: true, isVeg: true } },
          },
        },
      },
    });
    if (!combo) throw new NotFoundException('Combo not found');
    return combo;
  }

  async createCombo(tenantId: string, dto: { name: string; description?: string; price: number; image?: string; items: { menuItemId: string; quantity?: number }[] }) {
    const combo = await this.prisma.combo.create({
      data: {
        tenantId,
        name: dto.name,
        description: dto.description,
        price: dto.price,
        image: dto.image,
        items: {
          create: dto.items.map(item => ({
            menuItemId: item.menuItemId,
            quantity: item.quantity ?? 1,
          })),
        },
      },
      include: {
        items: {
          include: {
            menuItem: { select: { id: true, name: true, price: true, image: true, isVeg: true } },
          },
        },
      },
    });
    await this.redis.delPattern(`menu:combos:${tenantId}*`);
    return combo;
  }

  async updateCombo(id: string, tenantId: string, dto: { name?: string; description?: string; price?: number; isActive?: boolean; image?: string; items?: { menuItemId: string; quantity?: number }[] }) {
    await this.findOneCombo(id, tenantId);

    const { items, ...updateData } = dto;

    // If items provided, sync them
    if (items !== undefined) {
      await this.prisma.comboItem.deleteMany({ where: { comboId: id } });
      if (items.length > 0) {
        await this.prisma.comboItem.createMany({
          data: items.map(item => ({
            comboId: id,
            menuItemId: item.menuItemId,
            quantity: item.quantity ?? 1,
          })),
        });
      }
    }

    const combo = await this.prisma.combo.update({
      where: { id },
      data: updateData,
      include: {
        items: {
          include: {
            menuItem: { select: { id: true, name: true, price: true, image: true, isVeg: true } },
          },
        },
      },
    });
    await this.redis.delPattern(`menu:combos:${tenantId}*`);
    return combo;
  }

  async removeCombo(id: string, tenantId: string) {
    await this.findOneCombo(id, tenantId);
    await this.prisma.combo.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
    await this.redis.delPattern(`menu:combos:${tenantId}*`);
    return { message: 'Combo deleted' };
  }
}
