import { Injectable, Logger } from '@nestjs/common';
import {
  PaymentGateway,
  PaymentResult,
  SubscriptionPaymentData,
} from './payment-gateway';

@Injectable()
export class StubPaymentGateway extends PaymentGateway {
  private readonly logger = new Logger(StubPaymentGateway.name);

  async createOrder(data: SubscriptionPaymentData): Promise<PaymentResult> {
    this.logger.log(`[STUB] Creating order for ${data.customerEmail}: ₹${data.amount}`);
    return {
      success: true,
      transactionId: `stub_txn_${Date.now()}`,
      razorpayOrderId: `stub_order_${Date.now()}`,
    };
  }

  async verifyPayment(
    transactionId: string,
    _signature: string,
  ): Promise<PaymentResult> {
    this.logger.log(`[STUB] Verifying payment: ${transactionId}`);
    return {
      success: true,
      transactionId,
    };
  }

  async refund(
    transactionId: string,
    amount: number,
  ): Promise<PaymentResult> {
    this.logger.log(`[STUB] Refunding ₹${amount} for txn: ${transactionId}`);
    return {
      success: true,
      transactionId: `stub_refund_${Date.now()}`,
    };
  }
}
