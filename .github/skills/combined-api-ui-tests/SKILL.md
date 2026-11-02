---
name: combined-api-ui-tests
description: "Use when: writing or changing tests in tests/05-combined that check the same behavior through the DemoShop API and the browser UI, such as cart, orders, sessions, or error messages. Covers shared sessions, async cart polling, and exact assertions."
---

# Combined API + UI Tests

## Layout

- Fixtures: [src/fixtures/combined.ts](../../../src/fixtures/combined.ts) provides `cartsApi`, `ordersApi`, `usersApi`, `customerSession`, plus everything from `src/fixtures/test.ts` (`page`, `loginPage`, `productsApi`, `authToken`).
- Browser session: [src/ui/helpers/sessionBridge.ts](../../../src/ui/helpers/sessionBridge.ts) `signInWithSession(page, session, { cartId?, path? })`.
- Formatting: [src/shared/helpers/format.ts](../../../src/shared/helpers/format.ts) `formatUsd(cents)`. Compare UI text with `formatUsd(apiCents)`.
- Existing files: `session.api-ui`, `cart-api-to-ui.api-ui`, `cart-ui-to-api.api-ui`,
  `orders.api-ui`, and `errors.api-ui`.

## Pattern

1. Start from the API and assert the exact status and value.
2. Continue in the browser with `signInWithSession` (or `loginPage` only when testing login).
3. Assert the UI shows the same data, using exact text where possible.
4. When the UI writes data, poll the API with `expect.poll`. Do not read the API once. Cart writes are asynchronous.

```ts
await expect
  .poll(async () => {
    const cartId = await readStoredCartId(page);
    const response = await cartsApi.getById(cartId, customerSession.accessToken);
    return response.ok() ? ((await response.json()) as Cart).items.map(i => i.productId) : `HTTP ${response.status()}`;
  })
  .toEqual([notebook.id]);
```

## Rules

- Use role-based locators (`getByRole`, `getByText`), as in the existing page objects.
- Use exact status checks (`toBe(201)`) and exact error codes (`toBe('PRODUCT_NOT_FOUND')`).
- Do not use `waitForLoadState('networkidle')`. The UI uses SSE, so it never becomes idle.
- Use `.first()` only when the same text appears more than once, and state why in a comment.
- Test data comes from `src/shared/data/` (`validUser`, `notebook`, `missingProductId`). Do not copy values into tests.
- Each test creates its own cart. Do not depend on another test's cart.

## Commands

```powershell
npx playwright test tests/05-combined --project=chromium
```

Run firefox and webkit separately, with a pause of at least one minute between runs, to stay under the login limit.
