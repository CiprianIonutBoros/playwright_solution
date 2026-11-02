import type { APIResponse } from '@playwright/test';
import { BaseApiClient } from './BaseApiClient';
import { bearerOptions } from './bearer';
import type { UpdateInventoryRequest } from '../models/inventory';

export class InventoryApi extends BaseApiClient {
  /** PATCH /api/v1/inventory/{sku} - 200, stock and version (schema unspecified). */
  async update(sku: string, body: UpdateInventoryRequest, accessToken: string): Promise<APIResponse> {
    return this.patch(`/api/v1/inventory/${encodeURIComponent(sku)}`, body, bearerOptions(accessToken));
  }
}
