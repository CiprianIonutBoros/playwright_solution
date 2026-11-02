import type { ReviewsApi } from '../clients/ReviewsApi';
import type { CreateReviewRequest, Review } from '../models/review';
import { readJson } from './serviceResponse';

export class ReviewService {
  constructor(private readonly api: ReviewsApi) {}

  /** POST /api/v1/reviews - 201. The order must be delivered. */
  async create(body: CreateReviewRequest, accessToken: string): Promise<Review> {
    return readJson<Review>(await this.api.create(body, accessToken), 201, 'Create review');
  }
}
