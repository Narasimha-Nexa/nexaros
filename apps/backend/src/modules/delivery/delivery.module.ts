import { Module } from '@nestjs/common';
import { DeliveryService } from './delivery.service';
import { DeliveryController } from './delivery.controller';
import { DeliveryPublicController } from './delivery-public.controller';
import { PrismaModule } from '../../prisma/prisma.module';
import { AuthModule } from '../auth/auth.module';
import { EventBusModule } from '../../common/event-bus/event-bus.module';

@Module({
  imports: [PrismaModule, AuthModule, EventBusModule],
  controllers: [DeliveryController, DeliveryPublicController],
  providers: [DeliveryService],
  exports: [DeliveryService],
})
export class DeliveryModule {}
