import { test, expect } from '../../src/fixtures/api';
import { registerAccount } from '../../src/api/helpers/accounts';
import { activeLabProfile } from '../../src/shared/data/lab';

test.describe('Dashboard', () => {
  // A newly registered customer has exactly one action (registering), no orders, and that one recent entry.
  // After the customer creates a cart, the activity count is 2 and the cart is the newest entry.
  test('new customer sees exactly their own metrics and activity', async ({ authApi, activityService, cartService }) => {
    const { session } = await registerAccount(authApi);
    const token = session.accessToken;

    const [registered] = (await activityService.list(token)).items;
    const { productCount: _before, ...afterRegister } = await activityService.dashboard(token);
    expect(afterRegister).toEqual({
      profile: activeLabProfile,
      orderCount: 0,
      activityCount: 1,
      recentActivity: [
        { action: 'user.registered', entity: 'user', entityId: session.user.id, createdAt: registered.createdAt },
      ],
    });

    const cart = await cartService.createForCustomer(token);
    const [, cartCreated] = (await activityService.list(token)).items;
    const { productCount: _after, ...afterCart } = await activityService.dashboard(token);
    expect(afterCart).toEqual({
      profile: activeLabProfile,
      orderCount: 0,
      activityCount: 2,
      recentActivity: [
        { action: 'cart.created', entity: 'cart', entityId: cart.id, createdAt: cartCreated.createdAt },
        { action: 'user.registered', entity: 'user', entityId: session.user.id, createdAt: registered.createdAt },
      ],
    });
  });

  // The product count is store-wide: it must equal the number of active products in the catalog.
  // Parallel tests create and archive products, so both counts are read together until they agree.
  test('product count equals the active catalog', async ({ activityService, productService, customerToken }) => {
    await expect.poll(async () => {
      const [dashboard, catalog] = await Promise.all([
        activityService.dashboard(customerToken), productService.list({ limit: 100 }),
      ]);
      return dashboard.productCount - catalog.items.length;
    }, { message: 'Dashboard product count minus active catalog size' }).toBe(0);
  });
});
