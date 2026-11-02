import { test, expect } from '../../src/fixtures/combined';
import { validUser } from '../../src/shared/data/users';
import { missingProductId } from '../../src/shared/data/products';

test.describe('Product errors', () => {
  // The API and product page must both report the same missing-product outcome for the shared unknown product id.
  test('unknown product returns not found in the API and browser', async ({ productsApi, productPage }) => {
    const response = await productsApi.getById(missingProductId);
    expect(response.status()).toBe(404);
    expect((await response.json()).error.code).toBe('PRODUCT_NOT_FOUND');

    await productPage.open(missingProductId);
    await expect(productPage.notFoundMessage).toBeVisible();
  });
});

test.describe('Authentication errors', () => {
  // The API returns INVALID_CREDENTIALS and the login form shows its exact user-facing message for the same bad password.
  test('wrong password has matching API and browser errors', async ({ loginPage, authApi }) => {
    const wrongPassword = 'WrongPassword123!';

    const response = await authApi.login(validUser.email, wrongPassword);
    expect(response.status()).toBe(401);
    expect((await response.json()).error.code).toBe('INVALID_CREDENTIALS');

    await loginPage.open();
    await loginPage.login(validUser.email, wrongPassword);
    await expect(loginPage.errorMessage).toHaveText('Email or password was not recognized.');
  });
});
