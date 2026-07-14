import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  PaymentGateway,
  PaymentResult,
  SubscriptionPaymentData,
} from './payment-gateway';

@Injectable()
export class RazorpayPaymentGateway extends PaymentGateway {
  private readonly logger = new Logger(RazorpayPaymentGateway.name);
  private razorpay: any;

  constructor(private configService: ConfigService) {
    super();
    const keyId = this.configService.get('RAZORPAY_KEY_ID');
    const keySecret = this.configService.get('RAZORPAY_KEY_SECRET');

    if (keyId && keySecret) {
      const Razorpay = require('razorpay');
      this.razorpay = new Razorpay({
        key_id: keyId,
        key_secret: keySecret,
      });
      this.logger.log('Razorpay gateway initialized (LIVE mode)');
    } else {
      this.logger.warn('Razorpay keys not configured — payments will fail');
    }
  }

  async createOrder(data: SubscriptionPaymentData): Promise<PaymentResult> {
    if (!this.razorpay) {
      return { success: false, error: 'Razorpay not configured' };
    }

    try {
      const amountInPaise = Math.round(data.amount * 100);

      const order = await this.razorpay.orders.create({
        amount: amountInPaise,
        currency: data.currency || 'INR',
        receipt: `rcpt_${Date.now()}`,
        notes: {
          plan: data.planSlug,
          email: data.customerEmail,
        },
      });

      this.logger.log(`Razorpay order created: ${order.id} — ₹${data.amount}`);

      return {
        success: true,
        razorpayOrderId: order.id,
        transactionId: order.id,
      };
    } catch (error: any) {
      this.logger.error(`Razorpay order creation failed: ${error.message}`);
      return { success: false, error: error.message };
    }
  }

  async verifyPayment(
    razorpayOrderId: string,
    razorpayPaymentId: string,
    razorpaySignature: string,
  ): Promise<PaymentResult> {
    if (!this.razorpay) {
      return { success: false, error: 'Razorpay not configured' };
    }

    try {
      const crypto = require('crypto');
      const keySecret = this.configService.get('RAZORPAY_KEY_SECRET');

      const expectedSignature = crypto
        .createHmac('sha256', keySecret)
        .update(`${razorpayOrderId}|${razorpayPaymentId}`)
        .digest('hex');

      if (expectedSignature !== razorpaySignature) {
        this.logger.warn(`Payment signature mismatch for order ${razorpayOrderId}`);
        return { success: false, error: 'Invalid payment signature' };
      }

      const payment = await this.razorpay.payments.fetch(razorpayPaymentId);

      if (payment.status !== 'captured') {
        this.logger.warn(`Payment ${razorpayPaymentId} not captured: ${payment.status}`);
        return { success: false, error: `Payment ${payment.status}` };
      }

      this.logger.log(`Payment verified: ${razorpayPaymentId} — ₹${payment.amount / 100}`);

      return {
        success: true,
        transactionId: razorpayPaymentId,
        razorpayOrderId,
      };
    } catch (error: any) {
      this.logger.error(`Payment verification failed: ${error.message}`);
      return { success: false, error: error.message };
    }
  }

  async refund(
    transactionId: string,
    amount: number,
  ): Promise<PaymentResult> {
    if (!this.razorpay) {
      return { success: false, error: 'Razorpay not configured' };
    }

    try {
      const amountInPaise = Math.round(amount * 100);

      const refund = await this.razorpay.payments.refund(transactionId, {
        amount: amountInPaise,
        speed: 'normal',
        notes: { reason: 'Subscription refund' },
      });

      this.logger.log(`Refund initiated: ${refund.id} — ₹${amount} for payment ${transactionId}`);

      return {
        success: true,
        transactionId: refund.id,
      };
    } catch (error: any) {
      this.logger.error(`Refund failed: ${error.message}`);
      return { success: false, error: error.message };
    }
  }

  async getPaymentDetails(paymentId: string) {
    if (!this.razorpay) return null;
    try {
      return await this.razorpay.payments.fetch(paymentId);
    } catch {
      return null;
    }
  }
}
