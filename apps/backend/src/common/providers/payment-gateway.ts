export interface PaymentResult {
  success: boolean;
  transactionId?: string;
  razorpayOrderId?: string;
  error?: string;
}

export interface SubscriptionPaymentData {
  amount: number;
  currency: string;
  planSlug: string;
  customerEmail: string;
  customerPhone?: string;
}

export abstract class PaymentGateway {
  abstract createOrder(data: SubscriptionPaymentData): Promise<PaymentResult>;
  abstract verifyPayment(transactionId: string, signature: string): Promise<PaymentResult>;
  abstract refund(transactionId: string, amount: number): Promise<PaymentResult>;
}
