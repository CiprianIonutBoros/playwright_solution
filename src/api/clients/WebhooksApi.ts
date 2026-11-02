import type { APIResponse } from '@playwright/test';
import { BaseApiClient, type RequestOptions } from './BaseApiClient';
import type { PaymentWebhookRequest } from '../models/webhook';

export class WebhooksApi extends BaseApiClient {
  /** POST /api/v1/webhooks/payments - 202 applied or 200 duplicate, schema unspecified. */
  async payment(body: PaymentWebhookRequest, headers: NonNullable<RequestOptions['headers']>): Promise<APIResponse> {
    return this.post('/api/v1/webhooks/payments', body, { headers });
  }
}
