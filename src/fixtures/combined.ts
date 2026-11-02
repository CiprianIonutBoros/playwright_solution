import type { LoginResponse } from '../api/models/auth';
import { CartsApi } from '../api/clients/CartsApi';
import { OrdersApi } from '../api/clients/OrdersApi';
import { UsersApi } from '../api/clients/UsersApi';
import { loadSharedSessions } from '../shared/helpers/sharedSession';
import { test as appTest } from './test';
import { expect } from '@playwright/test';

type CombinedFixtures = {
  cartsApi: CartsApi;
  ordersApi: OrdersApi;
  usersApi: UsersApi;
  /** Customer session created once by global-setup.ts, so tests do not log in again. */
  customerSession: LoginResponse;
};

export const test = appTest.extend<CombinedFixtures>({
  customerSession: async ({}, use) => {
    await use(loadSharedSessions().customer);
  },
  cartsApi: async ({ apiRequest }, use) => {
    await use(new CartsApi(apiRequest));
  },
  ordersApi: async ({ apiRequest }, use) => {
    await use(new OrdersApi(apiRequest));
  },
  usersApi: async ({ apiRequest }, use) => {
    await use(new UsersApi(apiRequest));
  },
});

export { expect };
