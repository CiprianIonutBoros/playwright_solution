import { randomUUID } from 'node:crypto';
import { test } from '../../src/fixtures/test';
import { expectError } from '../../src/api/helpers/accounts';

// Payment webhooks are authenticated by a signature header, not by a user token.
// The signing secret is not published, so only rejections are tested. Random ids avoid touching real orders.
test.describe('Payment webhooks', () => {
  // Sends a payment event with no signature header. The API must answer 401 INVALID_SIGNATURE.
  test('unsigned event is rejected', async ({ webhooksApi }) => {
    const response = await webhooksApi.payment({
      eventId: randomUUID(), orderId: randomUUID(), outcome: 'succeeded',
    }, {});
    await expectError(response, 401, 'INVALID_SIGNATURE');
  });

  // Sends a payment event with a made-up signature. The API must answer 401 INVALID_SIGNATURE.
  test('event with a wrong signature is rejected', async ({ webhooksApi }) => {
    const response = await webhooksApi.payment({
      eventId: randomUUID(), orderId: randomUUID(), outcome: 'failed',
    }, { 'X-Webhook-Signature': 'invalid-api-test-signature' });
    await expectError(response, 401, 'INVALID_SIGNATURE');
  });
});
