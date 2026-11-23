import assert from 'node:assert/strict';
import test from 'node:test';

// Iteration 001 has no application or offer persistence. Model those missing
// paths as a callable adapter so failures exercise outcomes, not imports.
const baseline = {
  async apply() {},
  async mine() { return []; },
  async respond() {},
  async ownerView() {
    return { queue: ['C'], offers: [{ artist: 'A', status: 'pending', slot: 1 }] };
  },
};

test('T03 an artist can see their recorded application', async () => {
  await baseline.apply({ requestId: 'published-request', artist: 'A' });
  assert.equal((await baseline.mine('A')).length, 1);
});

test('T09 a decline promotes the ranked backup into the released slot', async () => {
  await baseline.respond({ artist: 'A', response: 'decline' });
  const view = await baseline.ownerView();
  assert.deepEqual(view, {
    queue: [],
    offers: [
      { artist: 'A', status: 'declined', slot: 1 },
      { artist: 'C', status: 'pending', slot: 1 },
    ],
  });
});
