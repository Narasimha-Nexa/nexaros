import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  ConnectedSocket,
  MessageBody,
} from '@nestjs/websockets';
import { Logger } from '@nestjs/common';
import { Server, Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service';
import { AiChatService } from './ai-chat.service';
import { ChartService } from './chart.service';

@WebSocketGateway({
  cors: {
    origin: process.env.CORS_ORIGIN?.split(',') || ['http://localhost:3000'],
  },
  namespace: '/ai-chat',
})
export class AiChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server!: Server;

  private readonly logger = new Logger(AiChatGateway.name);

  constructor(
    private jwtService: JwtService,
    private configService: ConfigService,
    private prisma: PrismaService,
    private chatService: AiChatService,
    private chartService: ChartService,
  ) {}

  async handleConnection(client: Socket): Promise<void> {
    try {
      const token = client.handshake.auth?.token || client.handshake.headers?.authorization?.split(' ')[1];
      if (!token) {
        client.disconnect();
        return;
      }

      const payload = await this.jwtService.verifyAsync(token, {
        secret: this.configService.get('JWT_SECRET'),
      });

      const user = await this.prisma.user.findUnique({
        where: { id: payload.sub },
        select: { id: true, tenantId: true, firstName: true, lastName: true },
      });

      if (!user) {
        client.disconnect();
        return;
      }

      client.join(`tenant:${user.tenantId}`);
      client.join(`user:${user.id}`);
      client.data.userId = user.id;
      client.data.tenantId = user.tenantId;

      this.logger.log(`AI Chat connected: ${user.id} (tenant: ${user.tenantId})`);
    } catch {
      client.disconnect();
    }
  }

  handleDisconnect(client: Socket): void {
    this.logger.log(`AI Chat disconnected: ${client.data?.userId || 'unknown'}`);
  }

  @SubscribeMessage('chat:message')
  async handleMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { message: string; conversationId?: string },
  ): Promise<void> {
    const tenantId = client.data.tenantId;
    const userId = client.data.userId;

    if (!tenantId || !userId) {
      client.emit('chat:error', { error: 'Unauthorized' });
      return;
    }

    client.emit('typing:start', {});

    try {
      let fullContent = '';
      let finalConversationId = data.conversationId;

      const gen = this.chatService.streamChat(tenantId, userId, data.conversationId, data.message);

      for await (const chunk of gen) {
        const parsed = this.parseSSEChunk(chunk);
        if (parsed.token) {
          fullContent += parsed.token;
          client.emit('message:stream', { token: parsed.token, conversationId: finalConversationId });
        }
        if (parsed.done) {
          finalConversationId = parsed.conversationId;
        }
      }

      client.emit('typing:stop', {});
      client.emit('message:done', {
        content: fullContent,
        conversationId: finalConversationId,
        chart: this.chartService.extractChartFromResponse(fullContent),
      });
    } catch (error) {
      client.emit('typing:stop', {});
      client.emit('chat:error', { error: (error as Error).message || 'Chat failed' });
    }
  }

  @SubscribeMessage('chat:stop')
  handleStop(@ConnectedSocket() _client: Socket): void {
    // Abort controller would be needed for true cancellation
  }

  private parseSSEChunk(chunk: string): { token?: string; done?: boolean; conversationId?: string; chart?: unknown } {
    try {
      const jsonStr = chunk.replace('data: ', '').trim();
      if (!jsonStr) return {};
      const parsed = JSON.parse(jsonStr);
      return {
        token: parsed.token,
        done: parsed.done,
        conversationId: parsed.conversationId,
        chart: parsed.chart,
      };
    } catch {
      return {};
    }
  }
}
