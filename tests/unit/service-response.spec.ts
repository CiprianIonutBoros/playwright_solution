import { createServer } from 'node:http';
import { test as base, expect, type APIResponse } from '@playwright/test';
import { ApiStatusError, readEmpty, readJson } from '../../src/api/services/serviceResponse';

type ResponseOptions = { status: number; body: string; contentType?: string };

const test = base.extend<{
  responseFor: (options: ResponseOptions) => Promise<APIResponse>;
}>({
  responseFor: async ({ request }, use) => {
    const server = createServer((incoming, outgoing) => {
      const params = new URL(incoming.url!, 'http://localhost').searchParams;
      const contentType = params.get('contentType');
      outgoing.writeHead(Number(params.get('status')), contentType ? { 'Content-Type': contentType } : {});
      outgoing.end(params.get('body') || '');
    });
    await new Promise<void>((resolve, reject) => {
      server.once('error', reject);
      server.listen(0, '127.0.0.1', resolve);
    });
    try {
      const address = server.address();
      if (!address || typeof address === 'string') {
        throw new Error('Expected a TCP server address');
      }
      await use(options => request.get(`http://127.0.0.1:${address.port}`, {
        params: {
          status: options.status,
          body: options.body,
          ...(options.contentType ? { contentType: options.contentType } : {}),
        },
      }));
    } finally {
      await new Promise<void>((resolve, reject) => server.close(error => error ? reject(error) : resolve()));
    }
  },
});

test('readJson returns the complete parsed payload', async ({ responseFor }) => {
  const payload = { id: 'product-1', items: [{ quantity: 2 }], active: true };
  const response = await responseFor({
    status: 201, body: JSON.stringify(payload), contentType: 'application/json; charset=utf-8',
  });
  expect(await readJson(response, 201, 'Create product')).toEqual(payload);
});

test('readJson preserves status and API error details on failure', async ({ responseFor }) => {
  const body = JSON.stringify({ error: { code: 'FORBIDDEN', message: 'Not allowed' }, requestId: 'request-1' });
  const response = await responseFor({ status: 403, body, contentType: 'text/plain' });
  await expect(readJson(response, 200, 'Read product')).rejects.toMatchObject({
    name: 'ApiStatusError', operation: 'Read product', status: 403, expectedStatus: 200,
    body, code: 'FORBIDDEN', message: 'Read product returned 403, expected 200 (FORBIDDEN)',
  });
});

for (const contentType of ['text/html', undefined]) {
  test(`readJson rejects ${contentType || 'missing'} content type`, async ({ responseFor }) => {
    const response = await responseFor({ status: 200, body: '{}', contentType });
    await expect(readJson(response, 200, 'Read product')).rejects.toThrow(
      `Read product returned content type "${contentType || ''}", expected application/json`,
    );
  });
}

test('readJson rejects malformed JSON instead of returning a fallback', async ({ responseFor }) => {
  const response = await responseFor({ status: 200, body: '{invalid', contentType: 'application/json' });
  await expect(readJson(response, 200, 'Read product')).rejects.toBeInstanceOf(SyntaxError);
});

test('readEmpty accepts a bodyless 204 response', async ({ responseFor }) => {
  const response = await responseFor({ status: 204, body: '' });
  await expect(readEmpty(response, 204, 'Archive product')).resolves.toBeUndefined();
});

test('readEmpty rejects an unexpected response body', async ({ responseFor }) => {
  const response = await responseFor({ status: 200, body: 'unexpected' });
  await expect(readEmpty(response, 200, 'Empty operation')).rejects.toThrow(
    'Empty operation returned a 10-byte body, expected none',
  );
});

test('readEmpty rejects the wrong status even when the body is empty', async ({ responseFor }) => {
  const response = await responseFor({ status: 200, body: '' });
  await expect(readEmpty(response, 204, 'Archive product')).rejects.toMatchObject({
    name: 'ApiStatusError', status: 200, expectedStatus: 204,
    message: 'Archive product returned 200, expected 204',
  });
});

test('ApiStatusError includes a bounded raw-body preview', () => {
  const body = 'x'.repeat(250);
  const error = new ApiStatusError('Read product', 500, 200, body);
  expect(error).toBeInstanceOf(Error);
  expect(error.message).toBe(`Read product returned 500, expected 200: ${'x'.repeat(200)}`);
  expect(error.body).toBe(body);
  expect(error.code).toBeUndefined();
});

for (const body of ['', '{}', 'not JSON']) {
  test(`ApiStatusError handles an absent error code in ${JSON.stringify(body)}`, () => {
    const error = new ApiStatusError('Read product', 500, 200, body);
    expect(error.code).toBeUndefined();
    expect(error.message).toBe(`Read product returned 500, expected 200${body ? `: ${body}` : ''}`);
  });
}
