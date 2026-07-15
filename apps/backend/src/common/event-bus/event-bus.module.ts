import { Module, Global } from '@nestjs/common';
import { EventBusService } from './event-bus.service';
import { WebsocketsModule } from '../../modules/websockets/websockets.module';
import { QueueModule } from '../queue/queue.module';

@Global()
@Module({
  imports: [WebsocketsModule, QueueModule],
  providers: [EventBusService],
  exports: [EventBusService],
})
export class EventBusModule {}
