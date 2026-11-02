import { test, expect } from '../../src/fixtures/combined';
import { validUser } from '../../src/shared/data/users';
import { readStoredSession, signInWithSession } from '../../src/ui/helpers/sessionBridge';

test.describe('Session handoff', () => {
  // The shared session is accepted by the API and opens the matching customer account in the browser.
  // API profile must equal session.user exactly; the UI must show that user's heading and email.
  test('API session opens the same account in the browser', async ({
    page, customerSession, usersApi, accountPage,
  }) => {
    const meResponse = await usersApi.me(customerSession.accessToken);
    expect(meResponse.status()).toBe(200);
    expect(await meResponse.json()).toEqual(customerSession.user);

    await signInWithSession(page, customerSession);

    await expect(accountPage.heading).toBeVisible();
    await expect(accountPage.email(customerSession.user.email)).toBeVisible();
  });

  // A real browser sign-in must store a session whose access token the API accepts.
  // The API's complete /me response must equal the user in that stored session.
  test('browser sign-in stores a session accepted by the API', async ({
    page, loginPage, accountPage, usersApi,
  }) => {
    await loginPage.open();
    await loginPage.login(validUser.email, validUser.password);
    await expect(accountPage.accountLink).toBeVisible();

    const storedSession = await readStoredSession(page);
    const meResponse = await usersApi.me(storedSession.accessToken);

    expect(meResponse.status()).toBe(200);
    expect(storedSession.user.email).toBe(validUser.email);
    expect(await meResponse.json()).toEqual(storedSession.user);
  });
});

test.describe('Role-scoped access', () => {
  // The same endpoint must reject the signed-in customer with 403 FORBIDDEN and accept the admin with 200.
  test('customer cannot list users but admin can', async ({ usersApi, customerSession, authToken }) => {
    const customerResponse = await usersApi.listAll(customerSession.accessToken);
    expect(customerResponse.status()).toBe(403);
    expect((await customerResponse.json()).error.code).toBe('FORBIDDEN');

    const adminResponse = await usersApi.listAll(authToken);
    expect(adminResponse.status()).toBe(200);
  });
});
