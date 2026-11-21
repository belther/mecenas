// Callable no-op contract baseline before application implementation.
// These expected failures establish observable missing behavior, not import errors.
import test from 'node:test';
import assert from 'node:assert/strict';
const baseline = { async saveProfile() { return 'synthetic-profile'; }, async me() { return null; }, async publish() { return null; }, async browse() { return []; } };
test('T03 profile changes must persist after a successful save', async () => {
  await baseline.saveProfile({ displayName: 'Artista Sintético' });
  assert.equal((await baseline.me())?.displayName, 'Artista Sintético');
});
test('T02 anonymous profile writes must explicitly reject', async () => {
  await assert.rejects(() => baseline.saveProfile({ actor: null, displayName: 'Teste Sintético' }));
});
test('T09 published requests must become visible', async () => {
  await baseline.publish({ id: 'synthetic-request' });
  assert.equal((await baseline.browse()).length, 1);
});
