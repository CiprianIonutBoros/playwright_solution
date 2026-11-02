export interface PaymentWebhookRequest {
  eventId: string;
  orderId: string;
  outcome: 'succeeded' | 'failed';
}
