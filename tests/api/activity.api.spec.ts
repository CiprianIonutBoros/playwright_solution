import { randomUUID } from 'node:crypto';
import { test, expect } from '../../src/fixtures/api';
import type { ActivityEntry } from '../../src/api/models/activity';
import { bearerOptions } from '../../src/api/clients/bearer';
import { expectError, registerAccount } from '../../src/api/helpers/accounts';
import { activityIdPattern, isIsoTimestamp, uuidPattern } from '../../src/shared/data/formats';
import { seedAdmin } from '../../src/shared/data/users';
import { API_BASE_URL } from '../../src/shared/helpers/sharedSession';

/** Checks the generated fields of an activity entry and returns them, so the rest can be compared exactly. */
function generated(entry: ActivityEntry): Pick<ActivityEntry, 'id' | 'requestId' | 'createdAt'> {
  expect(entry.id).toMatch(activityIdPattern);
  expect(entry.requestId).toMatch(uuidPattern);
  expect(isIsoTimestamp(entry.createdAt)).toBe(true);
  return { id: entry.id, requestId: entry.requestId, createdAt: entry.createdAt };
}

// The admin sees the whole store's activity. A customer sees only their own actions.
test.describe('Activity log', () => {
  // The admin renames a product. The log must hold exactly that change by the admin:
  // the full product before, and the product after with the new name, the next version, and the new update time.
  // The shared customer searches for the same change and must not find it.
  test('admin sees product changes that customers do not', async ({
    activityService, productService, adminToken, customerToken, stockedProduct,
  }) => {
    const name = `${stockedProduct.name} audited`;
    const updated = await productService.update(stockedProduct.id, { name }, adminToken);
    const isProductUpdate = (entry: ActivityEntry) => entry.entityId === stockedProduct.id && entry.action === 'product.updated';

    const entry = await activityService.find(adminToken, isProductUpdate);
    if (!entry) {
      throw new Error(`No product.updated activity was recorded for ${stockedProduct.id}.`);
    }
    const { reviews: _reviews, ...before } = stockedProduct;
    const { reviewCount: _count, averageRating: _rating, ...unchanged } = before;
    expect(entry).toEqual({
      ...generated(entry),
      actorId: seedAdmin.id,
      actorRole: 'store_admin',
      action: 'product.updated',
      entity: 'product',
      entityId: stockedProduct.id,
      before,
      after: { ...unchanged, name, version: updated.version, updatedAt: updated.updatedAt },
    });
    expect(updated.version).toBe(stockedProduct.version + 1);
    expect(await activityService.find(customerToken, isProductUpdate)).toBeUndefined();
  });

  // A new customer registers and creates 3 carts, so their log holds exactly those 4 actions in order.
  // Reading 2 entries at a time must return the first two, then the next two, by this customer only.
  test('customer sees only their own actions, page by page', async ({ authApi, activityService, cartService }) => {
    const { session } = await registerAccount(authApi);
    const token = session.accessToken;
    const carts = [
      await cartService.createForCustomer(token),
      await cartService.createForCustomer(token),
      await cartService.createForCustomer(token),
    ];

    const all = (await activityService.list(token, { limit: 100, after: '0' })).items;
    const own = { actorId: session.user.id, actorRole: 'customer', before: null, after: null };
    expect(all).toEqual([
      { ...generated(all[0]), ...own, action: 'user.registered', entity: 'user', entityId: session.user.id },
      ...carts.map((cart, index) => ({ ...generated(all[index + 1]), ...own, action: 'cart.created', entity: 'cart', entityId: cart.id })),
    ]);

    expect((await activityService.list(token, { limit: 2, after: '0' })).items).toEqual(all.slice(0, 2));
    expect((await activityService.list(token, { limit: 2, after: all[1].id })).items).toEqual(all.slice(2, 4));
  });
});

test.describe('Live activity events', () => {
  // The customer opens the server-sent event stream with a known request id.
  // The first frame must be exactly a "ready" event that echoes that request id.
  // The test uses fetch because Playwright's request context waits for the stream to end, and this one never does.
  test('customer can subscribe to live events', async ({ customerToken }) => {
    const requestId = randomUUID();
    const response = await fetch(`${API_BASE_URL}/api/v1/events`, {
      headers: { ...bearerOptions(customerToken).headers, 'X-Request-Id': requestId },
      signal: AbortSignal.timeout(10_000),
    });
    expect(response.status).toBe(200);
    expect(response.headers.get('content-type')).toBe('text/event-stream');
    if (!response.body) {
      throw new Error('The event subscription returned no response body.');
    }
    const reader = response.body.getReader();
    try {
      const decoder = new TextDecoder();
      let frame = '';
      while (!frame.includes('\n\n')) {
        const chunk = await reader.read();
        if (chunk.done) {
          throw new Error('The event subscription ended before its ready frame.');
        }
        frame += decoder.decode(chunk.value, { stream: true });
      }
      expect(frame).toBe(`event: ready\ndata: ${JSON.stringify({ requestId })}\n\n`);
    } finally {
      await reader.cancel();
      reader.releaseLock();
    }
  });

  // Subscribes with an invalid token. The API must refuse with 401 instead of opening a stream.
  test('invalid token cannot subscribe', async ({ apiRequest }) => {
    await expectError(await apiRequest.get('/api/v1/events', bearerOptions('invalid')), 401, 'UNAUTHENTICATED');
  });
});
