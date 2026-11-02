import { test, expect } from '../../src/fixtures/api';
import { isIsoTimestamp } from '../../src/shared/data/formats';

test.describe('Health check', () => {
  // Calls the public health endpoint and expects status "ok", the service name, and a canonical ISO timestamp.
  test('API reports that it is healthy', async ({ systemService }) => {
    const { timestamp, ...health } = await systemService.health();
    expect(health).toEqual({ status: 'ok', service: 'demoshop-api' });
    expect(isIsoTimestamp(timestamp)).toBe(true);
  });
});
