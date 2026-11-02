import type { APIResponse } from '@playwright/test';
import { BaseApiClient, type RequestOptions } from './BaseApiClient';
import { bearerOptions } from './bearer';
import type { AddCartItemRequest, UpdateCartItemRequest } from '../models/cart';

/** HTTP operations for the shopping cart. Assertions stay in tests. */
export class CartsApi extends BaseApiClient {
  /** POST /api/v1/carts - 201, new Cart. A customer token binds the cart to the account. */
  async create(accessToken?: string): Promise<APIResponse> {
    return this.post('/api/v1/carts', undefined, accessToken === undefined ? {} : bearerOptions(accessToken));
  }

  /** GET /api/v1/carts/{id} - 200, Cart owned by the token holder. */
  async getById(cartId: string, accessToken?: string, options: RequestOptions = {}): Promise<APIResponse> {
    return this.get(`/api/v1/carts/${encodeURIComponent(cartId)}`, {
      ...options,
      headers: { ...options.headers, ...(accessToken === undefined ? {} : bearerOptions(accessToken).headers) },
    });
  }

  /** POST /api/v1/carts/{id}/items - 201, added CartItem. */
  async addItem(
    cartId: string,
    productId: string,
    quantity: number,
    accessToken?: string,
    options: RequestOptions = {},
  ): Promise<APIResponse> {
    const body: AddCartItemRequest = { productId, quantity };
    return this.post(
      `/api/v1/carts/${encodeURIComponent(cartId)}/items`,
      body,
      { ...options, headers: { ...options.headers, ...(accessToken === undefined ? {} : bearerOptions(accessToken).headers) } },
    );
  }

  /** PATCH /api/v1/carts/{id}/items/{itemId} - 200, updated item (schema unspecified). */
  async updateItem(cartId: string, itemId: string, body: UpdateCartItemRequest, accessToken?: string, options: RequestOptions = {}): Promise<APIResponse> {
    return this.patch(`/api/v1/carts/${encodeURIComponent(cartId)}/items/${encodeURIComponent(itemId)}`, body, {
      ...options,
      headers: { ...options.headers, ...(accessToken === undefined ? {} : bearerOptions(accessToken).headers) },
    });
  }

  /** DELETE /api/v1/carts/{id}/items/{itemId} - 204, no body. */
  async removeItem(cartId: string, itemId: string, accessToken?: string, options: RequestOptions = {}): Promise<APIResponse> {
    return this.delete(`/api/v1/carts/${encodeURIComponent(cartId)}/items/${encodeURIComponent(itemId)}`, {
      ...options,
      headers: { ...options.headers, ...(accessToken === undefined ? {} : bearerOptions(accessToken).headers) },
    });
  }

  /** POST /api/v1/carts/{id}/attach - 200, attached cart (schema unspecified). */
  async attach(cartId: string, accessToken: string, options: RequestOptions = {}): Promise<APIResponse> {
    return this.post(`/api/v1/carts/${encodeURIComponent(cartId)}/attach`, undefined, {
      ...options,
      headers: { ...options.headers, ...bearerOptions(accessToken).headers },
    });
  }
}
