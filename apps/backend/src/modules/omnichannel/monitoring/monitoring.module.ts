import { Module, Global } from '@nestjs/common';
import { ChannelHealthController } from './channel-health.controller';
import { ChannelHealthService } from './channel-health.service';
import { DeadLetterService } from './dead-letter.service';
import { SwiggyAdapter } from '../aggregator/adapters/swiggy.adapter';
import { ZomatoAdapter } from '../aggregator/adapters/zomato.adapter';
import { WhatsAppAdapter } from '../conversational/adapters/whatsapp.adapter';
import { InstagramAdapter } from '../conversational/adapters/instagram.adapter';
import { FacebookAdapter } from '../conversational/adapters/facebook.adapter';
import { PrismaModule } from '../../../prisma/prisma.module';
import { QueueModule } from '../../../common/queue/queue.module';
import { AuthModule } from '../../auth/auth.module';

@Global()
@Module({
  imports: [PrismaModule, QueueModule, AuthModule],
  controllers: [ChannelHealthController],
  providers: [
    ChannelHealthService,
    DeadLetterService,
    SwiggyAdapter,
    ZomatoAdapter,
    WhatsAppAdapter,
    InstagramAdapter,
    FacebookAdapter,
  ],
  exports: [
    ChannelHealthService,
    DeadLetterService,
    SwiggyAdapter,
    ZomatoAdapter,
    WhatsAppAdapter,
    InstagramAdapter,
    FacebookAdapter,
  ],
})
export class MonitoringModule {}
