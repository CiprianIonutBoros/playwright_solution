export interface CreateReviewRequest {
  productId: string;
  orderId: string;
  /** Integer, from 1 to 5 inclusive. */
  rating: number;
  comment: string;
}

/** POST /api/v1/reviews - 201. */
export interface Review extends CreateReviewRequest {
  id: string;
  userId: string;
  createdAt: string;
}
