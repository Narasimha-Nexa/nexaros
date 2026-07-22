import { Module, Global, OnModuleInit } from '@nestjs/common';
import { ModuleRef } from '@nestjs/core';
import { EventBusService } from './event-bus.service';
import { WebsocketsModule } from '../../modules/websockets/websockets.module';
import { QueueModule } from '../queue/queue.module';

@Global()
@Module({
  imports: [WebsocketsModule, QueueModule],
  providers: [EventBusService],
  exports: [EventBusService],
})
export class EventBusModule implements OnModuleInit {
  constructor(private moduleRef: ModuleRef) {}

  onModuleInit() {
    try {
      const webhookService = this.moduleRef.get('WebhooksService', { strict: false });
      const eventBus = this.moduleRef.get(EventBusService);
      eventBus.setWebhookService(webhookService);
    } catch {
      // WebhooksService not yet available — webhooks won't fire until module is loaded
    }
  }
}
