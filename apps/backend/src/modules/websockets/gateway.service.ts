import { Injectable } from '@nestjs/common';
import { EventsGateway } from './events.gateway';

@Injectable()
export class GatewayService {
  constructor(private eventsGateway: EventsGateway) {}

  emitToTenant(tenantId: string, event: string, data: any) {
    this.eventsGateway.server.to(`tenant:${tenantId}`).emit(event, data);
  }

  emitToBranch(branchId: string, event: string, data: any) {
    this.eventsGateway.server.to(`branch:${branchId}`).emit(event, data);
  }

  emitToRoom(room: string, event: string, data: any) {
    this.eventsGateway.server.to(room).emit(event, data);
  }
}
