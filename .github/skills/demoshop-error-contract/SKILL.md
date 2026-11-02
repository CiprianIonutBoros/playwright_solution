---
name: demoshop-error-contract
description: "Use when: asserting DemoShop error responses in API tests or the matching UI error message, or when adding a negative test for login, products, carts, or admin endpoints. Covers the error envelope, known error codes, and the UI text for each."
---

# DemoShop Error Contract

## Envelope

Every error response from `http://localhost:3001` uses this shape:

```json
{ "error": { "code": "PRODUCT_NOT_FOUND", "message": "...", "details": {} }, "requestId": "..." }
```

`details` is optional. Assert on `error.code` and the status. Do not assert on the English `message` from the API, because it can change.

## Known codes

| Endpoint | Condition | Status | `error.code` | UI text |
|---|---|---|---|---|
| `GET /api/v1/products/{id}` | Unknown id | 404 | `PRODUCT_NOT_FOUND` | `Product not found.` |
| `POST /api/v1/auth/login` | Wrong password | 401 | `INVALID_CREDENTIALS` | `Email or password was not recognized.` |
| `GET /api/v1/admin/users` | Customer token | 403 | `FORBIDDEN` | (API only) |
| `GET /api/v1/me` | Missing or rejected token | 401 | `UNAUTHENTICATED` | (API only) |
| `POST /api/v1/auth/login` | Too many attempts | 429 | (see response) | (see [demoshop-session-auth](../demoshop-session-auth/SKILL.md)) |
| `GET /api/v1/carts/{id}` | Non-UUID id | 500 | `22P02` (DB code) | (API only, known defect) |

Verify each row against `http://localhost:3001/docs/json` before relying on it. The table above reflects the probes made when these tests were written.

## Rules

1. Pair every UI error with the API error it comes from, in the same test or in a `05-combined` test.
2. Assert the code, not the message: `expect((await response.json()).error.code).toBe('PRODUCT_NOT_FOUND')`.
3. Mark known defects with `test.fail()` and a comment that names the defect. Do not assert a wrong value as correct.
4. For the 500 cart case, do not write a passing assertion for 400 or 404. Record it as a known defect.

## Example

```ts
const response = await productsApi.getById(missingProductId);
expect(response.status()).toBe(404);
expect(await response.json()).toMatchObject({ error: { code: 'PRODUCT_NOT_FOUND' } });
```
