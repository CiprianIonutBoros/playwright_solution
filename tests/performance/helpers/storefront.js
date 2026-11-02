import { check, fail, sleep } from 'k6';
import http from 'k6/http';
import execution from 'k6/execution';
import { notebook, seedProducts } from '../../../src/shared/data/products.ts';

// Keep demo traffic local so performance scripts cannot target external services.
const baseUrl = (__ENV.BASE_URL || 'http://127.0.0.1:3001').replace(/\/$/, '');
if (!/^http:\/\/(127\.0\.0\.1|localhost):[0-9]{1,5}$/.test(baseUrl)) {
  throw new Error('Performance demos only accept a loopback BASE_URL, such as http://127.0.0.1:3001.');
}

// Use the shared notebook seed to keep API checks aligned with the test fixtures.
const product = seedProducts.find(item => item.id === notebook.id);
if (!product) {
  throw new Error(`No shared seed data exists for ${notebook.id}.`);
}

// Apply shared reliability limits and preserve detailed latency percentiles in reports.
export const demoOptions = {
  thresholds: {
    http_req_duration: ['p(95)<1000'],
    http_req_failed: ['rate<0.01'],
    checks: ['rate==1'],
  },
  summaryTrendStats: ['avg', 'min', 'med', 'max', 'p(90)', 'p(95)', 'p(99)'],
  tags: { suite: 'demoshop-performance-demo' },
};

// Make each request bounded, labeled, and fail immediately on bad status or malformed JSON.
function getJson(path, endpoint) {
  const response = http.get(`${baseUrl}${path}`, {
    timeout: '2s',
    redirects: 0,
    tags: { endpoint },
  });
  if (!check(response, { [`${endpoint}: status 200`]: result => result.status === 200 })) {
    fail(`${endpoint} returned HTTP ${response.status}: ${response.error || response.body}`);
  }

  let body;
  try {
    body = response.json();
  } catch (error) {
    check(false, { [`${endpoint}: valid JSON`]: valid => valid });
    fail(`${endpoint} returned invalid JSON: ${error.message}`);
  }
  check(true, { [`${endpoint}: valid JSON`]: valid => valid });
  return body;
}

// Run one read-only health and product-browsing iteration, then pause to cap traffic.
export function browseStore() {
  // Enforce the demo's four-user ceiling even when a caller overrides scenario settings.
  if (execution.instance.vusActive > 4) {
    execution.test.abort('Demo safety limit exceeded: at most four active virtual users are allowed.');
  }

  try {
    const health = getJson('/health', 'health');
    check(health, {
      'health: exact service and status': body => body?.status === 'ok' && body.service === 'demoshop-api',
    });

    const catalog = getJson(`/api/v1/products?search=${encodeURIComponent(product.name)}`, 'catalog');
    check(catalog, {
      'catalog: exactly the requested seed product': body =>
        Array.isArray(body?.items) && body.items.length === 1 &&
        body.items[0].id === product.id && body.items[0].name === product.name &&
        body.items[0].priceCents === product.priceCents && body.items[0].currency === product.currency,
    });

    const details = getJson(`/api/v1/products/${product.id}`, 'product');
    check(details, {
      'product: exact seed identity and price': body =>
        body?.id === product.id && body.sku === product.sku && body.name === product.name &&
        body.priceCents === product.priceCents && body.currency === product.currency && body.archived === false,
    });
  } finally {
    // Pace failed iterations too, so errors cannot turn the demo into an unthrottled request loop.
    sleep(2);
  }
}
