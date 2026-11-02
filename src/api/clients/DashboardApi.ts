import type { APIResponse } from '@playwright/test';
import { BaseApiClient } from './BaseApiClient';
import { bearerOptions } from './bearer';

export class DashboardApi extends BaseApiClient {
  /** GET /api/v1/dashboard - 200, store metrics (schema unspecified). */
  async overview(accessToken: string): Promise<APIResponse> {
    return this.get('/api/v1/dashboard', bearerOptions(accessToken));
  }
}
