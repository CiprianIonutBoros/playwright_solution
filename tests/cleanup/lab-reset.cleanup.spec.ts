import { test, expect } from '../../src/fixtures/api';
import { expectError, registerAccount } from '../../src/api/helpers/accounts';
import { notebook } from '../../src/shared/data/products';

// Restores DemoShop seed data and removes everything the other suites left behind:
// registered accounts, test products, carts, orders, and reviews.
// Run it on its own with `npx playwright test --project=cleanup`, never alongside other tests.
test.describe('Lab cleanup', () => {
  test.skip(process.env.CLEANUP !== '1', 'Cleanup runs only with --project=cleanup or CLEANUP=1.');

  // Registers a marker account, then the admin resets the lab.
  // The marker account must be gone, while seed products and the admin session must still work.
  test('admin reset removes test data and keeps seed data', async ({
    labService, authApi, productService, userService, adminToken,
  }) => {
    const { account } = await registerAccount(authApi);

    expect(await labService.reset(adminToken)).toEqual({
      reset: true, profile: 'baseline', seedVersion: '2026-09',
    });

    await expectError(await authApi.login(account.email, account.password), 401, 'INVALID_CREDENTIALS');
    expect(await productService.get(notebook.id)).toMatchObject({ id: notebook.id, name: notebook.name });
    expect(await userService.me(adminToken)).toMatchObject({ role: 'store_admin' });
  });
});
