import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../../../prisma/prisma.service';
import { AggregatorAdapter } from '../../common/interfaces/aggregator-adapter.interface';

/**
 * Manages bidirectional menu synchronization between NEXA ROS and
 * aggregator platforms (Swiggy, Zomato).
 *
 * - Pushes menu changes from NEXA ROS → Aggregator (on-change trigger +
 *   scheduled cadence).
 * - Receives availability updates from Aggregator → NEXA ROS via webhooks
 *   and reflects them in inventory.
 * - Maintains the channel_item_mappings table as the source of truth
 *   for SKU cross-references.
 */
@Injectable()
export class MenuSyncService {
  private readonly logger = new Logger(MenuSyncService.name);

  constructor(private prisma: PrismaService) {}

  /**
   * Push the full menu for a branch to a specific aggregator channel.
   * Called on schedule (e.g., every 6 hours) and on changes.
   */
  async pushMenuToAggregator(
    branchId: string,
    channel: string,
    adapter: AggregatorAdapter,
  ): Promise<{ synced: number; failed: number }> {
    const mapping = await this.prisma.channelRestaurantMapping.findFirst({
      where: {
        internalBranchId: branchId,
        channel: channel.toUpperCase() as any,
        isActive: true,
      },
    });
    if (!mapping) {
      this.logger.warn(`No active ${channel} mapping for branch ${branchId}`);
      return { synced: 0, failed: 0 };
    }

    // Fetch all active menu items for this branch's tenant
    const branch = await this.prisma.branch.findUnique({
      where: { id: branchId },
      select: { tenantId: true },
    });
    if (!branch) return { synced: 0, failed: 0 };

    const menuItems = await this.prisma.menuItem.findMany({
      where: {
        tenantId: branch.tenantId,
        isAvailable: true,
        deletedAt: null,
      },
      include: {
        category: { select: { name: true } },
        images: { where: { isPrimary: true }, take: 1, select: { url: true } },
      },
    });

    // Build menu sync payload
    const menuSyncPayload = menuItems.map((item) => ({
      id: item.id,
      name: item.name,
      description: item.description || undefined,
      price: Number(item.price),
      isAvailable: item.isAvailable,
      category: item.category?.name,
      imageUrl: item.images[0]?.url,
      isVeg: item.isVeg,
      prepTimeMin: item.prepTimeMin || undefined,
    }));

    // Push to aggregator
    const result = await adapter.syncMenu(menuSyncPayload);

    // Update sync timestamps
    await this.prisma.channelRestaurantMapping.update({
      where: { id: mapping.id },
      data: { lastSyncAt: new Date() },
    });

    // Update individual item sync statuses
    for (const item of menuItems) {
      const existingMapping = await this.prisma.channelItemMapping.findFirst({
        where: {
          restaurantMappingId: mapping.id,
          internalMenuItemId: item.id,
        },
      });

      if (existingMapping) {
        await this.prisma.channelItemMapping.update({
          where: { id: existingMapping.id },
          data: {
            lastSyncedAt: new Date(),
            syncStatus: result.success ? 'SYNCED' : 'CONFLICT',
            externalItemName: item.name,
            externalPrice: item.price,
          },
        });
      } else {
        // Auto-create mapping if not exists (initial sync)
        // External item ID would need to come from aggregator response
        await this.prisma.channelItemMapping.create({
          data: {
            restaurantMappingId: mapping.id,
            internalMenuItemId: item.id,
            externalItemId: item.id, // Placeholder — replace with actual aggregator ID
            externalItemName: item.name,
            externalPrice: item.price,
            syncStatus: 'SYNCED',
            lastSyncedAt: new Date(),
          },
        });
      }
    }

    return { synced: result.syncedCount, failed: result.failedCount };
  }

  /**
   * Handle an "item out of stock" webhook from an aggregator.
   * Reflects the unavailability in NEXA ROS inventory.
   */
  async handleAggregatorOutOfStock(
    mappingId: string,
    externalItemId: string,
  ): Promise<void> {
    const itemMapping = await this.prisma.channelItemMapping.findFirst({
      where: {
        restaurantMappingId: mappingId,
        externalItemId,
        isActive: true,
      },
    });

    if (!itemMapping) {
      this.logger.warn(`No mapping found for aggregator item ${externalItemId}`);
      return;
    }

    // Mark the menu item as unavailable in NEXA ROS
    // This broadcasts to POS, KDS, and customer-facing apps
    await this.prisma.menuItem.update({
      where: { id: itemMapping.internalMenuItemId },
      data: { isAvailable: false },
    });

    this.logger.log(`Marked menu item ${itemMapping.internalMenuItemId} as unavailable (aggregator: ${externalItemId})`);
  }

  /**
   * Sync availability from NEXA ROS to all connected aggregators.
   * Called when a menu item's isAvailable flag changes.
   */
  async syncAvailabilityChange(
    menuItemId: string,
    isAvailable: boolean,
    adapters: Map<string, AggregatorAdapter>,
  ): Promise<void> {
    const mappings = await this.prisma.channelItemMapping.findMany({
      where: {
        internalMenuItemId: menuItemId,
        isActive: true,
      },
      include: {
        restaurantMapping: { select: { channel: true } },
      },
    });

    for (const mapping of mappings) {
      const channel = mapping.restaurantMapping.channel.toLowerCase();
      const adapter = adapters.get(channel);
      if (!adapter) continue;

      try {
        if (isAvailable) {
          await adapter.markItemAvailable(mapping.externalItemId);
        } else {
          await adapter.markItemUnavailable(mapping.externalItemId);
        }

        await this.prisma.channelItemMapping.update({
          where: { id: mapping.id },
          data: { lastSyncedAt: new Date(), syncStatus: 'SYNCED' },
        });
      } catch (err) {
        this.logger.error(
          `Failed to sync availability for ${mapping.externalItemId} on ${channel}: ${(err as Error).message}`,
        );
        await this.prisma.channelItemMapping.update({
          where: { id: mapping.id },
          data: { syncStatus: 'CONFLICT' },
        });
      }
    }
  }
}
