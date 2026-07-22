import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { BillingService } from './billing.service';
import { BillingController } from './billing.controller';
import { SubscriptionScheduler } from './subscription-scheduler';
import { PrismaService } from '../../prisma/prisma.service';
import { PaymentGateway } from '../../common/providers/payment-gateway';
import { StubPaymentGateway } from '../../common/providers/stub-payment.gateway';
import { RazorpayPaymentGateway } from '../../common/providers/razorpay-payment.gateway';

@Module({
  imports: [ScheduleModule.forRoot(), ConfigModule],
  controllers: [BillingController],
  providers: [
    BillingService,
    SubscriptionScheduler,
    PrismaService,
    {
      provide: PaymentGateway,
      useFactory: (config) => {
        const keyId = config.get('RAZORPAY_KEY_ID');
        const keySecret = config.get('RAZORPAY_KEY_SECRET');
        if (keyId && keySecret) {
          return new RazorpayPaymentGateway(config);
        }
        return new StubPaymentGateway();
      },
      inject: [ConfigService],
    },
  ],
  exports: [BillingService, PaymentGateway],
})
export class BillingModule {}
