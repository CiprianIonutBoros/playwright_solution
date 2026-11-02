import { createServer } from 'node:http';
import { test, expect, request, type APIRequestContext, type APIResponse } from '@playwright/test';
import { ActivityApi } from '../../src/api/clients/ActivityApi';
import { AuthApi } from '../../src/api/clients/AuthApi';
import { CartsApi } from '../../src/api/clients/CartsApi';
import { DashboardApi } from '../../src/api/clients/DashboardApi';
import { GraphQLApi } from '../../src/api/clients/GraphQLApi';
import { InventoryApi } from '../../src/api/clients/InventoryApi';
import { LabApi } from '../../src/api/clients/LabApi';
import { OrdersApi } from '../../src/api/clients/OrdersApi';
import { ProductsApi } from '../../src/api/clients/ProductsApi';
import { ReviewsApi } from '../../src/api/clients/ReviewsApi';
import { SystemApi } from '../../src/api/clients/SystemApi';
import { UsersApi } from '../../src/api/clients/UsersApi';
import { WebhooksApi } from '../../src/api/clients/WebhooksApi';

interface RequestCase {
  method: string;
  path: string;
  send: (context: APIRequestContext) => Promise<APIResponse>;
  body?: unknown;
  headers?: Record<string, string>;
}

const token = 'client-contract-token';
const authorization = { authorization: `Bearer ${token}` };
const guestHeaders = { 'x-test-cart-token': 'guest-token' };
const id = 'id /?';
const encodedId = encodeURIComponent(id);
const product = { sku: 'sku', slug: 'slug', name: 'Name', description: 'Description', category: 'Category', priceCents: 100 };
const order = { cartId: id, shippingAddress: { line1: '1 Main St', city: 'City', postalCode: '12345', country: 'US' } };

const cases: RequestCase[] = [
  { method: 'GET', path: '/health', send: c => new SystemApi(c).health() },
  { method: 'GET', path: '/api/v1/dashboard', headers: authorization, send: c => new DashboardApi(c).overview(token) },
  { method: 'POST', path: '/api/v1/auth/login', body: { email: 'a@example.test', password: 'password' }, send: c => new AuthApi(c).login('a@example.test', 'password') },
  { method: 'POST', path: '/api/v1/auth/register', body: { email: 'a@example.test', password: 'password', fullName: 'Name' }, send: c => new AuthApi(c).register({ email: 'a@example.test', password: 'password', fullName: 'Name' }) },
  { method: 'POST', path: '/api/v1/auth/refresh', body: { refreshToken: 'refresh' }, send: c => new AuthApi(c).refresh({ refreshToken: 'refresh' }) },
  { method: 'POST', path: '/api/v1/auth/logout', body: {}, send: c => new AuthApi(c).logout() },
  { method: 'GET', path: '/api/v1/me', headers: authorization, send: c => new UsersApi(c).me(token) },
  { method: 'PATCH', path: '/api/v1/me', body: { fullName: 'New Name' }, headers: authorization, send: c => new UsersApi(c).updateMe({ fullName: 'New Name' }, token) },
  { method: 'GET', path: '/api/v1/products', send: c => new ProductsApi(c).list() },
  { method: 'GET', path: '/api/v1/products?search=mug+%26+cup', send: c => new ProductsApi(c).search('mug & cup') },
  { method: 'GET', path: '/api/v1/products?limit=2&offset=2', send: c => new ProductsApi(c).list({ limit: 2, offset: 2 }) },
  { method: 'GET', path: `/api/v1/products/${encodedId}`, headers: { 'if-none-match': '"v1"' }, send: c => new ProductsApi(c).getById(id, { headers: { 'If-None-Match': '"v1"' } }) },
  { method: 'POST', path: '/api/v1/admin/products', body: product, headers: authorization, send: c => new ProductsApi(c).create(product, token) },
  { method: 'PATCH', path: `/api/v1/admin/products/${encodedId}`, body: { priceCents: 200 }, headers: { ...authorization, 'if-match': '"v1"' }, send: c => new ProductsApi(c).update(id, { priceCents: 200 }, token, '"v1"') },
  { method: 'DELETE', path: `/api/v1/admin/products/${encodedId}`, headers: authorization, send: c => new ProductsApi(c).archive(id, token) },
  { method: 'POST', path: '/api/v1/carts', headers: authorization, send: c => new CartsApi(c).create(token) },
  { method: 'POST', path: '/api/v1/carts', send: c => new CartsApi(c).create() },
  { method: 'GET', path: `/api/v1/carts/${encodedId}`, headers: authorization, send: c => new CartsApi(c).getById(id, token) },
  { method: 'GET', path: `/api/v1/carts/${encodedId}`, headers: guestHeaders, send: c => new CartsApi(c).getById(id, undefined, { headers: guestHeaders }) },
  { method: 'POST', path: `/api/v1/carts/${encodedId}/items`, body: { productId: 'p-101', quantity: 2 }, headers: authorization, send: c => new CartsApi(c).addItem(id, 'p-101', 2, token) },
  { method: 'PATCH', path: `/api/v1/carts/${encodedId}/items/${encodedId}`, body: { quantity: 3 }, headers: authorization, send: c => new CartsApi(c).updateItem(id, id, { quantity: 3 }, token) },
  { method: 'DELETE', path: `/api/v1/carts/${encodedId}/items/${encodedId}`, headers: authorization, send: c => new CartsApi(c).removeItem(id, id, token) },
  { method: 'POST', path: `/api/v1/carts/${encodedId}/attach`, headers: { ...authorization, ...guestHeaders }, send: c => new CartsApi(c).attach(id, token, { headers: guestHeaders }) },
  { method: 'GET', path: '/api/v1/orders?limit=30', headers: authorization, send: c => new OrdersApi(c).list(token) },
  { method: 'GET', path: '/api/v1/orders?limit=2', headers: authorization, send: c => new OrdersApi(c).list(token, { limit: 2 }) },
  { method: 'POST', path: '/api/v1/orders', body: order, headers: { ...authorization, 'idempotency-key': 'test-key' }, send: c => new OrdersApi(c).create(order, token, { headers: { 'Idempotency-Key': 'test-key' } }) },
  { method: 'GET', path: `/api/v1/orders/${encodedId}`, headers: authorization, send: c => new OrdersApi(c).getById(id, token) },
  { method: 'POST', path: `/api/v1/orders/${encodedId}/cancel`, headers: authorization, send: c => new OrdersApi(c).cancel(id, token) },
  { method: 'PATCH', path: `/api/v1/orders/${encodedId}/status`, body: { status: 'shipped' }, headers: authorization, send: c => new OrdersApi(c).updateStatus(id, { status: 'shipped' }, token) },
  { method: 'PATCH', path: `/api/v1/inventory/${encodedId}`, body: { quantity: 5, version: 1 }, headers: authorization, send: c => new InventoryApi(c).update(id, { quantity: 5, version: 1 }, token) },
  { method: 'POST', path: '/api/v1/reviews', body: { productId: 'p-101', orderId: id, rating: 5, comment: 'Great' }, headers: authorization, send: c => new ReviewsApi(c).create({ productId: 'p-101', orderId: id, rating: 5, comment: 'Great' }, token) },
  { method: 'GET', path: '/api/v1/admin/users', headers: authorization, send: c => new UsersApi(c).listAll(token) },
  { method: 'GET', path: '/api/v1/admin/users?cursor=next', headers: authorization, send: c => new UsersApi(c).listAll(token, { cursor: 'next' }) },
  { method: 'PATCH', path: `/api/v1/admin/users/${encodedId}/role`, body: { role: 'support_agent' }, headers: authorization, send: c => new UsersApi(c).updateRole(id, { role: 'support_agent' }, token) },
  { method: 'GET', path: '/api/v1/activity?limit=2', headers: authorization, send: c => new ActivityApi(c).list(token, { limit: 2 }) },
  { method: 'GET', path: '/api/v1/events', headers: authorization, send: c => new ActivityApi(c).events(token) },
  { method: 'GET', path: '/api/v1/lab/profile', headers: authorization, send: c => new LabApi(c).getProfile(token) },
  { method: 'PUT', path: '/api/v1/lab/profile', body: { profile: 'baseline' }, headers: authorization, send: c => new LabApi(c).selectProfile({ profile: 'baseline' }, token) },
  { method: 'POST', path: '/api/v1/lab/reset', headers: authorization, send: c => new LabApi(c).reset(token) },
  { method: 'POST', path: '/api/v1/webhooks/payments', body: { eventId: 'event', orderId: id, outcome: 'succeeded' }, headers: { 'x-test-signature': 'signature' }, send: c => new WebhooksApi(c).payment({ eventId: 'event', orderId: id, outcome: 'succeeded' }, { 'x-test-signature': 'signature' }) },
  { method: 'GET', path: '/graphql?query=%7B+__typename+%7D&persisted=false&operationName=null&variables=%7B%7D', send: c => new GraphQLApi(c).query({ query: '{ __typename }', persisted: false, operationName: null, variables: '{}' }) },
  { method: 'POST', path: '/graphql', body: { query: '{ __typename }', variables: null }, send: c => new GraphQLApi(c).execute({ query: '{ __typename }', variables: null }) },
  { method: 'GET', path: '/graphiql', send: c => new GraphQLApi(c).editor() },
  { method: 'GET', path: '/graphiql/main.js', send: c => new GraphQLApi(c).mainScript() },
  { method: 'GET', path: '/graphiql/sw.js', send: c => new GraphQLApi(c).serviceWorkerScript() },
  { method: 'GET', path: '/graphiql/config.js', send: c => new GraphQLApi(c).configScript() },
];

test('API clients construct documented requests without contacting DemoShop', async () => {
  const received: { method?: string; url?: string; body: string; headers: Record<string, string | string[] | undefined> }[] = [];
  const server = createServer(async (incoming, outgoing) => {
    let body = '';
    for await (const chunk of incoming) {
      body += chunk.toString();
    }
    received.push({ method: incoming.method, url: incoming.url, body, headers: incoming.headers });
    outgoing.writeHead(200, { 'Content-Type': 'application/json' });
    outgoing.end('{"received":true}');
  });
  await new Promise<void>((resolve, reject) => {
    server.once('error', reject);
    server.listen(0, '127.0.0.1', resolve);
  });
  try {
    const address = server.address();
    if (address === null || typeof address === 'string') {
      throw new Error('Expected a TCP server address');
    }
    const context = await request.newContext({ baseURL: `http://127.0.0.1:${address.port}` });
    try {
      for (const [index, scenario] of cases.entries()) {
        await test.step(`${index + 1}: ${scenario.method} ${scenario.path}`, async () => {
          const response = await scenario.send(context);
          try {
            expect(response.status()).toBe(200);
            expect(await response.json()).toEqual({ received: true });
            expect(received).toHaveLength(index + 1);
            const actual = received[index];
            expect(actual.method).toBe(scenario.method);
            expect(actual.url).toBe(scenario.path);
            expect(actual.body === '' ? undefined : JSON.parse(actual.body)).toEqual(scenario.body);
            expect(actual.headers.authorization).toBe(scenario.headers?.authorization);
            for (const [name, value] of Object.entries(scenario.headers ?? {})) {
              expect(actual.headers[name]).toBe(value);
            }
          } finally {
            await response.dispose();
          }
        });
      }
    } finally {
      await context.dispose();
    }
  } finally {
    await new Promise<void>((resolve, reject) => server.close(error => error ? reject(error) : resolve()));
  }
});
