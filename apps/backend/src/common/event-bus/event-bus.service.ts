import { Injectable, Logger } from '@nestjs/common';
import { GatewayService } from '../../modules/websockets/gateway.service';
import { QueueService } from '../queue/queue.service';

/**
 * Central event bus that wraps WebSocket emits + BullMQ background jobs.
 * All modules should use this instead of calling gateway directly.
 */
@Injectable()
export class EventBusService {
  private readonly logger = new Logger(EventBusService.name);

  constructor(
    private gateway: GatewayService,
    private queues: QueueService,
  ) {}

  // ── Orders ──

  async orderCreated(tenantId: string, branchId: string, data: Record<string, unknown>) {
    this.gateway.emitToBranch(branchId, 'order:created', data);
    await this.queues.processOrderEvent({ tenantId, branchId, orderId: data.id as string, event: 'created' });
  }

  async orderUpdated(tenantId: string, branchId: string, data: Record<string, unknown>) {
    this.gateway.emitToBranch(branchId, 'order:updated', data);
  }

  async orderStatusChanged(tenantId: string, branchId: string, data: Record<string, unknown>) {
    this.gateway.emitToBranch(branchId, 'order:status-changed', data);
    await this.queues.processOrderEvent({ tenantId, branchId, orderId: data.orderId as string, event: 'status_changed' });
  }

  async orderReady(tenantId: string, branchId: string, data: Record<string, unknown>) {
    this.gateway.emitToBranch(branchId, 'order:ready', data);
  }

  async kotReady(tenantId: string, branchId: string, data: Record<string, unknown>) {
    this.gateway.emitToBranch(branchId, 'kot:ready', data);
  }

  // ── Menu ──

  async menuUpdated(tenantId: string, data: Record<string, unknown>) {
    this.gateway.emitToTenant(tenantId, 'menu:updated', data);
  }

  // ── Tables ──

  async tableStatusChanged(tenantId: string, branchId: string, data: Record<string, unknown>) {
    this.gateway.emitToBranch(branchId, 'table:status-changed', data);
  }

  // ── Payments ──

  async paymentReceived(tenantId: string, branchId: string, data: Record<string, unknown>) {
    this.gateway.emitToBranch(branchId, 'payment:received', data);
  }

  async paymentRefunded(tenantId: string, branchId: string, data: Record<string, unknown>) {
    this.gateway.emitToBranch(branchId, 'payment:refunded', data);
  }

  // ── Reservations ──

  async reservationCreated(tenantId: string, data: Record<string, unknown>) {
    this.gateway.emitToTenant(tenantId, 'reservation:created', data);
  }

  async reservationUpdated(tenantId: string, data: Record<string, unknown>) {
    this.gateway.emitToTenant(tenantId, 'reservation:updated', data);
  }

  async reservationDeleted(tenantId: string, data: Record<string, unknown>) {
    this.gateway.emitToTenant(tenantId, 'reservation:deleted', data);
  }

  // ── Staff ──

  async staffUpdated(tenantId: string, branchId: string, data: Record<string, unknown>) {
    this.gateway.emitToBranch(branchId, 'staff:updated', data);
  }

  async attendanceRecorded(tenantId: string, branchId: string, data: Record<string, unknown>) {
    this.gateway.emitToBranch(branchId, 'attendance:recorded', data);
  }

  async shiftAssigned(tenantId: string, branchId: string, data: Record<string, unknown>) {
    this.gateway.emitToBranch(branchId, 'shift:assigned', data);
  }

  // ── Inventory ──

  async inventoryUpdated(tenantId: string, data: Record<string, unknown>) {
    this.gateway.emitToTenant(tenantId, 'inventory:updated', data);
  }

  async stockLow(tenantId: string, branchId: string, data: Record<string, unknown>) {
    this.gateway.emitToBranch(branchId, 'inventory:low', data);
  }

  async stockMovement(tenantId: string, data: Record<string, unknown>) {
    this.gateway.emitToTenant(tenantId, 'inventory:stock_movement', data);
  }

  // ── Invoices ──

  async invoiceGenerated(tenantId: string, branchId: string, data: Record<string, unknown>) {
    this.gateway.emitToBranch(branchId, 'invoice:generated', data);
    await this.queues.generateInvoice({ tenantId, orderId: data.orderId as string, branchId });
  }

  // ── Subscriptions ──

  async subscriptionStatusChanged(tenantId: string, data: Record<string, unknown>) {
    this.gateway.emitToTenant(tenantId, 'subscription:status_changed', data);
  }

  // ── Notifications ──

  async notificationSent(tenantId: string, branchId: string | undefined, data: Record<string, unknown>) {
    if (branchId) {
      this.gateway.emitToBranch(branchId, 'notification', data);
    } else {
      this.gateway.emitToTenant(tenantId, 'notification', data);
    }
    await this.queues.sendNotification({
      tenantId,
      branchId,
      type: (data.channel as 'email' | 'sms' | 'push') || 'push',
      to: data.to as string,
      subject: data.subject as string,
      template: data.template as string,
      payload: data.payload as Record<string, unknown>,
    });
  }

  // ── Coupons ──

  async couponUsed(tenantId: string, data: Record<string, unknown>) {
    this.gateway.emitToTenant(tenantId, 'coupon:used', data);
  }

  // ── Support ──

  async supportTicketUpdated(tenantId: string, data: Record<string, unknown>) {
    this.gateway.emitToTenant(tenantId, 'support:updated', data);
  }

  // ── Platform ──

  async platformSettingsChanged(data: Record<string, unknown>) {
    this.gateway.emitToTenant('platform', 'platform:settings_changed', data);
  }

  // ── Item Status (kitchen) ──

  async itemStatusChanged(tenantId: string, branchId: string, data: Record<string, unknown>) {
    this.gateway.emitToBranch(branchId, 'item:status-changed', data);
  }

  // ── Generic ──

  emitToTenant(tenantId: string, event: string, data: Record<string, unknown>) {
    this.gateway.emitToTenant(tenantId, event, data);
  }

  emitToBranch(branchId: string, event: string, data: Record<string, unknown>) {
    this.gateway.emitToBranch(branchId, event, data);
  }

  emitToRoom(room: string, event: string, data: Record<string, unknown>) {
    this.gateway.emitToRoom(room, event, data);
  }
}
