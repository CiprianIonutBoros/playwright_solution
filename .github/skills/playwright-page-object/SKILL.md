---
name: playwright-page-object
description: "Use when: creating or changing a page object under src/ui/pages/, adding locators for DemoShop pages (login, account, products, cart, orders), or refactoring UI test code into BasePage subclasses. Covers role-based locators and BasePage conventions."
---

# Playwright Page Objects (DemoShop)

## Existing classes

- [src/ui/pages/BasePage.ts](../../../src/ui/pages/BasePage.ts): header, primary navigation, bag count, account link, `alert` (role alert), and highlighted click/fill actions.
- [src/ui/pages/LoginPage.ts](../../../src/ui/pages/LoginPage.ts): `open()` (goes to `/account`), `login(email, password)`, `errorMessage`.
- [src/ui/pages/AccountPage.ts](../../../src/ui/pages/AccountPage.ts): `open()`, `heading` ("Good to see you,").

## Rules

1. Extend `BasePage`. Pass `page` through the constructor. Use `protected goto(path)`.
2. Define locators in the constructor as `readonly` fields. Do not add them inside methods.
3. Prefer roles and accessible names: `getByRole('textbox', { name: 'Email address' })`, `getByRole('button', { name: 'Sign in', exact: true })`.
4. Use `exact: true` for button names. The page has more than one "Sign in" text.
5. Use `.last()` only when the same button appears twice, as on the login page. Add a comment that explains why.
6. Do not use CSS class selectors such as `span.status-chip`. If no role or text works, ask for a `data-testid` in the app.
7. Do not call `waitForLoadState('networkidle')`. Wait for a visible element or use `expect(...).toBeVisible()`.
8. Methods return `Promise<void>` for actions and `Locator` for reads. Assertions stay in tests.
9. Register new page objects in `src/fixtures/test.ts` the same way as `loginPage` and `accountPage`.

## Template

```ts
import type { Locator, Page } from '@playwright/test';
import { BasePage } from './BasePage';

export class CartPage extends BasePage {
  readonly subtotal: Locator;

  constructor(page: Page) {
    super(page);
    this.subtotal = page.getByText(/Subtotal/);
  }

  async open(): Promise<void> {
    await this.goto('/cart');
  }
}
```

## Check

- `npx playwright test tests/01-direct tests/03-patterns --project=chromium` passes after changes.
