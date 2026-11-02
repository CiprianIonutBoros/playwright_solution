# Historical implementation log: combined API + UI tests

> This document records the original combined-test implementation and its
> verification snapshot. It is not a current inventory or test-count report.
> Use the [project README](../README.md) for current architecture, commands,
> coverage, and safety notes.

## Project layout

```text
src/
  api/
    clients/       HTTP request wrappers and bearer authentication
    helpers/       API helper functions used by learning examples
    models/        Request and response interfaces grouped by resource
  ui/
    pages/         Page objects
    locators/      Page locator classes
    helpers/       UI login, highlighting, and browser session bridge
  shared/
    data/          Shared test data
    helpers/       Formatting and shared-session persistence
  fixtures/        Playwright fixtures and custom expectations
  setup/           Global setup that creates shared customer and admin sessions
tests/
  api/             API-only integration tests
  ui/              Browser UI tests, including end-to-end purchases
  combined/        Tests that verify behavior through both API and UI
  unit/            Isolated API client request-construction tests
```

Configuration and package manifests stay at the project root. Generated
`playwright-report/`, `test-results/`, and `playwright/.auth/` paths are unchanged.
Tests are grouped by type rather than numbered teaching layers. Test contents and
the existing browser configuration are unchanged by this move. The test folders
remain at the same depth, so their relative imports do not change.

Each test type has a separate Playwright project: `api`, `ui`, `combined`, and
`unit`. These replace the former `chromium` project selector; `ui` and `combined`
still use Chromium with the existing browser settings. Project directories do
not overlap, so running all projects executes each test once.

Run a test type with `npx playwright test --project=api`,
`npx playwright test --project=ui`,
`npx playwright test --project=combined`, or
`npx playwright test --project=unit`.
Select multiple types with `npx playwright test --project=api --project=unit`.
Global setup still runs once per invocation, including unit-only runs.

Shared product ids and the customer/admin seed accounts are exported from
`src/shared/data/` for use by tests and global setup.

## API request clients

Resource clients under `src/api/clients/` now wrap all 40 operations in the live OpenAPI
document, including GraphQL and GraphiQL resources. They accept the interfaces in
`src/api/models/`, return raw Playwright `APIResponse` objects, and leave assertions
to tests. Existing method signatures remain supported.

Clients are available through `src/fixtures/test.ts`; cart, order, and user clients
are available through `src/fixtures/combined.ts`. Request contexts are disposed after
use. API requests use port 3001 independently of the UI base URL.

Optional request headers support guest cart credentials, order idempotency, and
webhook signatures without guessing undocumented header formats. Product reads
accept conditional headers, and product updates accept an `If-Match` value.
Pagination and filtering use Playwright query parameters.

`ActivityApi.events` uses Playwright's buffered response handling, not a live SSE
subscription. Use a streaming HTTP client when consuming an indefinitely open
event stream. Webhook callers must supply the service's required signature headers.

The client-level test lives in `tests/unit/requests.spec.ts`, separate from the
API/UI integration tests.
Run `npx playwright test requests.spec.ts --project=unit --reporter=line`
to check request construction against a local test HTTP server. This test does
not log in, reset data, or mutate the DemoShop service.

The request-construction test does not verify shared-session setup.
`playwright.config.ts` enables `src/setup/global-setup.ts`, which signs in once as
the customer and once as the admin before each run. It writes fresh sessions to
the ignored `playwright/.auth/shared-sessions.json` file before workers start.
Authenticated fixtures read that file; no manual session generation is required.

The browser-to-API cart test creates an empty customer-owned cart and passes its
id to `signInWithSession` before adding an item in the UI. This isolates the test
and prevents it from reading a guest cart created before session injection.

Document that describes step by step what was implemented in the project: the new files, the modified files, the code added and the benefits of each step.

Legend: **NEW** = file created now. **MODIFIED** = existing file with changes.

## 1. Result

| Check | Result |
|---|---|
| Existing suite, chromium (17 tests) | Passes, before and after the changes |
| New combined tests, `tests/combined` (8 tests) | 8 of 8 pass |
| Full suite, chromium (25 tests) | 25 of 25 pass |
| Firefox and WebKit | Not run (see section 6) |

## 2. Verified sources

- Test website: `http://127.0.0.1:5173/` (pages: login, account, product, cart, orders).
- API documentation: `http://localhost:3001/docs/json` (OpenAPI).
- Endpoints used: `POST /api/v1/auth/login`, `GET /api/v1/me`, `GET /api/v1/products/{id}`, `POST /api/v1/carts`, `GET /api/v1/carts/{id}`, `POST /api/v1/carts/{id}/items`, `GET /api/v1/orders`, `GET /api/v1/admin/users`.

## 3. Benefits of the implementation

- **A test starts at the API and continues in the browser.** Login is done once through the API, and the session is passed to the UI. The UI test no longer depends on filling in the form every time.
- **Verification in both directions.** Data shown in the UI is compared with the API response (orders, cart, subtotal), and actions in the UI are verified through the API (the cart saved in the backend).
- **Consistent errors.** The same error (unknown product, wrong password) is verified in the API, with code and status, and in the UI, with the displayed message.
- **No exceeded login limit.** The server limit is 20 logins per minute. Logins are done once, in `globalSetup`, and the tests read the saved session.
- **Reusable code.** The new API clients (`CartsApi`, `OrdersApi`, `UsersApi`) and the session helpers can be used in any future test.

## 4. Problem solved: 429 Too Many Requests

The server allows 20 logins per minute. On the first run, each worker (8 in the run) made its own login through the `customerSession` fixture, and the UI tests made one more login each. Result: 7 of 8 tests received 429.

Solution: a `globalSetup` that logs in once for the customer and once for the admin, then saves the sessions in `playwright/.auth/shared-sessions.json`. The `/playwright/.auth/` folder is already excluded in [.gitignore](../.gitignore), so the file does not go into the repository.

For the full suite, the remaining logins are 6 (UI login in tests 02, 03, 04), plus 3 in the combined tests and 2 from `globalSetup`, a total of 11 per run, below the limit of 20.

---

## 5. Implementation steps

### Step 1: data models (NEW)

#### [src/api/models/cart.ts](../src/api/models/cart.ts) (NEW)

```ts
export interface CartItem {
  id: string;
  productId: string;
  name: string;
  quantity: number;
  unitPriceCents: number;
  lineTotalCents: number;
}

export interface Cart {
  id: string;
  status: string;
  items: CartItem[];
  subtotalCents: number;
}
```

Benefit: cart responses are typed, so tests use `cart.items` and `cart.subtotalCents` without type errors.

#### [src/api/models/order.ts](../src/api/models/order.ts) (NEW)

```ts
export interface Order {
  id: string;
  orderNumber: string;
  status: string;
  subtotalCents: number;
  discountCents: number;
  shippingCents: number;
  totalCents: number;
  currency: string;
  createdAt: string;
  customerName: string;
}

export interface OrderList {
  items: Order[];
  page: { limit: number; hasMore: boolean; nextCursor: string | null };
}
```

#### [src/api/models/user.ts](../src/api/models/user.ts) (NEW)

```ts
export interface CurrentUser {
  id: string;
  email: string;
  fullName: string;
  role: string;
}
```

### Step 2: authentication and API clients (NEW)

#### [src/api/clients/bearer.ts](../src/api/clients/bearer.ts) (NEW)

```ts
import type { RequestOptions } from './BaseApiClient';

/** Builds the Authorization header used by customer and admin endpoints. */
export function bearerOptions(accessToken: string): RequestOptions {
  return { headers: { Authorization: `Bearer ${accessToken}` } };
}
```

Benefit: the `Authorization` header is defined once, not in every test.

#### [src/api/clients/CartsApi.ts](../src/api/clients/CartsApi.ts) (NEW)

```ts
import type { APIResponse } from '@playwright/test';
import { BaseApiClient } from './BaseApiClient';
import { bearerOptions } from './bearer';

/** HTTP operations for the shopping cart. Assertions stay in tests. */
export class CartsApi extends BaseApiClient {
  /** POST /api/v1/carts - 201, new Cart. A customer token binds the cart to the account. */
  async create(accessToken: string): Promise<APIResponse> {
    return this.post('/api/v1/carts', undefined, bearerOptions(accessToken));
  }

  /** GET /api/v1/carts/{id} - 200, Cart owned by the token holder. */
  async getById(cartId: string, accessToken: string): Promise<APIResponse> {
    return this.get(`/api/v1/carts/${encodeURIComponent(cartId)}`, bearerOptions(accessToken));
  }

  /** POST /api/v1/carts/{id}/items - 201, added CartItem. */
  async addItem(
    cartId: string,
    productId: string,
    quantity: number,
    accessToken: string,
  ): Promise<APIResponse> {
    return this.post(
      `/api/v1/carts/${encodeURIComponent(cartId)}/items`,
      { productId, quantity },
      bearerOptions(accessToken),
    );
  }
}
```

#### [src/api/clients/OrdersApi.ts](../src/api/clients/OrdersApi.ts) (NEW)

```ts
import type { APIResponse } from '@playwright/test';
import { BaseApiClient } from './BaseApiClient';
import { bearerOptions } from './bearer';

/** HTTP operations for the signed-in customer's orders. Assertions stay in tests. */
export class OrdersApi extends BaseApiClient {
  /** GET /api/v1/orders - 200, OrderList for the token holder. */
  async list(accessToken: string): Promise<APIResponse> {
    return this.get('/api/v1/orders', {
      ...bearerOptions(accessToken),
      params: { limit: 30 },
    });
  }
}
```

#### [src/api/clients/UsersApi.ts](../src/api/clients/UsersApi.ts) (NEW)

```ts
import type { APIResponse } from '@playwright/test';
import { BaseApiClient } from './BaseApiClient';
import { bearerOptions } from './bearer';

/** HTTP operations for the current user and admin-only user management. Assertions stay in tests. */
export class UsersApi extends BaseApiClient {
  /** GET /api/v1/me - 200, CurrentUser; a rejected token gives 401 UNAUTHENTICATED. */
  async me(accessToken: string): Promise<APIResponse> {
    return this.get('/api/v1/me', bearerOptions(accessToken));
  }

  /** GET /api/v1/admin/users - 200 for admins; a customer token gives 403 FORBIDDEN. */
  async listAll(accessToken: string): Promise<APIResponse> {
    return this.get('/api/v1/admin/users', bearerOptions(accessToken));
  }
}
```

### Step 3: session and format helpers (NEW)

#### [src/shared/helpers/format.ts](../src/shared/helpers/format.ts) (NEW)

```ts
/** Formats integer cents as the USD string shown by the DemoShop UI, for example 4990 becomes $49.90. */
export function formatUsd(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`;
}
```

Benefit: the amount from the API (in cents) is compared with the amount shown in the UI ($).

#### [src/api/helpers/sessionRequests.ts](../src/api/helpers/sessionRequests.ts) (NEW)

```ts
import type { AuthApi } from '../api/AuthApi';
import type { LoginResponse } from '../api/models/auth';

/** Signs in through the API and returns the full session (user and tokens). */
export async function loginForSession(
  authApi: AuthApi,
  email: string,
  password: string,
): Promise<LoginResponse> {
  const response = await authApi.login(email, password);
  if (!response.ok()) {
    throw new Error(`Login failed with status ${response.status()}`);
  }
  return (await response.json()) as LoginResponse;
}
```

#### [src/ui/helpers/sessionBridge.ts](../src/ui/helpers/sessionBridge.ts) (NEW)

```ts
import type { Page } from '@playwright/test';
import type { LoginResponse } from '../api/models/auth';

/** localStorage keys used by the DemoShop UI. */
export const SESSION_STORAGE_KEY = 'demoshop.session';
export const CART_STORAGE_KEY = 'demoshop.cart-id';

interface SignInOptions {
  cartId?: string;
  path?: string;
}

/**
 * Writes a session issued by the API into the browser's localStorage, then opens the page.
 * The UI starts signed in without typing credentials, so the browser test continues where the API step ended.
 */
export async function signInWithSession(
  page: Page,
  session: LoginResponse,
  options: SignInOptions = {},
): Promise<void> {
  // The app must be loaded once on its origin before localStorage can be written.
  await page.goto('/account');
  await page.evaluate(
    ({ sessionKey, cartKey, sessionJson, cartId }) => {
      localStorage.setItem(sessionKey, sessionJson);
      if (cartId) {
        localStorage.setItem(cartKey, cartId);
      }
    },
    {
      sessionKey: SESSION_STORAGE_KEY,
      cartKey: CART_STORAGE_KEY,
      sessionJson: JSON.stringify(session),
      cartId: options.cartId,
    },
  );
  await page.goto(options.path ?? '/account');
}

/** Reads the session the UI stored after a real sign-in in the browser. */
export async function readStoredSession(page: Page): Promise<LoginResponse> {
  const raw = await page.evaluate(key => localStorage.getItem(key), SESSION_STORAGE_KEY);
  if (!raw) {
    throw new Error(`No session found under ${SESSION_STORAGE_KEY}`);
  }
  return JSON.parse(raw) as LoginResponse;
}

/** Reads the cart id the UI stored for the current browser. */
export async function readStoredCartId(page: Page): Promise<string> {
  const cartId = await page.evaluate(key => localStorage.getItem(key), CART_STORAGE_KEY);
  if (!cartId) {
    throw new Error(`No cart id found under ${CART_STORAGE_KEY}`);
  }
  return cartId;
}
```

Benefit: the session is passed from the API to the browser without logging in through the form, so UI tests start quickly and do not use up the login limit.

#### [src/shared/helpers/sharedSession.ts](../src/shared/helpers/sharedSession.ts) (NEW)

```ts
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import type { LoginResponse } from '../api/models/auth';

export const API_BASE_URL = 'http://127.0.0.1:3001';

/** Sessions created once by src/setup/global-setup.ts. The file lives in /playwright/.auth/, which .gitignore already excludes. */
export interface SharedSessions {
  customer: LoginResponse;
  adminAccessToken: string;
}

export const SHARED_SESSIONS_FILE = resolve(__dirname, '..', 'playwright', '.auth', 'shared-sessions.json');

export function saveSharedSessions(sessions: SharedSessions): void {
  mkdirSync(dirname(SHARED_SESSIONS_FILE), { recursive: true });
  writeFileSync(SHARED_SESSIONS_FILE, JSON.stringify(sessions, null, 2));
}

export function loadSharedSessions(): SharedSessions {
  try {
    return JSON.parse(readFileSync(SHARED_SESSIONS_FILE, 'utf-8')) as SharedSessions;
  } catch {
    throw new Error(`Shared sessions not found at ${SHARED_SESSIONS_FILE}. Is globalSetup configured?`);
  }
}
```

### Step 4: login once, through globalSetup (NEW)

#### [src/setup/global-setup.ts](../src/setup/global-setup.ts) (NEW)

```ts
import { request as playwrightRequest } from '@playwright/test';
import { AuthApi } from './api/AuthApi';
import { validAdminUser, validUser } from './data/users';
import { getAccessToken } from './helpers/authRequests';
import { loginForSession } from './helpers/sessionRequests';
import { API_BASE_URL, saveSharedSessions } from './helpers/sharedSession';

/**
 * Runs once before the suite. Each user signs in exactly once, and every worker and test
 * reads the saved sessions. This keeps DemoShop's login rate limit (20 per minute) from being exhausted.
 */
export default async function globalSetup(): Promise<void> {
  const request = await playwrightRequest.newContext({ baseURL: API_BASE_URL });
  try {
    const authApi = new AuthApi(request);
    const customer = await loginForSession(authApi, validUser.email, validUser.password);
    const adminAccessToken = await getAccessToken(authApi, validAdminUser.email, validAdminUser.password);
    saveSharedSessions({ customer, adminAccessToken });
  } finally {
    await request.dispose();
  }
}
```

Benefit: 2 logins per run, instead of one login for each worker and each test.

### Step 5: configuration and fixtures (MODIFIED)

#### [playwright.config.ts](../playwright.config.ts) (MODIFIED, one line added)

Added in `defineConfig`, after `testDir`:

```ts
  testDir: './tests',
  /* Signs in once through the API before the suite, see src/setup/global-setup.ts */
  globalSetup: './src/setup/global-setup.ts',
```

#### [src/fixtures/test.ts](../src/fixtures/test.ts) (MODIFIED)

Imports removed (no longer used): `getAccessToken` from `../helpers/authRequests` and `validAdminUser` from `../data/users`.

Import added:

```ts
import { loadSharedSessions } from '../helpers/sharedSession';
```

The `authToken` fixture was:

```ts
  authToken: async ({ authApi }, use) => {
    const token = await getAccessToken(
      authApi,
      validAdminUser.email,
      validAdminUser.password,
    );
    await use(token);
  },
```

Replaced with:

```ts
  // Admin token signed in once by src/setup/global-setup.ts, so tests do not hit the login rate limit.
  authToken: async ({}, use) => {
    await use(loadSharedSessions().adminAccessToken);
  },
```

Benefit: tests that use `authToken` no longer log in on each run. The behaviour for the existing tests stays the same.

#### [src/fixtures/combined.ts](../src/fixtures/combined.ts) (NEW)

```ts
import type { LoginResponse } from '../api/models/auth';
import { CartsApi } from '../api/CartsApi';
import { OrdersApi } from '../api/OrdersApi';
import { UsersApi } from '../api/UsersApi';
import { loadSharedSessions } from '../helpers/sharedSession';
import { test as appTest } from './test';
import { expect } from '@playwright/test';

type CombinedFixtures = {
  cartsApi: CartsApi;
  ordersApi: OrdersApi;
  usersApi: UsersApi;
  /** Customer session created once by src/setup/global-setup.ts, so tests do not log in again. */
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
```

Benefit: a single import point (`src/fixtures/combined.ts`) for all combined tests.

### Step 6: combined API + UI tests (NEW, folder `tests/combined/`)

#### [tests/combined/session.api-ui.spec.ts](../tests/combined/session.api-ui.spec.ts) (NEW)

```ts
import { test, expect } from '../../fixtures/combined';
import { validUser } from '../../data/users';
import { readStoredSession, signInWithSession } from '../../helpers/sessionBridge';

test('a token issued by the API opens the signed-in account in the browser', async ({
  page,
  customerSession,
  usersApi,
}) => {
  const meResponse = await usersApi.me(customerSession.accessToken);
  expect(meResponse.status()).toBe(200);
  const profile = await meResponse.json();

  await signInWithSession(page, customerSession);

  await expect(page.getByRole('heading', { name: /Good to see you,/ })).toBeVisible();
  await expect(page.getByText(profile.email)).toBeVisible();
});

test('a sign-in in the browser stores a session that the API accepts', async ({
  page,
  loginPage,
  usersApi,
}) => {
  await loginPage.open();
  await loginPage.login(validUser.email, validUser.password);
  await expect(page.getByRole('link', { name: /Account for Ava Customer/ })).toBeVisible();

  const storedSession = await readStoredSession(page);
  const meResponse = await usersApi.me(storedSession.accessToken);

  expect(meResponse.status()).toBe(200);
  const profile = await meResponse.json();
  expect(profile.id).toBe(storedSession.user.id);
  expect(profile.email).toBe(validUser.email);
});

test('a customer token is refused on the admin endpoint while an admin token is accepted', async ({
  usersApi,
  customerSession,
  authToken,
}) => {
  const customerResponse = await usersApi.listAll(customerSession.accessToken);
  expect(customerResponse.status()).toBe(403);
  expect((await customerResponse.json()).error.code).toBe('FORBIDDEN');

  const adminResponse = await usersApi.listAll(authToken);
  expect(adminResponse.status()).toBe(200);
});
```

Benefit: the API session works in the browser, the browser session works in the API, and the access rule (customer 403, admin 200) is verified on the admin endpoint.

#### [tests/combined/cart-api-to-ui.api-ui.spec.ts](../tests/combined/cart-api-to-ui.api-ui.spec.ts)

The API creates an empty cart, adds two units of a fresh test product, and checks its exact line and subtotal.
The browser must show the same product, quantity, line total, subtotal, shipping, cart total, and header unit count.

#### [tests/combined/cart-ui-to-api.api-ui.spec.ts](../tests/combined/cart-ui-to-api.api-ui.spec.ts)

Each test starts with its own API-created cart and fresh product. It covers browser add, quantity change, and removal.
After each browser write, the test polls the API until its exact cart lines and subtotal match the expected values.

#### [tests/combined/orders.api-ui.spec.ts](../tests/combined/orders.api-ui.spec.ts) (NEW)

```ts
import { test, expect } from '../../fixtures/combined';
import { formatUsd } from '../../helpers/format';
import { signInWithSession } from '../../helpers/sessionBridge';
import type { OrderList } from '../../api/models/order';

test('the order history in the browser matches the orders returned by the API', async ({
  page,
  customerSession,
  ordersApi,
}) => {
  const response = await ordersApi.list(customerSession.accessToken);
  expect(response.status()).toBe(200);
  const { items } = (await response.json()) as OrderList;
  expect(items.length).toBeGreaterThan(0);

  const order = items[0];
  await signInWithSession(page, customerSession, { path: '/orders' });

  const row = page.getByRole('row').filter({ hasText: order.orderNumber });
  await expect(row).toHaveCount(1);
  await expect(row.getByText(order.status, { exact: true })).toBeVisible();
  await expect(row.getByText(formatUsd(order.totalCents))).toBeVisible();
});
```

Benefit: the order number, status and total in the table are compared with the API response. The status is compared exactly, because the UI displays it raw (for example `delivered`).

#### [tests/combined/errors.api-ui.spec.ts](../tests/combined/errors.api-ui.spec.ts) (NEW)

```ts
import { test, expect } from '../../fixtures/combined';
import { validUser } from '../../data/users';
import { missingProductId } from '../../data/products';

test('an unknown product gives the same not-found outcome in the API and the browser', async ({
  page,
  productsApi,
}) => {
  const response = await productsApi.getById(missingProductId);
  expect(response.status()).toBe(404);
  expect((await response.json()).error.code).toBe('PRODUCT_NOT_FOUND');

  await page.goto(`/products/${missingProductId}`);
  await expect(page.getByText('Product not found.')).toBeVisible();
});

test('a wrong password is refused by the API and the browser shows the same message', async ({
  loginPage,
  authApi,
}) => {
  const wrongPassword = 'WrongPassword123!';

  const response = await authApi.login(validUser.email, wrongPassword);
  expect(response.status()).toBe(401);
  expect((await response.json()).error.code).toBe('INVALID_CREDENTIALS');

  await loginPage.open();
  await loginPage.login(validUser.email, wrongPassword);
  await expect(loginPage.errorMessage).toHaveText('Email or password was not recognized.');
});
```

Benefit: errors are verified on both layers, with the error code from the API and the message visible in the UI.

### Step 7: unchanged files

- [.gitignore](../.gitignore): not modified. It already contains `/playwright/.auth/`, the folder where sessions are saved.
- At the time of the original implementation, the numbered teaching tests were not modified and continued to pass after the `authToken` fixture change. The current suite is organized by type in `tests/api`, `tests/ui`, `tests/combined`, and `tests/unit`; the results above are historical.

---

## 6. Observations and suggestions

- **Firefox and WebKit were not run.** Each browser makes its own UI logins, so a run across all three projects exceeds the limit of 20 logins per minute. Run them separately, for example `npx playwright test --project=firefox`, with a minute between runs.
- **The UI does not revalidate a rejected token.** I observed that if the `accessToken` in localStorage is invalid, the account still appears signed in until the first API request. This is an observation about the application, not a test that passes.
- **Missing validation on the cart.** A cart id that is not a UUID returns 500, with the internal database code `22P02`, instead of 400 or 404. A contract test that checks for 400 can be added.
- **Contract testing with `/docs/json`.** An automatic check of responses against the OpenAPI schema can be generated, to detect changes that were not announced.
- **Reusing the session with `storageState`.** Playwright can save the full browser state after login. It is an alternative to writing localStorage manually, but it requires the token to remain valid.
- **The GraphQL interface at `/lab`.** It can be covered by API tests similar to those for `/api/v1`.
- **Session duration.** The token expires after 900 seconds. `globalSetup` runs on every run, so the session is always fresh.

## 7. How to run

```powershell
npx playwright test --project=api
npx playwright test --project=ui
npx playwright test --project=combined
npx playwright test --project=unit
npx playwright test --project=api --project=unit
npx playwright test
```
