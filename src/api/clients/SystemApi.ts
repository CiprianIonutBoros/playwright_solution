import type { APIResponse } from '@playwright/test';
import { BaseApiClient } from './BaseApiClient';

/** HTTP operations for DemoShop service status. Assertions stay in tests. */
export class SystemApi extends BaseApiClient {
  /** GET /health - 200, HealthStatus with status "ok". */
  async health(): Promise<APIResponse> {
    return this.get('/health');
  }
}
