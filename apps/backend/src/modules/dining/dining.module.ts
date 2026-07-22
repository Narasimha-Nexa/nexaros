import { Module } from '@nestjs/common';
import { DiningSessionService } from './dining-session.service';
import { GuestSessionService } from './guest-session.service';
import { GuestCartService } from './guest-cart.service';
import { SplitPaymentService } from './split-payment.service';
import { SharedItemService } from './shared-item.service';
import { DiningController } from './dining.controller';
import { PublicDiningController } from './public-dining.controller';
import { PrismaModule } from '../../prisma/prisma.module';
import { AuthModule } from '../auth/auth.module';
import { WebsocketsModule } from '../websockets/websockets.module';

@Module({
  imports: [PrismaModule, AuthModule, WebsocketsModule],
  controllers: [DiningController, PublicDiningController],
  providers: [
    DiningSessionService,
    GuestSessionService,
    GuestCartService,
    SplitPaymentService,
    SharedItemService,
  ],
  exports: [
    DiningSessionService,
    GuestSessionService,
    GuestCartService,
    SplitPaymentService,
    SharedItemService,
  ],
})
export class DiningModule {}
