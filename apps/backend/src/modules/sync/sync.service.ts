import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { GatewayService } from '../websockets/gateway.service';

@Injectable()
export class SyncService {
  constructor(
    private prisma: PrismaService,
    private gateway: GatewayService,
  ) {}

  async pushOfflineData(tenantId: string, data: {
    orders?: any[];
    payments?: any[];
  }) {
    const results: any = { orders: [], payments: [], errors: [] };

    // Process offline orders
    if (data.orders) {
      for (const localOrder of data.orders) {
        try {
          // Get next order number
          const lastOrder = await this.prisma.order.findFirst({
            where: { branchId: localOrder.branchId },
            orderBy: { orderNumber: 'desc' },
          });
          const orderNumber = (lastOrder?.orderNumber || 0) + 1;

          const order = await this.prisma.order.create({
            data: {
              branchId: localOrder.branchId,
              tableId: localOrder.tableId,
              staffId: localOrder.staffId,
              orderNumber,
              type: localOrder.type || 'DINE_IN',
              status: localOrder.status || 'PENDING',
              customerName: localOrder.customerName,
              customerPhone: localOrder.customerPhone,
              subtotal: localOrder.subtotal,
              taxAmount: localOrder.taxAmount || 0,
              discountAmount: localOrder.discountAmount || 0,
              totalAmount: localOrder.totalAmount,
              notes: localOrder.notes,
              localId: localOrder.localId,
              synced: true,
              items: {
                create: (localOrder.items || []).map((item: any) => ({
                  menuItemId: item.menuItemId,
                  name: item.name,
                  quantity: item.quantity,
                  unitPrice: item.unitPrice,
                  totalPrice: item.unitPrice * item.quantity,
                  notes: item.notes,
                })),
              },
            },
          });

          results.orders.push({
            localId: localOrder.localId,
            serverId: order.id,
            orderNumber: order.orderNumber,
          });

          // Emit real-time event
          this.gateway.emitToBranch(localOrder.branchId, 'order:created', {
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
            error: error.message,
          });
        }
      }
    }

    // Process offline payments
    if (data.payments) {
      for (const localPayment of data.payments) {
        try {
          const payment = await this.prisma.payment.create({
            data: {
              orderId: localPayment.orderId,
              branchId: localPayment.branchId,
              method: localPayment.method,
              amount: localPayment.amount,
              reference: localPayment.reference,
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
            error: error.message,
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
}
