export interface CreateProductRequest {
  sku: string;
  slug: string;
  name: string;
  description: string;
  category: string;
  /** Integer, minimum 1. */
  priceCents: number;
  imagePath?: string;
}

export interface UpdateProductRequest {
  sku?: string;
  slug?: string;
  name?: string;
  description?: string;
  category?: string;
  /** Integer, minimum 1. */
  priceCents?: number;
  imagePath?: string;
}

/** A catalog list item: every product field except the reviews. */
export interface Product {
  id: string;
  sku: string;
  slug: string;
  name: string;
  description: string;
  category: string;
  priceCents: number;
  currency: string;
  stock: number;
  version: number;
  imagePath: string;
  archived: boolean;
  createdAt: string;
  updatedAt: string;
  averageRating: number;
  reviewCount: number;
}

export interface ProductList {
  items: Product[];
  page: { limit: number; offset: number; hasMore: boolean; nextCursor: string | null };
}

export interface ProductDetails extends Product {
  reviews: ProductReview[];
}

export interface ProductReview {
  id: string;
  rating: number;
  comment: string;
  createdAt: string;
  authorName: string;
}
