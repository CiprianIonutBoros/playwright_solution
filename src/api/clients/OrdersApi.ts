import type { APIResponse } from '@playwright/test';
import { BaseApiClient, type RequestOptions } from './BaseApiClient';
import { bearerOptions } from './bearer';
import type { CreateOrderRequest, UpdateOrderStatusRequest } from '../models/order';

/** HTTP operations for the signed-in customer's orders. Assertions stay in tests. */
export class OrdersApi extends BaseApiClient {
  /** GET /api/v1/orders - 200, OrderList for the token holder. */
  async list(accessToken: string, params: RequestOptions['params'] = { limit: 30 }): Promise<APIResponse> {
    return this.get('/api/v1/orders', {
      ...bearerOptions(accessToken),
      params,
    });
  }

  /** POST /api/v1/orders - 201, placed order (schema unspecified). */
  async create(body: CreateOrderRequest, accessToken: string, options: RequestOptions = {}): Promise<APIResponse> {
    return this.post('/api/v1/orders', body, {
      ...options,
      headers: { ...options.headers, ...bearerOptions(accessToken).headers },
    });
  }

  /** GET /api/v1/orders/{id} - 200, visible order (schema unspecified). */
  async getById(id: string, accessToken: string): Promise<APIResponse> {
    return this.get(`/api/v1/orders/${encodeURIComponent(id)}`, bearerOptions(accessToken));
  }

  /** POST /api/v1/orders/{id}/cancel - 200, cancelled order (schema unspecified). */
  async cancel(id: string, accessToken: string): Promise<APIResponse> {
    return this.post(`/api/v1/orders/${encodeURIComponent(id)}/cancel`, undefined, bearerOptions(accessToken));
  }

  /** PATCH /api/v1/orders/{id}/status - 200, updated order (schema unspecified). */
  async updateStatus(id: string, body: UpdateOrderStatusRequest, accessToken: string): Promise<APIResponse> {
    return this.patch(`/api/v1/orders/${encodeURIComponent(id)}/status`, body, bearerOptions(accessToken));
  }
}
