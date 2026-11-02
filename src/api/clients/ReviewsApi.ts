import type { APIResponse } from '@playwright/test';
import { BaseApiClient } from './BaseApiClient';
import { bearerOptions } from './bearer';
import type { CreateReviewRequest } from '../models/review';

export class ReviewsApi extends BaseApiClient {
  /** POST /api/v1/reviews - 201, review (schema unspecified). */
  async create(body: CreateReviewRequest, accessToken: string): Promise<APIResponse> {
    return this.post('/api/v1/reviews', body, bearerOptions(accessToken));
  }
}
