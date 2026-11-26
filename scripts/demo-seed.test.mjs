import { test } from 'node:test';
import assert from 'node:assert/strict';
import { checkOverrides, checkTarget, demoPassword } from './demo-seed.mjs';

test('demo seed accepts only development or local deployments', () => {
  assert.equal(checkTarget('dev:successful-fennec-849 # team: x'), 'dev:successful-fennec-849');
  assert.equal(checkTarget('local:mecenas'), 'local:mecenas');
  for (const target of ['prod:happy-otter-1', '', undefined, 'successful-fennec-849']) {
    assert.throws(() => checkTarget(target), /development deployment/);
  }
});

test('demo password comes from the environment, then the ignored file, then a new random value', () => {
  const files = new Map();
  const fs = { existsSync: f => files.has(f), readFileSync: f => files.get(f), writeFileSync: (f, t) => files.set(f, t) };
  assert.equal(demoPassword({ MECENAS_DEMO_PASSWORD: 'from-environment-1' }, 'x', fs), 'from-environment-1');
  assert.equal(files.size, 0);
  const generated = demoPassword({}, 'x', fs);
  assert.ok(generated.length >= 12);
  assert.equal(demoPassword({}, 'x', fs), generated);
  assert.throws(() => demoPassword({ MECENAS_DEMO_PASSWORD: 'short' }, 'x', fs), /12 characters/);
});

test('demo seed refuses production deploy keys and self-hosted overrides', () => {
  checkOverrides({}, { CONVEX_DEPLOY_KEY: '' }, { CONVEX_DEPLOY_KEY: 'dev:successful-fennec-849|x' });
  assert.throws(() => checkOverrides({ CONVEX_DEPLOY_KEY: 'prod:happy-otter-1|x' }), /non-development/);
  assert.throws(() => checkOverrides({}, { CONVEX_SELF_HOSTED_URL: 'http://127.0.0.1:3210' }), /Self-hosted/);
});
