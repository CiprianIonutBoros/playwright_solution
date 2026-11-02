import type { APIResponse } from '@playwright/test';
import { BaseApiClient } from './BaseApiClient';
import { bearerOptions } from './bearer';
import type { SelectLabProfileRequest } from '../models/lab';

export class LabApi extends BaseApiClient {
  /** GET /api/v1/lab/profile - 200, active profile (schema unspecified). */
  async getProfile(accessToken: string): Promise<APIResponse> {
    return this.get('/api/v1/lab/profile', bearerOptions(accessToken));
  }

  /** PUT /api/v1/lab/profile - 200, selected profile (schema unspecified). */
  async selectProfile(body: SelectLabProfileRequest, accessToken: string): Promise<APIResponse> {
    return this.put('/api/v1/lab/profile', body, bearerOptions(accessToken));
  }

  /** POST /api/v1/lab/reset - 200, reset result (schema unspecified). */
  async reset(accessToken: string): Promise<APIResponse> {
    return this.post('/api/v1/lab/reset', undefined, bearerOptions(accessToken));
  }
}
