export interface AddCartItemRequest {
  productId: string;
  /** Integer, minimum 1. */
  quantity: number;
}

export interface UpdateCartItemRequest {
  /** Integer, minimum 1. */
  quantity: number;
}

export interface CartItem {
  id: string;
  productId: string;
  name: string;
  quantity: number;
  unitPriceCents: number;
  lineTotalCents: number;
  slug?: string;
  imagePath?: string;
  stock?: number;
}

export interface Cart {
  id: string;
  status: string;
  items: CartItem[];
  subtotalCents: number;
  createdAt?: string;
  /** Present once the cart belongs to a customer. */
  userId?: string;
}

/** POST /api/v1/carts without a bearer token also returns the guest cart token. */
export interface GuestCart extends Cart {
  accessToken: string;
}

/** Item returned by add (201) and update (200); update omits the name. */
export interface CartItemChange {
  id: string;
  productId: string;
  quantity: number;
  unitPriceCents: number;
  lineTotalCents: number;
  name?: string;
}

/** A customer bearer token or the guest cart token sent as X-Cart-Token. */
export type CartCredentials = { accessToken: string } | { cartToken: string };
