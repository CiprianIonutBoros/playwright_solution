import { test, expect } from '../../src/fixtures/api';
import type { RegisterRequest } from '../../src/api/models/auth';
import { invalidPass, newAccount } from '../../src/shared/data/users';
import {expectError, expectSession, registerAccount, registerWithRetry, retryWhileThrottled,} from '../../src/api/helpers/accounts';

// Each test registers its own account, because login, refresh, and logout change session state.
// Invalid bodies go through the raw request fixture so tests can check the API's validation errors.
test.describe('Registration', () => {
  // Registers a new customer, then uses the returned token to read the profile.
  // The profile must equal exactly the user returned by registration: id, email, name, role, address, and creation time.
  test('new customer can register and is signed in', async ({ authApi, userService }) => {
    const { session } = await registerAccount(authApi);
    expect(await userService.me(session.accessToken)).toEqual(session.user);
  });

  // Registers the same email twice. The second attempt must fail with 409, and the first account must stay intact.
  test('email that is already used cannot register again', async ({ authApi, userService }) => {
    const { account, session } = await registerAccount(authApi);
    await expectError(await registerWithRetry(authApi, account), 409, 'EMAIL_TAKEN');
    expect(await userService.me(session.accessToken)).toEqual(session.user);
  });

  // One test per field: a bad email, a too-short password, or a missing name must fail with 400.
  for (const field of ['email', 'password', 'fullName'] as const) {
    test(`registration fails when ${field} is invalid or missing`, async ({ apiRequest }) => {
      const body: Partial<RegisterRequest> = newAccount();
      if (field === 'email') body.email = 'not-an-email';
      if (field === 'password') body.password = 'short';
      if (field === 'fullName') delete body.fullName;
      const response = await retryWhileThrottled(() => apiRequest.post('/api/v1/auth/register', { data: body }));
      await expectError(response, 400, 'FST_ERR_VALIDATION');
    });
  }
});

test.describe('Login', () => {
  // Registers an account, logs in with it, and uses the new token to read the same customer's profile.
  test('customer can log in with the correct password', async ({ authApi, authService, userService }) => {
    const { account, session: registered } = await registerAccount(authApi);
    const session = await authService.login(account.email, account.password);
    expectSession(session, account.email);
    expect(session.user).toEqual(registered.user);
    expect(await userService.me(session.accessToken)).toEqual(registered.user);
  });

  // Logs in to a real account with the wrong password and expects 401 INVALID_CREDENTIALS.
  test('wrong password is rejected', async ({ authApi }) => {
    const { account } = await registerAccount(authApi);
    await expectError(
      await authApi.login(account.email, invalidPass.password), 401, 'INVALID_CREDENTIALS',
    );
  });

  // Logs in with an email that was never registered and expects the same 401 as a wrong password.
  test('unknown email is rejected', async ({ authApi }) => {
    const account = newAccount();
    await expectError(
      await authApi.login(account.email, account.password), 401, 'INVALID_CREDENTIALS',
    );
  });

  // Sends an empty body with no email or password and expects a 400 validation error.
  test('login without credentials is rejected', async ({ apiRequest }) => {
    await expectError(await apiRequest.post('/api/v1/auth/login', { data: {} }), 400, 'FST_ERR_VALIDATION');
  });
});

test.describe('Session refresh', () => {
  // A refresh token works only once. Refreshing returns a new session for the same customer.
  // Reusing the old token must fail with 401. The new token refreshes once more, and is then rejected too.
  test('refresh gives a new session and the old token stops working', async ({
    authApi, authService, userService,
  }) => {
    const { account, session } = await registerAccount(authApi);
    const rotated = await authService.refresh(session.refreshToken);
    expectSession(rotated, account.email);
    expect(rotated.user).toEqual(session.user);
    expect(await userService.me(rotated.accessToken)).toEqual(session.user);
    await expectError(
      await authApi.refresh({ refreshToken: session.refreshToken }), 401, 'INVALID_REFRESH_TOKEN',
    );
    const nextSession = await authService.refresh(rotated.refreshToken);
    expectSession(nextSession, account.email);
    expect(nextSession.user).toEqual(session.user);
    await expectError(
      await authApi.refresh({ refreshToken: rotated.refreshToken }), 401, 'INVALID_REFRESH_TOKEN',
    );
  });

  // Refreshes with a made-up token and expects 401 INVALID_REFRESH_TOKEN.
  test('unknown refresh token is rejected', async ({ authApi }) => {
    await expectError(
      await authApi.refresh({ refreshToken: newAccount().email }), 401, 'INVALID_REFRESH_TOKEN',
    );
  });

  // Refreshes with an empty body and expects a 400 validation error.
  test('refresh without a token is rejected', async ({ apiRequest }) => {
    await expectError(
      await apiRequest.post('/api/v1/auth/refresh', { data: {} }), 400, 'FST_ERR_VALIDATION',
    );
  });
});

test.describe('Logout', () => {
  // Logs out a fresh session, then checks that its refresh token no longer works.
  // Logging out a second time must still succeed.
  test('logout ends the session and can be repeated safely', async ({ authApi, authService }) => {
    const { session } = await registerAccount(authApi);
    expect(await authService.logout(session.refreshToken)).toEqual({ loggedOut: true });
    await expectError(await authApi.refresh({ refreshToken: session.refreshToken }), 401, 'INVALID_REFRESH_TOKEN');
    expect(await authService.logout(session.refreshToken)).toEqual({ loggedOut: true });
  });

  // The refresh token is optional on logout, so a call without one must still succeed.
  test('logout works without a refresh token', async ({ authService }) => {
    expect(await authService.logout()).toEqual({ loggedOut: true });
  });

  // Sends an object where the token string should be and expects a 400 validation error.
  test('logout with a malformed token is rejected', async ({ authApi }) => {
    await expectError(
      // @ts-expect-error Deliberately non-coercible value for schema validation.
      await authApi.logout({ refreshToken: {} }), 400, 'FST_ERR_VALIDATION',
    );
  });
});
