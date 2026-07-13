import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { GatewayService } from '../websockets/gateway.service';
import { PushSyncDto } from './dto/push-sync.dto';

export interface SyncResult {
  orders: Array<{ localId?: string; serverId: string; orderNumber?: number }>;
  payments: Array<{ localId?: string; serverId: string }>;
  errors: Array<{ type: string; localId?: string; error: string }>;
}

@Injectable()
export class SyncService {
  constructor(
    private prisma: PrismaService,
    private gateway: GatewayService,
  ) {}

  async pushOfflineData(tenantId: string, dto: PushSyncDto) {
    const results: SyncResult = { orders: [], payments: [], errors: [] };

    // Process offline orders
    if (dto.orders) {
      for (const localOrder of dto.orders) {
        try {
          // Idempotency: skip if localId already synced
          if (localOrder.localId) {
            const existing = await this.prisma.order.findFirst({ where: { localId: localOrder.localId } });
            if (existing) {
              // Conflict resolution: Last-Write-Wins with Server Timestamp
              // If the client timestamp is older than the server updatedAt, server wins
              if (localOrder.localUpdatedAt) {
                const localTime = new Date(localOrder.localUpdatedAt).getTime();
                const serverTime = new Date(existing.updatedAt).getTime();
                if (localTime < serverTime) {
                  results.errors.push({
                    type: 'order_conflict',
                    localId: localOrder.localId,
                    error: `Server has newer version (server updated: ${existing.updatedAt.toISOString()}). Server data preserved.`,
                  });
                  results.orders.push({
                    localId: localOrder.localId,
                    serverId: existing.id,
                    orderNumber: existing.orderNumber,
                  });
                  continue;
                }
              }
              // If no conflict or local is newer, accept and update
              if (existing.status === 'PENDING' || existing.status === 'CONFIRMED') {
                // Only update if the order is still mutable
                await this.prisma.order.update({
                  where: { id: existing.id },
                  data: {
                    status: (localOrder.status as any) || existing.status,
                    customerName: localOrder.customerName || existing.customerName,
                    customerPhone: localOrder.customerPhone || existing.customerPhone,
                    subtotal: localOrder.subtotal ?? existing.subtotal,
                    taxAmount: localOrder.taxAmount ?? existing.taxAmount,
                    discountAmount: localOrder.discountAmount ?? existing.discountAmount,
                    totalAmount: localOrder.totalAmount ?? existing.totalAmount,
                    notes: localOrder.notes ?? existing.notes,
                    synced: true,
                  },
                });
                results.orders.push({ localId: localOrder.localId, serverId: existing.id, orderNumber: existing.orderNumber });
                continue;
              }
              // Order is immutable (completed/cancelled), skip update
              results.orders.push({ localId: localOrder.localId, serverId: existing.id, orderNumber: existing.orderNumber });
              continue;
            }
          }

          // Get next order number
          const lastOrder = await this.prisma.order.findFirst({
            where: { branchId: localOrder.branchId! },
            orderBy: { orderNumber: 'desc' },
          });
          const orderNumber = (lastOrder?.orderNumber || 0) + 1;

          const order = await this.prisma.order.create({
            data: {
              branchId: localOrder.branchId!,
              tableId: localOrder.tableId || undefined,
              staffId: localOrder.staffId || undefined,
              orderNumber,
              type: (localOrder.type as any) || 'DINE_IN',
              status: (localOrder.status as any) || 'PENDING',
              customerName: localOrder.customerName || undefined,
              customerPhone: localOrder.customerPhone || undefined,
              subtotal: localOrder.subtotal || 0,
              taxAmount: localOrder.taxAmount || 0,
              discountAmount: localOrder.discountAmount || 0,
              totalAmount: localOrder.totalAmount || 0,
              notes: localOrder.notes || undefined,
              localId: localOrder.localId || undefined,
              synced: true,
              items: {
                create: (localOrder.items || []).map((item) => ({
                  menuItemId: item.menuItemId || '',
                  name: item.name || '',
                  quantity: item.quantity || 1,
                  unitPrice: item.unitPrice || 0,
                  totalPrice: (item.unitPrice || 0) * (item.quantity || 1),
                  notes: item.notes || undefined,
                })),
              },
              statusHistory: {
                create: {
                  status: (localOrder.status as any) || 'PENDING',
                  notes: 'Synced from offline device',
                },
              },
            },
          });

          // Update table status if order has a table
          if (order.tableId) {
            await this.prisma.restaurantTable.update({
              where: { id: order.tableId },
              data: { status: 'OCCUPIED' as any },
            });
          }

          results.orders.push({
            localId: localOrder.localId,
            serverId: order.id,
            orderNumber: order.orderNumber,
          });

          // Emit real-time event
          this.gateway.emitToBranch(localOrder.branchId!, 'order:created', {
            id: order.id,
            orderNumber: order.orderNumber,
            type: order.type,
            status: order.status,
            totalAmount: order.totalAmount,
          });
        } catch (error) {
          results.errors.push({
            type: 'order',
            localId: localOrder.localId,
            error: error instanceof Error ? error.message : String(error),
          });
        }
      }
    }

    // Process offline payments
    if (dto.payments) {
      for (const localPayment of dto.payments) {
        try {
          const payment = await this.prisma.payment.create({
            data: {
              orderId: localPayment.orderId!,
              branchId: localPayment.branchId!,
              method: (localPayment.method as any) || 'CASH',
              amount: localPayment.amount || 0,
              reference: localPayment.reference || undefined,
              status: 'COMPLETED',
            },
          });

          results.payments.push({
            localId: localPayment.localId,
            serverId: payment.id,
          });
        } catch (error) {
          results.errors.push({
            type: 'payment',
            localId: localPayment.localId,
            error: error instanceof Error ? error.message : String(error),
          });
        }
      }
    }

    return results;
  }

  async pullLatestData(tenantId: string, lastSyncAt?: string) {
    const since = lastSyncAt ? new Date(lastSyncAt) : new Date(0);

    const [categories, menuItems, tables] = await Promise.all([
      this.prisma.category.findMany({
        where: { tenantId, updatedAt: { gt: since } },
      }),
      this.prisma.menuItem.findMany({
        where: { tenantId, updatedAt: { gt: since } },
        include: { variants: true, addOns: true },
      }),
      this.prisma.restaurantTable.findMany({
        where: {
          branch: { tenantId },
          updatedAt: { gt: since },
        },
      }),
    ]);

    return {
      categories,
      menuItems,
      tables,
      syncedAt: new Date().toISOString(),
    };
  }

  async getSyncStatus(tenantId: string) {
    const unsyncedOrders = await this.prisma.order.count({
      where: {
        branch: { tenantId },
        synced: false,
      },
    });

    return {
      tenantId,
      unsyncedOrders,
      lastSyncAt: new Date().toISOString(),
    };
  }
}
