import type { APIResponse } from '@playwright/test';
import { BaseApiClient, type RequestOptions } from './BaseApiClient';
import { bearerOptions } from './bearer';

export class ActivityApi extends BaseApiClient {
  /** GET /api/v1/activity - 200, activity page (schema unspecified). */
  async list(accessToken: string, params?: RequestOptions['params']): Promise<APIResponse> {
    return this.get('/api/v1/activity', { ...bearerOptions(accessToken), params });
  }

  /**
   * GET /api/v1/events - 200, text/event-stream.
   * Playwright buffers the response; use a streaming client for an open-ended subscription.
   */
  async events(accessToken: string, options: RequestOptions = {}): Promise<APIResponse> {
    return this.get('/api/v1/events', {
      ...options,
      headers: { ...options.headers, ...bearerOptions(accessToken).headers },
    });
  }
}
