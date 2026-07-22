import { Module } from '@nestjs/common';
import { OffersController } from './offers.controller';
import { OffersAdminController } from './offers-admin.controller';
import { OffersService } from './offers.service';
import { EventBusModule } from '../../common/event-bus/event-bus.module';

@Module({
  imports: [EventBusModule],
  controllers: [OffersController, OffersAdminController],
  providers: [OffersService],
  exports: [OffersService],
})
export class OffersModule {}
