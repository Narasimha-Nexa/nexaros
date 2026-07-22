import { Injectable, Logger } from '@nestjs/common';
import { EventsGateway } from './events.gateway';
import { PublicEventsGateway } from './public-events.gateway';

@Injectable()
export class GatewayService {
  private readonly logger = new Logger(GatewayService.name);

  constructor(
    private eventsGateway: EventsGateway,
    private publicGateway: PublicEventsGateway,
  ) {}

  /**
   * Emit to a room on the /public namespace with null-safety.
   * Silently skips if the WebSocket server hasn't initialized yet.
   */
  private emitToPublicNamespace(room: string, event: string, data: Record<string, unknown>) {
    const server = this.publicGateway.server;
    if (!server?.to) return;
    try {
      // publicGateway.server is the /public Namespace instance.
      server.to(room).emit(event, data);
    } catch (err) {
      this.logger.warn(`emitToPublic failed (WS may not be ready): ${(err as Error).message}`);
    }
  }

  emitToTenant(tenantId: string, event: string, data: Record<string, unknown>) {
    this.eventsGateway.server?.to(`tenant:${tenantId}`).emit(event, data);
  }

  emitToBranch(branchId: string, event: string, data: Record<string, unknown>) {
    this.eventsGateway.server?.to(`branch:${branchId}`).emit(event, data);
  }

  /**
   * Emit an event to all clients tracking a specific order on the /public namespace.
   */
  emitToOrder(orderId: string, event: string, data: Record<string, unknown>) {
    this.emitToPublicNamespace(`order:${orderId}`, event, data);
  }

  /**
   * Emit to all customers viewing a restaurant's page via the /public namespace.
   */
  emitToTenantPublicBySlug(slug: string, event: string, data: Record<string, unknown>) {
    this.emitToPublicNamespace(`tenant:${slug}`, event, data);
  }

  /**
   * Emit to a room on the /public namespace directly.
   */
  emitToRoomPublic(room: string, event: string, data: Record<string, unknown>) {
    this.emitToPublicNamespace(room, event, data);
  }

  emitToRoom(room: string, event: string, data: Record<string, unknown>) {
    this.eventsGateway.server?.to(room).emit(event, data);
  }
}
