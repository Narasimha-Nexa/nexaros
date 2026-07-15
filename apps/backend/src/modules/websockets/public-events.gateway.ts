import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  ConnectedSocket,
  MessageBody,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { PrismaService } from '../../prisma/prisma.service';

/**
 * Public WebSocket Gateway — /public namespace
 *
 * Allows unauthenticated clients to track orders in real-time.
 * Clients join `order:{orderId}` rooms to receive status updates.
 * No JWT required — clients only need the order ID (which is a UUID).
 */
@WebSocketGateway({
  cors: {
    origin: process.env.CORS_ORIGIN?.split(',') || [
      'http://localhost:3000',
      'http://localhost:3001',
      'http://localhost:3002',
      'http://localhost:3003',
    ],
  },
  namespace: '/public',
})
export class PublicEventsGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;

  constructor(private prisma: PrismaService) {}

  async handleConnection(client: Socket) {
    // Check if client sent an orderId to auto-join
    const orderId =
      client.handshake.query?.orderId ||
      client.handshake.auth?.orderId;

    if (orderId && typeof orderId === 'string') {
      const exists = await this.prisma.order.findUnique({
        where: { id: orderId },
        select: { id: true },
      });
      if (exists) {
        client.join(`order:${orderId}`);
        client.data.orderId = orderId;
        console.log(`[WS:PUBLIC] Client ${client.id} joined order:${orderId}`);
      }
    }
  }

  handleDisconnect(client: Socket) {
    console.log(`[WS:PUBLIC] Client disconnected: ${client.id}`);
  }

  @SubscribeMessage('join:order')
  async handleJoinOrder(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { orderId: string },
  ) {
    if (!data?.orderId) return;

    const exists = await this.prisma.order.findUnique({
      where: { id: data.orderId },
      select: { id: true },
    });

    if (exists) {
      client.join(`order:${data.orderId}`);
      client.data.orderId = data.orderId;
      return { success: true, orderId: data.orderId };
    }

    return { success: false, message: 'Order not found' };
  }

  @SubscribeMessage('leave:order')
  handleLeaveOrder(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { orderId: string },
  ) {
    if (data?.orderId) {
      client.leave(`order:${data.orderId}`);
    }
  }
}
