import { Module } from '@nestjs/common';
import { GatewayService } from './gateway.service';
import { EventsGateway } from './events.gateway';
import { PublicEventsGateway } from './public-events.gateway';
import { PrismaModule } from '../../prisma/prisma.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [PrismaModule, AuthModule],
  providers: [GatewayService, EventsGateway, PublicEventsGateway],
  exports: [GatewayService],
})
export class WebsocketsModule {}
