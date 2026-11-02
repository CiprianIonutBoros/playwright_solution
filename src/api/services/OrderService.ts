import type { OrdersApi } from '../clients/OrdersApi';
import type { RequestOptions } from '../clients/BaseApiClient';
import type {
  CreateOrderRequest, OrderDetails, OrderList, OrderStatusChange, PlacedOrder, UpdateOrderStatusRequest,
} from '../models/order';
import { readJson } from './serviceResponse';

/** Order workflows on top of OrdersApi. Use OrdersApi directly to assert error responses. */
export class OrderService {
  constructor(private readonly api: OrdersApi) {}

  /** POST /api/v1/orders - 201. */
  async place(body: CreateOrderRequest, accessToken: string): Promise<PlacedOrder> {
    return readJson<PlacedOrder>(await this.api.create(body, accessToken), 201, 'Place order');
  }

  /** GET /api/v1/orders - 200, orders visible to the token holder. */
  async list(accessToken: string, params?: RequestOptions['params']): Promise<OrderList> {
    return readJson<OrderList>(await this.api.list(accessToken, params), 200, 'List orders');
  }

  /** GET /api/v1/orders/{id} - 200. */
  async get(orderId: string, accessToken: string): Promise<OrderDetails> {
    return readJson<OrderDetails>(await this.api.getById(orderId, accessToken), 200, 'Read order');
  }

  /** POST /api/v1/orders/{id}/cancel - 200. */
  async cancel(orderId: string, accessToken: string): Promise<OrderStatusChange> {
    return readJson<OrderStatusChange>(await this.api.cancel(orderId, accessToken), 200, 'Cancel order');
  }

  /** PATCH /api/v1/orders/{id}/status - 200. Requires a fulfilment role. */
  async advanceStatus(
    orderId: string, status: UpdateOrderStatusRequest['status'], accessToken: string,
  ): Promise<OrderStatusChange> {
    return readJson<OrderStatusChange>(
      await this.api.updateStatus(orderId, { status }, accessToken), 200, `Advance order to ${status}`,
    );
  }

  /** Walks a new order through processing, shipped and delivered. */
  async deliver(orderId: string, accessToken: string): Promise<OrderStatusChange> {
    await this.advanceStatus(orderId, 'processing', accessToken);
    await this.advanceStatus(orderId, 'shipped', accessToken);
    return this.advanceStatus(orderId, 'delivered', accessToken);
  }
}
