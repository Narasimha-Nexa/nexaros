import { Module } from '@nestjs/common';
import { ReservationsService } from './reservations.service';
import { ReservationsController } from './reservations.controller';
import { ReservationsPublicController } from './reservations-public.controller';
import { PrismaModule } from '../../prisma/prisma.module';
import { AuthModule } from '../auth/auth.module';
import { EventBusModule } from '../../common/event-bus/event-bus.module';

@Module({
  imports: [PrismaModule, AuthModule, EventBusModule],
  controllers: [ReservationsController, ReservationsPublicController],
  providers: [ReservationsService],
  exports: [ReservationsService],
})
export class ReservationsModule {}
