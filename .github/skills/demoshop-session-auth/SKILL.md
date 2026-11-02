---
name: demoshop-session-auth
description: "Use when: writing tests that need a signed-in customer or admin, changing src/setup/global-setup.ts or src/shared/helpers/sharedSession.ts, or diagnosing 429 Too Many Requests from DemoShop login. Covers the shared-session file, the 20 logins per minute limit, and token expiry."
---

# DemoShop Session and Login Budget

## Facts

- DemoShop allows 20 login requests per minute. Exceeding it returns 429.
- Each Playwright worker runs worker-scoped fixtures once. With 8 workers, each worker logs in again.
- Access tokens expire after 900 seconds.
- The UI stores the session in localStorage under `demoshop.session` and the cart id under `demoshop.cart-id`. It sets no cookies.

## How the project avoids 429

1. [src/setup/global-setup.ts](../../../src/setup/global-setup.ts) logs in once as the customer and once as the admin, then writes both to `playwright/.auth/shared-sessions.json`.
2. [src/shared/helpers/sharedSession.ts](../../../src/shared/helpers/sharedSession.ts) reads that file (`loadSharedSessions`).
3. Fixtures expose the sessions: `customerSession` in `src/fixtures/combined.ts` and `authToken` in `src/fixtures/test.ts`. API specs use the named aliases `adminToken` and `customerToken` from `src/fixtures/api.ts`.
4. [src/ui/helpers/sessionBridge.ts](../../../src/ui/helpers/sessionBridge.ts) `signInWithSession` writes the session into the browser, so browser tests do not use the login form.

## Rules

- Do not log in inside a test or fixture unless the test is about login itself.
- Use `customerSession` or `authToken` instead of calling `AuthApi.login` again.
- Use `signInWithSession` for any UI test that needs a signed-in user.
- Only the `login.ui.spec.ts` files in `tests/01-04` and the login tests in `05-combined` should use the form.

## 429 triage

1. Count logins in the last minute: `globalSetup` (2) + each UI login-form test + each test that calls `AuthApi.login`.
2. Wait at least 60 seconds before rerunning. Two full runs within one minute can exceed the limit.
3. Run one browser project at a time. A chromium, firefox, and webkit run together exceeds 20 UI logins.
4. Do not add `Start-Sleep` to tests or scripts. Rerun in a later step.

## Verify

- `npx playwright test tests/05-combined --project=chromium` passes after changes.
- `shared-sessions.json` is under `/playwright/.auth/`, which `.gitignore` already excludes. Do not commit it.
