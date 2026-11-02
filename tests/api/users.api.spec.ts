import { randomUUID } from 'node:crypto';
import { test, expect } from '../../src/fixtures/api';
import type { UpdateUserRoleRequest } from '../../src/api/models/user';
import { createRandomShippingAddress } from '../../src/shared/data/shippingAddress';
import { seedUsers } from '../../src/shared/data/users';
import { expectError, registerAccount } from '../../src/api/helpers/accounts';

// Profile tests register their own customer, so edits never touch the shared setup accounts.
// Each new customer's exact profile is the user returned by registration (session.user).
// Listing users and changing roles use adminToken; customer attempts must be refused and change nothing.
test.describe('My profile', () => {
  // Registers a customer and reads /me with their token. It must return exactly that customer.
  test('customer can read their own profile', async ({ authApi, userService }) => {
    const { session } = await registerAccount(authApi);
    expect(await userService.me(session.accessToken)).toEqual(session.user);
  });

  // One test with no token and one with a bad token. Both must fail with 401.
  for (const token of ['', 'invalid']) {
    test(`profile cannot be read with ${token ? 'an invalid' : 'no'} token`, async ({ usersApi }) => {
      await expectError(await usersApi.me(token), 401, 'UNAUTHENTICATED');
    });
  }
});

test.describe('Edit my profile', () => {
  // The customer changes their name and address, then only the name.
  // Each response and the next profile read must equal the old profile with only those fields changed.
  test('customer can change their name and address', async ({ authApi, userService }) => {
    const { account, session } = await registerAccount(authApi);
    const updates = {
      fullName: `${account.fullName} updated`,
      address: createRandomShippingAddress(),
    };
    const expected = { ...session.user, ...updates };
    expect(await userService.updateMe(updates, session.accessToken)).toEqual(expected);
    expect(await userService.me(session.accessToken)).toEqual(expected);

    const partial = { ...expected, fullName: `${updates.fullName} partial` };
    expect(await userService.updateMe({ fullName: partial.fullName }, session.accessToken)).toEqual(partial);
    expect(await userService.me(session.accessToken)).toEqual(partial);
  });

  // Sends an object as the name. The API must answer 400 and keep the profile exactly as registered.
  test('invalid profile data is rejected', async ({ authApi, usersApi, userService }) => {
    const { session } = await registerAccount(authApi);
    await expectError(
      // @ts-expect-error Deliberately non-coercible value for schema validation.
      await usersApi.updateMe({ fullName: {} }, session.accessToken), 400, 'FST_ERR_VALIDATION',
    );
    expect(await userService.me(session.accessToken)).toEqual(session.user);
  });

  // Edits the profile with no token and expects 401 UNAUTHENTICATED.
  test('profile cannot be edited without a token', async ({ usersApi }) => {
    await expectError(await usersApi.updateMe({}, ''), 401, 'UNAUTHENTICATED');
  });
});

test.describe('User list (admin)', () => {
  // Users are sorted by id, so the 5 seed users always come first.
  // The admin reads 2 users, then follows the cursor to the next 2.
  // Page 1 must be exactly Ava and Ben; page 2 exactly Sam and Ivy.
  test('admin can page through all users', async ({ userService, adminToken }) => {
    const first = await userService.list(adminToken, { limit: 2 });
    const cursor = Buffer.from(seedUsers[1].id).toString('base64');
    expect(first).toEqual({ items: seedUsers.slice(0, 2), page: { limit: 2, hasMore: true, nextCursor: cursor } });

    const next = await userService.list(adminToken, { limit: 2, after: cursor });
    expect(next).toEqual({
      items: seedUsers.slice(2, 4),
      page: { limit: 2, hasMore: true, nextCursor: Buffer.from(seedUsers[3].id).toString('base64') },
    });
  });

  // A customer tries to list all users and expects 403 FORBIDDEN.
  test('customer cannot list users', async ({ authApi, usersApi }) => {
    const { session } = await registerAccount(authApi);
    await expectError(await usersApi.listAll(session.accessToken), 403, 'FORBIDDEN');
  });

  // Lists users with no token and expects 401 UNAUTHENTICATED.
  test('users cannot be listed without a token', async ({ usersApi }) => {
    await expectError(await usersApi.listAll(''), 401, 'UNAUTHENTICATED');
  });
});

test.describe('User roles (admin)', () => {
  // The admin gives a new account each role in turn.
  // Each response and the user's own profile must equal the registered user with only the role changed.
  // The finally block sets the account back to customer, even if an assertion fails.
  test('admin can assign every role', async ({
    authApi, userService, adminToken,
  }) => {
    const { session } = await registerAccount(authApi);
    // The role change response is the user record without the address.
    const { address: _address, ...record } = session.user;
    const roles: UpdateUserRoleRequest['role'][] = [
      'support_agent', 'inventory_manager', 'store_admin', 'customer',
    ];
    try {
      for (const role of roles) {
        expect(await userService.assignRole(session.user.id, role, adminToken)).        toEqual({ ...record, role });
        expect(await userService.me(session.accessToken)).toEqual({ ...session.user, role });
      }
    } finally {
      await userService.assignRole(session.user.id, 'customer', adminToken);
    }
  });

  // A customer tries to make themselves an admin. The API must answer 403 and keep them a customer.
  test('customer cannot promote themselves', async ({ authApi, usersApi, userService }) => {
    const { session } = await registerAccount(authApi);
    await expectError(
      await usersApi.updateRole(session.user.id, { role: 'store_admin' }, session.accessToken),
      403, 'FORBIDDEN',
    );
    expect(await userService.me(session.accessToken)).toEqual(session.user);
  });

  // Changes a role with no token. The API must answer 401 and leave the role unchanged.
  test('role cannot be changed without a token', async ({ authApi, usersApi, userService }) => {
    const { session } = await registerAccount(authApi);
    await expectError(
      await usersApi.updateRole(session.user.id, { role: 'store_admin' }, ''),
      401, 'UNAUTHENTICATED',
    );
    expect(await userService.me(session.accessToken)).toEqual(session.user);
  });

  // The admin assigns a role that does not exist. The API must answer 400 and keep the account a customer.
  test('unknown role is rejected', async ({ authApi, usersApi, userService, adminToken }) => {
    const { session } = await registerAccount(authApi);
    await expectError(
      // @ts-expect-error Unsupported enum value deliberately exercises validation.
      await usersApi.updateRole(session.user.id, { role: 'unsupported' }, adminToken),
      400, 'FST_ERR_VALIDATION',
    );
    expect(await userService.me(session.accessToken)).toEqual(session.user);
  });

  // The admin changes the role of a user id that does not exist and expects 404 USER_NOT_FOUND.
  test('role change for an unknown user returns not found', async ({ usersApi, adminToken }) => {
    await expectError(
      await usersApi.updateRole(randomUUID(), { role: 'customer' }, adminToken),
      404, 'USER_NOT_FOUND',
    );
  });
});
