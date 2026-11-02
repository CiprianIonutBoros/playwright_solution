---
name: demoshop-api-client
description: "Use when: adding or changing a DemoShop API client class, model interface, or bearer-authenticated endpoint wrapper under src/api/, or registering it as a fixture in src/fixtures/test.ts or src/fixtures/combined.ts. Covers BaseApiClient, bearerOptions, and HTTP-only clients."
---

# DemoShop API Client

## Structure

- Base class: [src/api/clients/BaseApiClient.ts](../../../src/api/clients/BaseApiClient.ts). It exposes `get`, `post`, `put`, `patch`, `delete`, and returns raw `APIResponse`.
- Clients: one class per resource in `src/api/clients/` (for example [src/api/clients/CartsApi.ts](../../../src/api/clients/CartsApi.ts), [src/api/clients/OrdersApi.ts](../../../src/api/clients/OrdersApi.ts)).
- Auth header: use `bearerOptions(accessToken)` from [src/api/clients/bearer.ts](../../../src/api/clients/bearer.ts). Do not write `Authorization` headers by hand.
- Models: `src/api/models/<resource>.ts`, interfaces only (for example `Cart`, `OrderList`, `CurrentUser`).
- Fixtures: register new clients in [src/fixtures/combined.ts](../../../src/fixtures/combined.ts) with `apiRequest` as the dependency.

- Services: `src/api/services/<Resource>Service.ts` wraps a client, checks the status with `readJson` or `readEmpty` from [serviceResponse.ts](../../../src/api/services/serviceResponse.ts), and returns a model. Services are stateless (token per call) and throw `ApiStatusError` instead of calling `expect`. Register them in [src/fixtures/api.ts](../../../src/fixtures/api.ts). Use services for happy paths and raw clients for error assertions.

## Rules

1. Clients are HTTP-only. They return `APIResponse`. Never call `expect` inside a client.
2. Document each method with one line: HTTP verb, path, expected status, and response type, as in `AuthApi.login`.
3. Encode path ids with `encodeURIComponent`, as `CartsApi` does.
4. Pass query parameters through `params`, not in the URL string (see `OrdersApi.list`).
5. Do not create a new `APIRequestContext` in a client. Use the injected one.
6. Keep models aligned with the live contract at `http://localhost:3001/docs/json`. Check the field names there before writing a model.

## Checklist for a new client

- [ ] Class extends `BaseApiClient` and takes `APIRequestContext` through the constructor
- [ ] Authenticated methods take `accessToken: string` and use `bearerOptions`
- [ ] Model interface added under `src/api/models/`
- [ ] Fixture added in `src/fixtures/combined.ts` (or `src/fixtures/test.ts` if shared by layers 01-04)
- [ ] `npx playwright test tests/05-combined --project=chromium` passes

## Known pitfalls

- Duplicate helpers exist (`src/api/helpers/authRequests.ts` and `src/api/helpers/sessionRequests.ts`). Prefer `sessionRequests.ts` for new code.
- A non-UUID cart id returns 500 (`22P02`), not 400 or 404. Do not write tests that expect 404 for malformed ids without checking first.
