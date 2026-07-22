import { Injectable, Logger } from '@nestjs/common';
import { GatewayService } from '../../modules/websockets/gateway.service';
import { QueueService } from '../queue/queue.service';

@Injectable()
export class EventBusService {
  private readonly logger = new Logger(EventBusService.name);
  private webhookService: any;

  constructor(
    private gateway: GatewayService,
    private queues: QueueService,
  ) {}

  setWebhookService(service: any) {
    this.webhookService = service;
  }

  private domainEventHandlers: ((tenantId: string, event: string, payload: Record<string, unknown>) => Promise<void>)[] = [];

  registerDomainEventHandler(handler: (tenantId: string, event: string, payload: Record<string, unknown>) => Promise<void>) {
    this.domainEventHandlers.push(handler);
  }

  async fireDomainEvent(tenantId: string, event: string, payload: Record<string, unknown>) {
    for (const handler of this.domainEventHandlers) {
      try {
        await handler(tenantId, event, payload);
      } catch (err) {
        this.logger.warn(`Domain event handler failed for ${event}: ${err}`);
      }
    }
  }

  private async fireWebhook(tenantId: string, event: string, data: Record<string, unknown>) {
    if (!this.webhookService) return;
    try {
      await this.webhookService.triggerEvent(tenantId, event, data);
    } catch (err) {
      this.logger.warn(`Webhook trigger failed for ${event}: ${err}`);
    }
  }

  // ── Orders ──

  async orderCreated(tenantId: string, branchId: string, data: Record<string, unknown>) {
    this.gateway.emitToBranch(branchId, 'order:created', data);
    await this.queues.processOrderEvent({ tenantId, branchId, orderId: data.id as string, event: 'created' });
    await this.fireWebhook(tenantId, 'order.created', { ...data, branchId });
    await this.fireDomainEvent(tenantId, 'order.created', { ...data, branchId });
  }

  async orderUpdated(tenantId: string, branchId: string, data: Record<string, unknown>) {
    this.gateway.emitToBranch(branchId, 'order:updated', data);
    await this.fireWebhook(tenantId, 'order.updated', { ...data, branchId });
  }

  async orderStatusChanged(tenantId: string, branchId: string, data: Record<string, unknown>) {
    this.gateway.emitToBranch(branchId, 'order:status-changed', data);
    await this.queues.processOrderEvent({ tenantId, branchId, orderId: data.orderId as string, event: 'status_changed' });
    await this.fireWebhook(tenantId, 'order.status_changed', { ...data, branchId });
    await this.fireDomainEvent(tenantId, 'order.status_changed', { ...data, branchId });
  }

  async orderReady(tenantId: string, branchId: string, data: Record<string, unknown>) {
    this.gateway.emitToBranch(branchId, 'order:ready', data);
    await this.fireWebhook(tenantId, 'order.ready', { ...data, branchId });
  }

  async kotReady(tenantId: string, branchId: string, data: Record<string, unknown>) {
    this.gateway.emitToBranch(branchId, 'kot:ready', data);
  }

  // ── Menu ──

  async menuUpdated(tenantId: string, data: Record<string, unknown>) {
    this.gateway.emitToTenant(tenantId, 'menu:updated', data);
    await this.fireWebhook(tenantId, 'menu.updated', data);
    await this.fireDomainEvent(tenantId, 'menu.updated', data);
  }

  async tableStatusChanged(tenantId: string, branchId: string, data: Record<string, unknown>) {
    this.gateway.emitToBranch(branchId, 'table:status-changed', data);
    await this.fireWebhook(tenantId, 'table.status_changed', { ...data, branchId });
  }

  async paymentReceived(tenantId: string, branchId: string, data: Record<string, unknown>) {
    this.gateway.emitToBranch(branchId, 'payment:received', data);
    await this.fireWebhook(tenantId, 'payment.received', { ...data, branchId });
  }

  async paymentRefunded(tenantId: string, branchId: string, data: Record<string, unknown>) {
    this.gateway.emitToBranch(branchId, 'payment:refunded', data);
    await this.fireWebhook(tenantId, 'payment.refunded', { ...data, branchId });
  }

  async reservationCreated(tenantId: string, data: Record<string, unknown>) {
    this.gateway.emitToTenant(tenantId, 'reservation:created', data);
    await this.fireWebhook(tenantId, 'reservation.created', data);
  }

  async reservationUpdated(tenantId: string, data: Record<string, unknown>) {
    this.gateway.emitToTenant(tenantId, 'reservation:updated', data);
    await this.fireWebhook(tenantId, 'reservation.updated', data);
  }

  async reservationDeleted(tenantId: string, data: Record<string, unknown>) {
    this.gateway.emitToTenant(tenantId, 'reservation:deleted', data);
    await this.fireWebhook(tenantId, 'reservation.deleted', data);
  }

  async staffUpdated(tenantId: string, branchId: string, data: Record<string, unknown>) {
    this.gateway.emitToBranch(branchId, 'staff:updated', data);
    await this.fireWebhook(tenantId, 'staff.updated', { ...data, branchId });
  }

  async attendanceRecorded(tenantId: string, branchId: string, data: Record<string, unknown>) {
    this.gateway.emitToBranch(branchId, 'attendance:recorded', data);
  }

  async shiftAssigned(tenantId: string, branchId: string, data: Record<string, unknown>) {
    this.gateway.emitToBranch(branchId, 'shift:assigned', data);
  }

  async inventoryUpdated(tenantId: string, data: Record<string, unknown>) {
    this.gateway.emitToTenant(tenantId, 'inventory:updated', data);
    await this.fireWebhook(tenantId, 'inventory.updated', data);
    await this.fireDomainEvent(tenantId, 'inventory.updated', data);
  }

  async stockLow(tenantId: string, branchId: string, data: Record<string, unknown>) {
    this.gateway.emitToBranch(branchId, 'inventory:low', data);
    await this.fireWebhook(tenantId, 'inventory.low_stock', { ...data, branchId });
    await this.fireDomainEvent(tenantId, 'inventory.low_stock', { ...data, branchId });
  }

  async stockMovement(tenantId: string, data: Record<string, unknown>) {
    this.gateway.emitToTenant(tenantId, 'inventory:stock_movement', data);
  }

  async invoiceGenerated(tenantId: string, branchId: string, data: Record<string, unknown>) {
    this.gateway.emitToBranch(branchId, 'invoice:generated', data);
    await this.queues.generateInvoice({ tenantId, orderId: data.orderId as string, branchId });
    await this.fireWebhook(tenantId, 'invoice.generated', { ...data, branchId });
    await this.fireDomainEvent(tenantId, 'invoice.generated', { ...data, branchId });
  }

  async subscriptionStatusChanged(tenantId: string, data: Record<string, unknown>) {
    this.gateway.emitToTenant(tenantId, 'subscription:status_changed', data);
    await this.fireWebhook(tenantId, 'subscription.status_changed', data);
    await this.fireDomainEvent(tenantId, 'subscription.status_changed', data);
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
    await this.fireDomainEvent(tenantId, 'support.updated', data);
  }

  // ── Platform ──

  async platformSettingsChanged(data: Record<string, unknown>) {
    this.gateway.emitToTenant('platform', 'platform:settings_changed', data);
  }

  // ── Item Status (kitchen) ──

  async itemStatusChanged(tenantId: string, branchId: string, data: Record<string, unknown>) {
    this.gateway.emitToBranch(branchId, 'item:status-changed', data);
  }

  // ── Dining Sessions ──

  async diningSessionCreated(tenantId: string, branchId: string, data: Record<string, unknown>) {
    this.gateway.emitToBranch(branchId, 'dining:session-created', data);
    await this.fireWebhook(tenantId, 'dining.session.created', { ...data, branchId });
  }

  async diningGuestJoined(tenantId: string, branchId: string, data: Record<string, unknown>) {
    this.gateway.emitToBranch(branchId, 'dining:guest-joined', data);
  }

  async diningGuestLeft(tenantId: string, branchId: string, data: Record<string, unknown>) {
    this.gateway.emitToBranch(branchId, 'dining:guest-left', data);
  }

  async diningCartUpdated(tenantId: string, branchId: string, data: Record<string, unknown>) {
    this.gateway.emitToBranch(branchId, 'dining:cart-updated', data);
  }

  async diningOrderPlaced(tenantId: string, branchId: string, data: Record<string, unknown>) {
    this.gateway.emitToBranch(branchId, 'dining:order-placed', data);
    await this.orderCreated(tenantId, branchId, data);
  }

  async diningBillUpdated(tenantId: string, branchId: string, data: Record<string, unknown>) {
    this.gateway.emitToBranch(branchId, 'dining:bill-updated', data);
  }

  async diningPaymentReceived(tenantId: string, branchId: string, data: Record<string, unknown>) {
    this.gateway.emitToBranch(branchId, 'dining:payment-received', data);
    await this.paymentReceived(tenantId, branchId, data);
  }

  async diningSessionSettled(tenantId: string, branchId: string, data: Record<string, unknown>) {
    this.gateway.emitToBranch(branchId, 'dining:session-settled', data);
    await this.fireWebhook(tenantId, 'dining.session.settled', { ...data, branchId });
  }

  // ── Order tracking (customer-facing) ──

  async orderTrackingEvent(orderId: string, event: string, data: Record<string, unknown>) {
    this.gateway.emitToOrder(orderId, event, data);
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

  emitToTenantPublicBySlug(slug: string, event: string, data: Record<string, unknown>) {
    this.gateway.emitToTenantPublicBySlug(slug, event, data);
  }

  emitToRoomPublic(room: string, event: string, data: Record<string, unknown>) {
    this.gateway.emitToRoomPublic(room, event, data);
  }
}
