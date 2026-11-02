import { randomUUID } from 'node:crypto';
import { test as base, expect } from './combined';
import type { ProductDetails } from '../api/models/product';
import type { PlacedOrder } from '../api/models/order';
import {
  ActivityService, AuthService, CartService, InventoryService, LabService, OrderService, ProductService,
  ReviewService, SystemService, UserService,
} from '../api/services';
import { orderShippingAddress } from '../shared/data/shippingAddress';

type ServiceFixtures = {
  authService: AuthService;
  userService: UserService;
  productService: ProductService;
  inventoryService: InventoryService;
  cartService: CartService;
  orderService: OrderService;
  reviewService: ReviewService;
  activityService: ActivityService;
  labService: LabService;
  systemService: SystemService;
};

type DataFixtures = {
  /** Access token of the shared store admin (validAdminUser), signed in once by global setup. */
  adminToken: string;
  /** Access token of the shared customer (validUser), signed in once by global setup. */
  customerToken: string;
  /** Unique product with 20 units in stock; archived after the test. */
  stockedProduct: ProductDetails;
  /** Customer order for 2 x stockedProduct; cancelled after the test while still cancellable. */
  placedOrder: PlacedOrder;
};

/** Adds typed services and isolated product/order data to the combined fixtures. */
export const test = base.extend<ServiceFixtures & DataFixtures>({
  authService: async ({ authApi }, use) => {
    await use(new AuthService(authApi));
  },
  userService: async ({ usersApi }, use) => {
    await use(new UserService(usersApi));
  },
  productService: async ({ productsApi }, use) => {
    await use(new ProductService(productsApi));
  },
  inventoryService: async ({ inventoryApi }, use) => {
    await use(new InventoryService(inventoryApi));
  },
  cartService: async ({ cartsApi }, use) => {
    await use(new CartService(cartsApi));
  },
  orderService: async ({ ordersApi }, use) => {
    await use(new OrderService(ordersApi));
  },
  reviewService: async ({ reviewsApi }, use) => {
    await use(new ReviewService(reviewsApi));
  },
  activityService: async ({ activityApi, dashboardApi }, use) => {
    await use(new ActivityService(activityApi, dashboardApi));
  },
  labService: async ({ labApi }, use) => {
    await use(new LabService(labApi));
  },
  systemService: async ({ systemApi, graphQLApi }, use) => {
    await use(new SystemService(systemApi, graphQLApi));
  },
  adminToken: async ({ authToken }, use) => {
    await use(authToken);
  },
  customerToken: async ({ customerSession }, use) => {
    await use(customerSession.accessToken);
  },
  stockedProduct: async ({ productService, inventoryService, adminToken }, use) => {
    const suffix = randomUUID();
    const product = await productService.create({
      sku: `API-${suffix}`,
      slug: `api-${suffix}`,
      name: `API test product ${suffix}`,
      description: 'Isolated product for API endpoint tests.',
      category: 'API tests',
      priceCents: 2500,
    }, adminToken);
    try {
      await inventoryService.setStock(product.sku, 20, product.version, adminToken);
      await use(await productService.get(product.id));
    } finally {
      await productService.archive(product.id, adminToken);
    }
  },
  placedOrder: async ({ cartService, orderService, customerToken, stockedProduct }, use) => {
    const credentials = { accessToken: customerToken };
    const cart = await cartService.createForCustomer(customerToken);
    await cartService.addItem(cart.id, stockedProduct.id, 2, credentials);
    const order = await orderService.place({ cartId: cart.id, shippingAddress: orderShippingAddress }, customerToken);
    try {
      await use(order);
    } finally {
      const { status } = await orderService.get(order.id, customerToken);
      if (status === 'confirmed' || status === 'pending' || status === 'processing') {
        await orderService.cancel(order.id, customerToken);
      }
    }
  },
});

export { expect };
