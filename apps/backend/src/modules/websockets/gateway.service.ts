import { Injectable } from '@nestjs/common';
import { EventsGateway } from './events.gateway';

@Injectable()
export class GatewayService {
  constructor(private eventsGateway: EventsGateway) {}

  emitToTenant(tenantId: string, event: string, data: Record<string, unknown>) {
    this.eventsGateway.server.to(`tenant:${tenantId}`).emit(event, data);
  }

  emitToBranch(branchId: string, event: string, data: Record<string, unknown>) {
    this.eventsGateway.server.to(`branch:${branchId}`).emit(event, data);
  }

  /**
   * Emit an event to all clients tracking a specific order on the /public namespace.
   * This enables real-time order tracking for customer-facing pages without auth.
   */
  emitToOrder(orderId: string, event: string, data: Record<string, unknown>) {
    this.eventsGateway.server.of('/public').to(`order:${orderId}`).emit(event, data);
  }

  emitToRoom(room: string, event: string, data: Record<string, unknown>) {
    this.eventsGateway.server.to(room).emit(event, data);
  }
}
