import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { BillingService } from './billing.service';
import { BillingController } from './billing.controller';
import { SubscriptionScheduler } from './subscription-scheduler';
import { PrismaService } from '../../prisma/prisma.service';
import { PaymentGateway } from '../../common/providers/payment-gateway';
import { StubPaymentGateway } from '../../common/providers/stub-payment.gateway';

@Module({
  imports: [ScheduleModule.forRoot()],
  controllers: [BillingController],
  providers: [
    BillingService,
    SubscriptionScheduler,
    PrismaService,
    {
      provide: PaymentGateway,
      useClass: StubPaymentGateway,
    },
  ],
  exports: [BillingService],
})
export class BillingModule {}
