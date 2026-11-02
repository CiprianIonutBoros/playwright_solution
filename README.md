# DemoShop test automation portfolio

This repository is a Playwright and k6 portfolio project for testing the DemoShop
storefront and its API. It tests the application from outside; it does not contain
or build the storefront or API.

The suite demonstrates layered verification: HTTP contracts, real browser journeys,
cross-checks between browser and API state, isolated helper tests, and bounded
performance examples. Tests use typed API clients, reusable services, Playwright
fixtures, page objects, shared test data, and custom reports.

## What this project covers

| Layer | Location | Purpose |
| --- | --- | --- |
| API integration | [`tests/api/`](tests/api/) | Verify HTTP endpoints, status codes, response contracts, auth, and resource lifecycles. |
| Browser UI | [`tests/ui/`](tests/ui/) | Verify customer journeys in Chromium, including sign-in and purchase. |
| Combined API and UI | [`tests/combined/`](tests/combined/) | Check that actions and displayed state agree across browser and API. |
| Unit | [`tests/unit/`](tests/unit/) | Check isolated request construction, service responses, formatting, and dashboard rendering. |
| Performance demos | [`tests/performance/`](tests/performance/) | Run bounded, read-only k6 storefront flows against a local API. |
| Cleanup | [`tests/cleanup/`](tests/cleanup/) | Explicitly reset shared DemoShop test data after other suites finish. |

## Architecture

```text
tests/
  api/          API contract and resource lifecycle tests
  ui/           Browser user journeys
  combined/     API-to-UI and UI-to-API checks
  unit/         Isolated helper and reporting tests
  cleanup/      Explicit destructive reset
  performance/  Bounded k6 scenarios and report helpers
src/
  api/
    clients/    Typed HTTP request wrappers; return raw Playwright responses
    services/   Check expected status and JSON content type; parse typed responses
    models/     Request and response types
    helpers/    Account and authentication helpers
  ui/
    pages/      Page objects that express user actions
    locators/   Semantic, reusable page locators
    helpers/    Browser session bridge and interaction highlighting
  fixtures/    Shared API, UI, and combined test dependencies
  setup/        Sign in shared customer and admin accounts once per run
  shared/       Test data, session persistence, and formatting helpers
  reporters/    Standalone Playwright test dashboard
docs/           Implementation notes and AI tooling guidance
```

API happy paths use the service layer. Tests use raw clients when they need to
assert an error response, malformed request, or specific header. UI tests use
page objects so test intent stays separate from locator details. Fixtures create
and dispose request contexts and provide reusable data.

Global setup signs in the seeded customer and admin once, then stores their
sessions under the ignored `playwright/.auth/` directory. This avoids repeating
logins across workers and protects the DemoShop login rate limit. Tests that
change account state use newly registered accounts instead of shared sessions.

Combined tests verify both directions: API-created state appears in the browser,
and browser actions persist to the API. UI cart updates are asynchronous, so
combined tests poll for the exact saved state rather than relying on fixed waits.

## Browser and cross-layer coverage

Browser tests use page objects from [`src/ui/pages/`](src/ui/pages/) and shared
locators from [`src/ui/locators/`](src/ui/locators/). This keeps user actions
readable in tests and locator changes local to the page layer.

| Test file | User journey or behavior |
| --- | --- |
| [`login.ui.spec.ts`](tests/ui/login.ui.spec.ts) | Valid sign-in opens the customer account; invalid credentials show the service error. |
| [`purchase.ui.spec.ts`](tests/ui/purchase.ui.spec.ts) | Search catalog, inspect product, add to bag, enter a generated address, and place an order. |
| [`order-details.ui.spec.ts`](tests/ui/order-details.ui.spec.ts) | Compare a selected order's details with its history row and validate totals and address fields. |

Combined tests verify state across both interfaces:

| Test file | Cross-layer assertion |
| --- | --- |
| [`cart-api-to-ui.api-ui.spec.ts`](tests/combined/cart-api-to-ui.api-ui.spec.ts) | Create a cart through the API and compare browser line items, quantities, and totals. |
| [`cart-ui-to-api.api-ui.spec.ts`](tests/combined/cart-ui-to-api.api-ui.spec.ts) | Add, update, and remove items in the browser; poll until the API cart matches. |
| [`orders.api-ui.spec.ts`](tests/combined/orders.api-ui.spec.ts) | Compare order history/details, verify cancellation restores stock, and check admin status changes. |
| [`session.api-ui.spec.ts`](tests/combined/session.api-ui.spec.ts) | Verify API/browser session handoff and customer-versus-admin permissions. |
| [`errors.api-ui.spec.ts`](tests/combined/errors.api-ui.spec.ts) | Match API error codes with the related browser error states. |

## Extend the project

- Add an API operation to its resource client and request/response model. Use a
  service method for successful typed workflows; use the raw client for error
  contracts, malformed payloads, and headers.
- Add API coverage under `tests/api/`. Create isolated data through fixtures
  rather than mutating shared seed records.
- Add browser behavior to the relevant page object and locator class, then cover
  it under `tests/ui/`.
- Add a combined test when browser and API views must agree. Poll for persisted
  state when the UI saves asynchronously; do not add fixed sleeps.
- Add unit coverage for reusable logic that does not need DemoShop endpoints.
  Remember global setup still requires the local API and seeded accounts.
- Update this README when coverage, setup, safety rules, or run commands change.

## Run the suites

### Requirements

- Node.js and npm for Playwright and TypeScript dependencies.
- A local DemoShop API at `http://127.0.0.1:3001`.
- A local DemoShop UI at `http://127.0.0.1:5173/` for UI and combined tests.
- Seeded customer and admin accounts. Global setup uses both accounts before
  every Playwright invocation, including unit-only runs.
- k6 for performance demos. k6 is separate from Playwright.

Install dependencies once:

```powershell
npm install
```

Run a suite:

| Goal | Command | App requirements |
| --- | --- | --- |
| API integration | `npm run test:api` | API |
| Browser UI | `npx playwright test --project=ui` | API and UI |
| API and UI together | `npm run test:combined` | API and UI |
| Unit tests | `npx playwright test --project=unit --workers=2` | API, because global setup still signs in |
| One performance scenario | `npm run test:performance -- smoke` | API and k6 |
| Reset test data | `npx playwright test --project=cleanup --reporter=line` | API; run alone after other suites |

The browser projects run Chromium in headed mode with slow motion. API and unit
projects do not launch a browser. The configured global setup still runs for every
Playwright project.

GitHub Actions runs the unit suite with [`playwright.unit.config.ts`](playwright.unit.config.ts).
That isolated config skips global authentication, so CI does not need DemoShop
servers. API, UI, combined, and the main-config unit runs still require the local
API; UI and combined runs also require the local storefront.

## Design and test-safety decisions

- Tests create unique products and use isolated accounts where mutations could
  affect another worker.
- Eligible orders and test products are cleaned up by fixtures. Some resources
  have no individual delete endpoint and remain until explicit lab cleanup.
- Error assertions check HTTP status and stable API error codes, not translated
  message text.
- Shared sessions are read-only for tests that could revoke, refresh, or change
  account roles.
- Cleanup is a separate project because `POST /api/v1/lab/reset` deletes test
  accounts and data. Never run cleanup alongside other projects.
- Performance scenarios use local loopback HTTP targets, read-only requests,
  request timeouts, pacing, and a four-user ceiling. They are demonstrations,
  not production load tests or service-level objectives.

## Reports and further documentation

Playwright writes its standard HTML report to `playwright-report/` and a custom
dashboard to `test-dashboard/`. The Windows API and combined runners open the
dashboard after a run and preserve the test exit code. Performance runs write
`k6-report.html` in the current directory.

- [API integration coverage, services, isolation, and performance details](#api-integration-tests)
- [Historical combined API and UI implementation log](docs/IMPLEMENTATION-API-UI-TESTS.md)
- [Project-specific AI skills and agents](docs/AI-SKILLS-AND-AGENTS.md)

## API integration tests

Tests are grouped by resource and run without launching a browser. Happy paths
use services; error cases use the raw API clients (see [Services](#services)).
The suite covers all 39 HTTP operations in the live OpenAPI contract except
`POST /api/v1/lab/reset`. Reset is a cleanup operation, not an endpoint test.
It lives in the separate `cleanup` project (see [Cleanup](#cleanup)) because it
deletes other tests' data and accounts.

| File | Endpoint coverage |
| --- | --- |
| [health.api.spec.ts](tests/api/health.api.spec.ts) | `GET /health` |
| [products.api.spec.ts](tests/api/products.api.spec.ts) | `GET /api/v1/products`; `GET /api/v1/products/{id}` |
| [admin-products.api.spec.ts](tests/api/admin-products.api.spec.ts) | `POST /api/v1/admin/products`; `PATCH /api/v1/admin/products/{id}`; `DELETE /api/v1/admin/products/{id}` |
| [auth.api.spec.ts](tests/api/auth.api.spec.ts) | `POST /api/v1/auth/register`; `POST /api/v1/auth/login`; `POST /api/v1/auth/refresh`; `POST /api/v1/auth/logout` |
| [users.api.spec.ts](tests/api/users.api.spec.ts) | `GET /api/v1/me`; `PATCH /api/v1/me`; `GET /api/v1/admin/users`; `PATCH /api/v1/admin/users/{id}/role` |
| [carts.api.spec.ts](tests/api/carts.api.spec.ts) | `POST /api/v1/carts`; `GET /api/v1/carts/{id}`; `POST /api/v1/carts/{id}/items`; `PATCH /api/v1/carts/{id}/items/{itemId}`; `DELETE /api/v1/carts/{id}/items/{itemId}`; `POST /api/v1/carts/{id}/attach` |
| [orders.api.spec.ts](tests/api/orders.api.spec.ts) | `POST /api/v1/orders`; `GET /api/v1/orders`; `GET /api/v1/orders/{id}`; `POST /api/v1/orders/{id}/cancel`; `PATCH /api/v1/orders/{id}/status` |
| [inventory.api.spec.ts](tests/api/inventory.api.spec.ts) | `PATCH /api/v1/inventory/{sku}` |
| [reviews.api.spec.ts](tests/api/reviews.api.spec.ts) | `POST /api/v1/reviews` |
| [dashboard.api.spec.ts](tests/api/dashboard.api.spec.ts) | `GET /api/v1/dashboard` |
| [activity.api.spec.ts](tests/api/activity.api.spec.ts) | `GET /api/v1/activity`; `GET /api/v1/events` |
| [lab-profile.api.spec.ts](tests/api/lab-profile.api.spec.ts) | `GET /api/v1/lab/profile`; `PUT /api/v1/lab/profile` |
| [webhooks.api.spec.ts](tests/api/webhooks.api.spec.ts) | `POST /api/v1/webhooks/payments` (missing and invalid signature rejection) |
| [graphql.api.spec.ts](tests/api/graphql.api.spec.ts) | `GET /graphql`; `POST /graphql` |
| [graphiql.api.spec.ts](tests/api/graphiql.api.spec.ts) | `GET /graphiql`; `GET /graphiql/main.js`; `GET /graphiql/sw.js`; `GET /graphiql/config.js` |

### Assertions and isolation

- Lifecycle tests read mutations back and check cart totals, stock restoration,
  order transitions, review publication, token rotation, and revoked refresh tokens.
- Error tests assert the HTTP status and `error.code`, not English messages.
- Existing seed products remain unchanged. Mutation fixtures create unique
  products, stock only those products, and archive them during teardown.
- Catalog comparisons exclude inventory versions, which purchases can advance.
  Versions must still be positive integers; inventory tests verify exact version increments and stale-version rejection.
- Eligible test orders are cancelled during teardown. Delivered orders, reviews,
  empty carts, and registered accounts remain until explicit lab cleanup; the
  API has no delete operation for these resources.
- Account profile, role, refresh, and logout tests use newly registered accounts.
  Shared setup sessions are never refreshed, revoked, or assigned another role.
- Lab profile tests reselect the active profile rather than switching global
  behavior while other workers run.
- The event test reads a complete SSE ready frame with a 10-second deadline and
  closes its stream. Playwright's buffered request context cannot read an
  open-ended successful subscription.
- Webhook acceptance and duplicate delivery are not tested: the published OpenAPI
  contract does not define the signing headers or signing secret. The endpoint
  is covered through its verified `401 INVALID_SIGNATURE` contract.

### Services

[`src/api/services/`](src/api/services/) wraps each HTTP client in a
stateless service. A service method sends one request (or a short workflow),
checks the expected status and JSON content type, and returns a typed model.
On any other status it throws `ApiStatusError` with the status and `error.code`.
Tokens are passed per call, so one service serves customers, guests, and admins.

```ts
test('cart totals', async ({ cartService, customerToken, stockedProduct }) => {
  const owner = { accessToken: customerToken };
  const cart = await cartService.createForCustomer(customerToken);
  const item = await cartService.addItem(cart.id, stockedProduct.id, 2, owner);
  await cartService.updateItem(cart.id, item.id, 3, owner);
  expect(await cartService.get(cart.id, owner)).toMatchObject({ subtotalCents: 7500 });
});
```

| Fixture | Methods |
| --- | --- |
| `authService` | `register`, `login`, `refresh`, `logout` |
| `userService` | `me`, `updateMe`, `list`, `assignRole` |
| `productService` | `list`, `search`, `get`, `getWithETag`, `create`, `update`, `archive` |
| `inventoryService` | `setStock` |
| `cartService` | `createForCustomer`, `createGuest`, `get`, `listItems`, `addItem`, `updateItem`, `removeItem`, `attach` |
| `orderService` | `place`, `list`, `get`, `cancel`, `advanceStatus`, `deliver` |
| `reviewService` | `create` |
| `activityService` | `dashboard`, `list`, `find` |
| `labService` | `getProfile`, `selectProfile`, `reset` (cleanup project only) |
| `systemService` | `health`, `graphQLQuery`, `graphQLExecute` |

Cart methods take `{ accessToken }` for a customer or `{ cartToken }` for a guest.

Use the raw clients (`cartsApi`, `ordersApi`, ...) when the test asserts an error
status or code, sends a malformed body, or needs headers. The SSE, GraphiQL asset,
and webhook tests also stay on raw clients.

### Supporting code

API spec files live in [`tests/api/`](tests/api/). Supporting code lives in `src/`:

- [API fixtures](src/fixtures/api.ts) register the services and the
  `stockedProduct` and `placedOrder` data fixtures.
- [Services](src/api/services/) wrap the clients in
  [`src/api/clients/`](src/api/clients/).
- [Account helpers](src/api/helpers/accounts.ts) register isolated accounts
  and assert session/error contracts.
- [Account data](src/shared/data/users.ts) and
  [shipping addresses](src/shared/data/shippingAddress.ts) live with shared data.
- [Product response models](src/api/models/product.ts) include the version
  used for optimistic inventory updates.

### Who makes the request

Tests do not log in. Global setup signs in once as `validUser` (customer) and
once as `validAdminUser` (store admin) and saves both sessions. Each test names
the caller through the token it passes:

| Fixture | User |
| --- | --- |
| `adminToken` | `validAdminUser`, role `store_admin` |
| `customerToken` | `validUser`, role `customer` |
| `registerAccount(authApi).session` | new customer for that test only (auth and users specs) |

Error tests pass `''` or `'invalid'` to send no token or a rejected token.

Use `adminToken` only for operations a customer gets `403 FORBIDDEN` on:
product create/update/archive, inventory, order status, user list and roles, and
lab profile selection. Fixtures that create store data (`stockedProduct`) use it
too. Use `customerToken` for everything a shopper does: carts, orders, reviews,
profile, and reading the dashboard, activity, events, and lab profile.
Activity and dashboard are scoped to the caller, so the admin token is used to
read store-wide activity only.

### Run

Start the local DemoShop API on port 3001. The API project needs no browser.

```powershell
npm run test:api
npm run test:combined
```

The combined project also requires the UI on port 5173. These Windows runners open
`test-dashboard/index.html` automatically after the run, including failed runs.
They preserve Playwright's exit code and use two workers. CI does not open a browser.
Reports launch in the external browser registered for HTTPS, not the HTML file
association or VS Code's integrated browser.
Pass a spec name to run a smaller selection, for example
`npm run test:api -- health.api.spec.ts`.

The standalone dashboard includes project and status filters, search, run totals,
per-test durations, retry attempts, nested steps, errors, and attachment links.
The next run replaces the dashboard. Keep its `data` folder with the HTML when sharing.
Playwright's standard HTML report is also retained in `playwright-report`; use
`npx playwright show-report` for its trace viewer and built-in diagnostics.
Direct Playwright commands generate both reports without opening a browser.
An explicit `--reporter` overrides configured reporters and disables the dashboard.

```powershell
npx playwright test --project=api --workers=2 --reporter=line
```

Select one resource with
`npx playwright test products.api.spec.ts --project=api --reporter=line`.

The API suite has 68 tests. A run uses 20 registration requests and six login
requests, including global setup. Both operations have a separate 20-request
per-minute budget. Account setup retries only registration throttling for up to
90 seconds; other registration failures fail immediately. Do not run overlapping
API suites or repeated login tests within the same minute.

### Unit tests

Run `npx playwright test --project=unit --workers=2`.
Unit tests cover client request construction, dashboard rendering, service response
validation and errors, USD formatting, and canonical UTC timestamps.
Response tests use an ephemeral loopback server rather than DemoShop endpoints.
The configured global setup still authenticates against the local DemoShop API before the unit project runs.

### Performance demos (k6)

These are small, read-only demonstrations, not capacity tests or production acceptance tests.
Every test repeats the same storefront flow: check API health, search for the shared seed notebook,
then fetch that product's details. Checks validate HTTP 200, the health payload, and the exact seed
product identity and price. No login, cart, order, inventory mutation, or reset is involved.

| Test type | Script | What it demonstrates | Default load shape | Endpoints per iteration |
| --- | --- | --- | --- | --- |
| Smoke | [smoke.js](tests/performance/smoke.js) | Confirms the shared browsing flow and its checks work with minimal load. | 1 virtual user for 6 seconds | `GET /health`; `GET /api/v1/products?search=<seed notebook name>`; `GET /api/v1/products/<seed product ID>` |
| Average load | [load.js](tests/performance/load.js) | Shows behavior under the demo's two-user baseline; this is not measured production demand. | 2 virtual users for 12 seconds | `GET /health`; `GET /api/v1/products?search=<seed notebook name>`; `GET /api/v1/products/<seed product ID>` |
| Stress | [stress.js](tests/performance/stress.js) | Shows behavior as concurrent users ramp above baseline, then fall back to zero. | Ramp through 1, 2, and 4 users, then back to 0; 20 seconds | `GET /health`; `GET /api/v1/products?search=<seed notebook name>`; `GET /api/v1/products/<seed product ID>` |
| Spike | [spike.js](tests/performance/spike.js) | Shows response to a rapid, bounded jump in concurrent users and recovery to baseline. | 1 to 4 users in 1 second, hold, then recover to 1; 17 seconds | `GET /health`; `GET /api/v1/products?search=<seed notebook name>`; `GET /api/v1/products/<seed product ID>` |
| Soak / endurance | [soak.js](tests/performance/soak.js) | Demonstrates sustained browsing; 60 seconds does not prove long-term endurance. | 1 virtual user for 60 seconds | `GET /health`; `GET /api/v1/products?search=<seed notebook name>`; `GET /api/v1/products/<seed product ID>` |
| Breakpoint | [breakpoint.js](tests/performance/breakpoint.js) | Stops when demo latency, failure-rate, or check thresholds fail; reaching four users does not establish capacity. | Bounded ramp from 1 to 4 users | `GET /health`; `GET /api/v1/products?search=<seed notebook name>`; `GET /api/v1/products/<seed product ID>` |
| Scalability | [scalability.js](tests/performance/scalability.js) | Compares latency and completed iterations across separate user tiers; it does not add resources. | Separate 6-second tiers at 1, 2, and 4 users, with gaps for graceful stopping | `GET /health`; `GET /api/v1/products?search=<seed notebook name>`; `GET /api/v1/products/<seed product ID>` |

Requires k6 with TypeScript module support; shared seed data comes from
[products.ts](src/shared/data/products.ts). Start the local API, then run one script at a time:

```powershell
k6 run tests\performance\smoke.js
k6 run tests\performance\load.js
k6 run tests\performance\stress.js
k6 run tests\performance\spike.js
k6 run tests\performance\soak.js
k6 run tests\performance\breakpoint.js
k6 run tests\performance\scalability.js
```

Each run also writes a standalone, responsive HTML report to `k6-report.html` in the
current directory. Open it in a browser; the next run replaces it.
The heading and Test name field identify the script's test type. The report includes
every summary metric and its values, all thresholds, per-check results across all
groups, the declared test profile, and expandable raw k6 summary data.
Trend metrics include average, minimum, median, maximum, p90, p95, and p99.
Metric values use consistent ordering, explicit units, and up to two decimal places.
Rate metrics display percentages. Hover over values or expand raw data for full precision.
The metrics table scrolls horizontally on narrow screens.
The profile shows script defaults; CLI overrides are not merged into that section.
This is aggregate summary data, not individual request history or time-series samples.

On Windows, use the runner to open the report in your default browser automatically:
The runner launches the external browser registered for HTTPS.

```powershell
npm run test:performance -- smoke
npm run test:performance -- breakpoint
```

The runner accepts any test name from the table above and defaults to `smoke`.
It opens fresh reports even when thresholds fail and preserves the k6 exit code.
If k6 does not generate a fresh report, the runner fails instead of opening an old report.
Direct `k6 run` commands still generate the report without opening a browser.

The shared [storefront helper](tests/performance/helpers/storefront.js) accepts only a loopback
HTTP target: `http://127.0.0.1:3001` by default, or another local port through
`k6 run -e BASE_URL=http://localhost:3001 tests\performance\smoke.js`.
Each iteration sends at most three sequential requests and then pauses for two seconds,
including on failure. Default profiles allow at most four concurrent users, roughly six requests
per second at the highest sustained tier, and at most one minute of scheduled load.
An active-user safety guard aborts overrides that exceed four users. Requests time out after two seconds;
redirects are disabled. Executors allow up to two additional seconds for in-flight iterations.

Demo thresholds are p95 request duration below 1 second, HTTP failure rate below 1%, and 100% passed checks.
They are illustrative budgets, not agreed SLOs. Small sample sizes make these unsuitable for statistically
meaningful performance conclusions. The breakpoint script may finish without finding any breakpoint;
do not increase load to force one. The shortened soak does not establish long-term endurance.
Scalability prints separate latency and iteration counts for equal-duration tiers. Its deliberate pacing
does not establish capacity or efficiency, and it does not add resources. Real resource-scaling validation
requires controlled deployments, resource metrics, and an agreed workload outside these demos.

Playwright does not run these scripts. k6 is separate and does not inherit Playwright's `slowMo`.

### Cleanup

[lab-reset.cleanup.spec.ts](tests/cleanup/lab-reset.cleanup.spec.ts) calls
`POST /api/v1/lab/reset` as the admin. Reset restores seed data and deletes every
registered account, test product, cart, order, and review. Seed accounts survive,
so the next run's global setup still signs in.

Run it on its own, after the other suites finish:

```powershell
npx playwright test --project=cleanup --reporter=line
```

The test skips unless `CLEANUP=1`. Selecting `--project=cleanup` sets it
automatically, so a plain `npx playwright test` never resets mid-run. Do not
combine `--project=cleanup` with other projects in one command.
