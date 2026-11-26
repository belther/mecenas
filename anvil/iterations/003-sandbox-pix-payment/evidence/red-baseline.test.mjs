import { test } from 'node:test';
import assert from 'node:assert/strict';

// Accepted offers in iteration 002 remain waiting independently of payment.
const baseline = {
  async create() { return null; },
  async receive() {},
  async artistView() { return { phase: 'awaitingPayment' }; },
};

test('an accepted offer receives an exact-price sandbox charge', async () => {
  assert.deepEqual(await baseline.create(), { sandbox: true, amountCents: 5000 });
});

test('a verified completion unlocks the matching offer', async () => {
  await baseline.receive({ verified: true, providerPaid: true });
  assert.deepEqual(await baseline.artistView(), { phase: 'funded' });
});
