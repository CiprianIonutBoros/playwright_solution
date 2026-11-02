import type { APIResponse } from '@playwright/test';
import { BaseApiClient, type RequestOptions } from './BaseApiClient';
import { bearerOptions } from './bearer';
import type { CreateProductRequest, UpdateProductRequest } from '../models/product';

/** HTTP operations for DemoShop's public catalog. Assertions stay in tests. */
export class ProductsApi extends BaseApiClient {
  /** GET /api/v1/products - 200, ProductList with items and page. */
  async list(params?: RequestOptions['params']): Promise<APIResponse> {
    return this.get('/api/v1/products', { params });
  }

  /** GET /api/v1/products/{id} - 200, Product; unknown id gives 404 PRODUCT_NOT_FOUND. */
  async getById(id: string, options: RequestOptions = {}): Promise<APIResponse> {
    return this.get(`/api/v1/products/${encodeURIComponent(id)}`, options);
  }

  /** GET /api/v1/products?search={term} - 200, ProductList filtered by term. */
  async search(term: string): Promise<APIResponse> {
    return this.get('/api/v1/products', { params: { search: term } });
  }

  /** POST /api/v1/admin/products - 201, created product (schema unspecified). */
  async create(body: CreateProductRequest, accessToken: string): Promise<APIResponse> {
    return this.post('/api/v1/admin/products', body, bearerOptions(accessToken));
  }

  /** PATCH /api/v1/admin/products/{id} - 200, updated product (schema unspecified). */
  async update(id: string, body: UpdateProductRequest, accessToken: string, ifMatch?: string): Promise<APIResponse> {
    const options = bearerOptions(accessToken);
    return this.patch(`/api/v1/admin/products/${encodeURIComponent(id)}`, body, {
      headers: { ...options.headers, ...(ifMatch === undefined ? {} : { 'If-Match': ifMatch }) },
    });
  }

  /** DELETE /api/v1/admin/products/{id} - 204, no body. */
  async archive(id: string, accessToken: string): Promise<APIResponse> {
    return this.delete(`/api/v1/admin/products/${encodeURIComponent(id)}`, bearerOptions(accessToken));
  }
}