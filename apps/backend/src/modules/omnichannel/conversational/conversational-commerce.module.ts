import { Module } from '@nestjs/common';
import { ConversationalCommerceController } from './conversational-commerce.controller';
import { ConversationalCommerceService } from './conversational-commerce.service';
import { WhatsAppAdapter } from './adapters/whatsapp.adapter';
import { InstagramAdapter } from './adapters/instagram.adapter';
import { FacebookAdapter } from './adapters/facebook.adapter';
import { SessionStateService } from './services/session-state.service';
import { IntentExtractionService } from './services/intent-extraction.service';
import { OrderConversionService } from './services/order-conversion.service';
import { ConversationStatusWorker } from './workers/conversation-status.worker';
import { PrismaModule } from '../../../prisma/prisma.module';
import { QueueModule } from '../../../common/queue/queue.module';
import { WebsocketsModule } from '../../websockets/websockets.module';
import { CommonModule } from '../common/common.module';
import { MonitoringModule } from '../monitoring/monitoring.module';

@Module({
  imports: [PrismaModule, QueueModule, WebsocketsModule, CommonModule, MonitoringModule],
  controllers: [ConversationalCommerceController],
  providers: [
    ConversationalCommerceService,
    WhatsAppAdapter,
    InstagramAdapter,
    FacebookAdapter,
    SessionStateService,
    IntentExtractionService,
    OrderConversionService,
    ConversationStatusWorker,
  ],
  exports: [
    WhatsAppAdapter,
    InstagramAdapter,
    FacebookAdapter,
    SessionStateService,
    OrderConversionService,
  ],
})
export class ConversationalCommerceModule {}
