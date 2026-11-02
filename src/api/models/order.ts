export interface ShippingAddress {
  line1: string;
  line2?: string;
  city: string;
  region?: string;
  postalCode: string;
  country: string;
}

export interface CreateOrderRequest {
  cartId: string;
  shippingAddress: ShippingAddress;
  promoCode?: string;
}

export interface UpdateOrderStatusRequest {
  status: 'processing' | 'shipped' | 'delivered';
}

export interface Order {
  id: string;
  orderNumber: string;
  status: string;
  subtotalCents: number;
  discountCents: number;
  shippingCents: number;
  totalCents: number;
  currency: string;
  createdAt: string;
  customerName: string;
}

export interface OrderList {
  items: Order[];
  page: { limit: number; hasMore: boolean; nextCursor: string | null };
}

export interface OrderLine {
  productId: string;
  sku: string;
  productName: string;
  quantity: number;
  unitPriceCents: number;
  lineTotalCents: number;
  /** Present on GET /api/v1/orders/{id}, absent on placement. */
  id?: string;
}

/** POST /api/v1/orders - 201. */
export interface PlacedOrder extends Omit<Order, 'customerName'> {
  userId: string;
  shippingAddress: ShippingAddress;
  items: OrderLine[];
  /** True when an idempotent replay returned an existing order. */
  replayed: boolean;
}

/** GET /api/v1/orders/{id} - 200. */
export interface OrderDetails extends Order {
  customerEmail: string;
  shippingAddress: ShippingAddress;
  items: OrderLine[];
}

/** Cancel and status transitions return only the new state. */
export interface OrderStatusChange {
  id: string;
  status: string;
  updatedAt: string;
}
