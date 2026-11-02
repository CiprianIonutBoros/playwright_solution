import type { ProductsApi } from '../clients/ProductsApi';
import type { RequestOptions } from '../clients/BaseApiClient';
import type { CreateProductRequest, ProductDetails, ProductList, UpdateProductRequest } from '../models/product';
import { readEmpty, readJson } from './serviceResponse';

/** Catalog and product administration on top of ProductsApi. */
export class ProductService {
  constructor(private readonly api: ProductsApi) {}

  /** GET /api/v1/products - 200. */
  async list(params?: RequestOptions['params']): Promise<ProductList> {
    return readJson<ProductList>(await this.api.list(params), 200, 'List products');
  }

  /** GET /api/v1/products?search={term} - 200. */
  async search(term: string): Promise<ProductList> {
    return readJson<ProductList>(await this.api.search(term), 200, 'Search products');
  }

  /** GET /api/v1/products/{id} - 200. */
  async get(productId: string): Promise<ProductDetails> {
    return (await this.getWithETag(productId)).product;
  }

  /** GET /api/v1/products/{id} - 200, with the ETag used for If-Match updates. */
  async getWithETag(productId: string): Promise<{ product: ProductDetails; etag: string | undefined }> {
    const response = await this.api.getById(productId);
    const product = await readJson<ProductDetails>(response, 200, 'Read product');
    return { product, etag: response.headers().etag };
  }

  /** POST /api/v1/admin/products - 201. */
  async create(body: CreateProductRequest, accessToken: string): Promise<ProductDetails> {
    return readJson<ProductDetails>(await this.api.create(body, accessToken), 201, 'Create product');
  }

  /** PATCH /api/v1/admin/products/{id} - 200. */
  async update(
    productId: string, body: UpdateProductRequest, accessToken: string, ifMatch?: string,
  ): Promise<ProductDetails> {
    return readJson<ProductDetails>(
      await this.api.update(productId, body, accessToken, ifMatch), 200, 'Update product',
    );
  }

  /** DELETE /api/v1/admin/products/{id} - 204, archives the product. */
  async archive(productId: string, accessToken: string): Promise<void> {
    await readEmpty(await this.api.archive(productId, accessToken), 204, 'Archive product');
  }
}
