import type { CartsApi } from '../clients/CartsApi';
import type { RequestOptions } from '../clients/BaseApiClient';
import type { Cart, CartCredentials, CartItem, CartItemChange, GuestCart } from '../models/cart';
import { readEmpty, readJson } from './serviceResponse';

/**
 * Cart workflows on top of CartsApi. Returns typed models and throws ApiStatusError on an
 * unexpected status. Use CartsApi directly to assert error responses.
 */
export class CartService {
  constructor(private readonly api: CartsApi) {}

  /** POST /api/v1/carts with a bearer token - 201, cart bound to the customer. */
  async createForCustomer(accessToken: string): Promise<Cart> {
    return readJson<Cart>(await this.api.create(accessToken), 201, 'Create customer cart');
  }

  /** POST /api/v1/carts without a token - 201, guest cart including its cart token. */
  async createGuest(): Promise<GuestCart> {
    return readJson<GuestCart>(await this.api.create(), 201, 'Create guest cart');
  }

  /** GET /api/v1/carts/{id} - 200. */
  async get(cartId: string, credentials: CartCredentials): Promise<Cart> {
    const [accessToken, options] = this.auth(credentials);
    return readJson<Cart>(await this.api.getById(cartId, accessToken, options), 200, 'Read cart');
  }

  /** Items of the cart, read through GET /api/v1/carts/{id}. */
  async listItems(cartId: string, credentials: CartCredentials): Promise<CartItem[]> {
    return (await this.get(cartId, credentials)).items;
  }

  /** POST /api/v1/carts/{id}/items - 201. */
  async addItem(cartId: string, productId: string, quantity: number, credentials: CartCredentials): Promise<CartItemChange> {
    const [accessToken, options] = this.auth(credentials);
    return readJson<CartItemChange>(
      await this.api.addItem(cartId, productId, quantity, accessToken, options), 201, 'Add cart item',
    );
  }

  /** PATCH /api/v1/carts/{id}/items/{itemId} - 200. */
  async updateItem(cartId: string, itemId: string, quantity: number, credentials: CartCredentials): Promise<CartItemChange> {
    const [accessToken, options] = this.auth(credentials);
    return readJson<CartItemChange>(
      await this.api.updateItem(cartId, itemId, { quantity }, accessToken, options), 200, 'Update cart item',
    );
  }

  /** DELETE /api/v1/carts/{id}/items/{itemId} - 204. */
  async removeItem(cartId: string, itemId: string, credentials: CartCredentials): Promise<void> {
    const [accessToken, options] = this.auth(credentials);
    await readEmpty(await this.api.removeItem(cartId, itemId, accessToken, options), 204, 'Remove cart item');
  }

  /** POST /api/v1/carts/{id}/attach - 200, guest cart now owned by the customer. */
  async attach(cartId: string, cartToken: string, accessToken: string): Promise<Cart> {
    return readJson<Cart>(
      await this.api.attach(cartId, accessToken, { headers: { 'X-Cart-Token': cartToken } }), 200, 'Attach cart',
    );
  }

  private auth(credentials: CartCredentials): [string | undefined, RequestOptions] {
    return 'accessToken' in credentials
      ? [credentials.accessToken, {}]
      : [undefined, { headers: { 'X-Cart-Token': credentials.cartToken } }];
  }
}
