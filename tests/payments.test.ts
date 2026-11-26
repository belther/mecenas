import { createHmac } from 'node:crypto';
import { afterEach, describe, expect, test, vi } from 'vitest';
import { convexTest } from 'convex-test';
import { registerCore, sessionIdentity } from '@convex-dev/auth/test';
import { registerPassword } from '@convex-dev/auth/components/password/test';
import { registerUsername } from '@convex-dev/auth/components/username/test';
import schema from '../convex/schema';
import { api } from '../convex/_generated/api';
import { observe } from '../convex/payments';
import { webhookBodyKey } from '../lib/pix-provider';
import type { Id } from '../convex/_generated/dataModel';

const modules = import.meta.glob('../convex/**/*.ts');
const cpf = '11144477735'; // AbacatePay's documented synthetic example.
const identityKey = 'synthetic-fixture-for-cpf-hash-0000';
const webhookKey = 'synthetic-fixture-for-notification-0000';
const allowedHash = createHmac('sha256', identityKey).update(cpf).digest('hex');
afterEach(() => { vi.restoreAllMocks(); vi.unstubAllGlobals(); vi.unstubAllEnvs(); });

type Row = {
  id: string; amount: number; devMode: boolean; status: string;
  metadata: { mecenasPaymentRef: string }; expiresAt: string; brCode: string; brCodeBase64: string;
};
function provider() {
  const records: Row[] = [];
  const createBodies: unknown[] = [];
  let dropNext = false;
  let productionNext = false;
  const fetch = vi.fn(async (input: URL | Request | string, options?: RequestInit) => {
    const url = new URL(String(input));
    expect(url.origin).toBe('https://api.abacatepay.com');
    if (url.pathname.endsWith('/create')) {
      const payload = JSON.parse(String(options?.body));
      createBodies.push(payload);
      const row = {
        id: `pix_char_TEST${records.length + 1}`, amount: payload.data.amount,
        devMode: !productionNext, status: 'PENDING', metadata: payload.data.metadata,
        expiresAt: '2026-11-24T01:00:00.000Z', brCode: 'sandbox-pix-copy-code',
        brCodeBase64: 'data:image/png;base64,iVBORw0KGgo=',
      };
      records.push(row);
      if (dropNext) { dropNext = false; throw new Error('lost response'); }
      return Response.json({ success: true, data: row });
    }
    expect(url.pathname).toBe('/v2/transparents/list');
    return Response.json({ success: true, data: records.filter(row =>
      (!url.searchParams.has('id') || row.id === url.searchParams.get('id')) &&
      (!url.searchParams.has('externalId') || row.metadata.mecenasPaymentRef === url.searchParams.get('externalId'))) });
  });
  vi.stubGlobal('fetch', fetch);
  return { records, createBodies, fetch, drop: () => { dropNext = true; }, production: () => { productionNext = true; } };
}

async function fixture() {
  vi.stubEnv('CONVEX_CLOUD_URL', 'https://synthetic-test.convex.cloud');
  vi.stubEnv('ABACATEPAY_TEST_MODE', 'true');
  vi.stubEnv('ABACATEPAY_API_KEY', 'abc_dev_synthetic_fixture');
  vi.stubEnv('ABACATEPAY_WEBHOOK_SECRET', webhookKey);
  vi.stubEnv('MECENAS_CPF_HASH_SECRET', identityKey);
  vi.stubEnv('MECENAS_SYNTHETIC_CPF_HASHES', allowedHash);
  const t = convexTest(schema, modules);
  registerCore(t);
  registerPassword(t);
  registerUsername(t);
  async function actor(username: string, role: 'client' | 'artist') {
    vi.stubEnv('MECENAS_DEMO_USERNAMES', username);
    const result = await t.mutation(api.auth.signUpWithUsernamePassword, {
      username, password: crypto.randomUUID() + 'aA9!',
    });
    if (result.status !== 'complete') throw new Error('Synthetic sign-up failed');
    const caller = t.withIdentity(sessionIdentity(result.tokens));
    await caller.mutation(api.profiles.save, { role, displayName: username, bio: '', portfolioUploadIds: [] });
    return caller;
  }
  const owner = await actor('cliente-pix', 'client');
  const foreign = await actor('cliente-outro', 'client');
  const artist = await actor('artista-pix', 'artist');
  const unrelated = await actor('artista-outro', 'artist');
  async function offer(client = owner, recipient = artist, accept = true, artistSlots = 1) {
    const requestId = await client.mutation(api.requests.saveDraft, {
      title: 'Encomenda sintética para Pix',
      description: 'Uma ilustração fictícia para testar o fluxo de pagamento.',
      artistSlots, pricePerArtistCents: 5000, exampleUploadIds: [],
    });
    await client.mutation(api.requests.publish, { id: requestId });
    const applicant = await recipient.mutation(api.applications.apply, { requestId });
    await client.mutation(api.applications.select, { requestId, selectedApplicationIds: [applicant], backupApplicationIds: [], expectedRevision: 0 });
    const offer = (await recipient.query(api.applications.mine, {})).find(row => row.requestId === requestId)?.offer;
    if (!offer) throw new Error('Synthetic offer missing');
    if (accept) await recipient.mutation(api.applications.respond, { offerId: offer.id, response: 'accept' });
    return { offerId: offer.id, requestId };
  }
  function event(row: Row, id = 'log_fixture', demo = true) {
    return JSON.stringify({
      id, event: 'transparent.completed', apiVersion: 2, devMode: demo,
      data: { transparent: { ...row, devMode: demo, status: 'PAID' }, unrelatedField: true },
    });
  }
  function deliver(raw: string, secret = webhookKey, signature = createHmac('sha256', webhookBodyKey).update(raw).digest('base64')) {
    return t.fetch('/webhooks/abacatepay', {
      method: 'POST', body: raw,
      headers: { 'X-Webhook-Secret': secret, 'X-Webhook-Signature': signature },
    });
  }
  const read = (offerId: Id<'offers'>) => owner.query(api.payments.view, { offerId });
  return { ...provider(), t, owner, foreign, artist, unrelated, offer, event, deliver, read };
}

describe('sandbox Pix and verified funding', () => {
  test('only the owning client can charge an accepted offer, and payer details stay private', async () => {
    const f = await fixture();
    const { offerId, requestId } = await f.offer();
    expect((await f.owner.query(api.requests.get, { id: requestId })).status).toBe('closed');
    const pending = await f.offer(f.owner, f.unrelated, false);
    await expect(f.owner.action(api.pix.start, { offerId: pending.offerId, syntheticCpf: cpf })).rejects.toThrow();
    for (const caller of [f.foreign, f.artist, f.unrelated, f.t]) {
      await expect(caller.action(api.pix.start, { offerId, syntheticCpf: cpf })).rejects.toThrow();
    }
    for (const caller of [f.foreign, f.unrelated, f.t]) {
      await expect(caller.query(api.payments.view, { offerId })).rejects.toThrow();
    }
    await f.owner.action(api.pix.start, { offerId, syntheticCpf: '111.444.777-35' });
    expect(await f.read(offerId)).toMatchObject({ phase: 'awaitingPix', pixCode: 'sandbox-pix-copy-code', requiresCpf: false });
    expect(await f.artist.query(api.payments.view, { offerId })).toEqual({ phase: 'awaitingPayment' });
    expect(f.createBodies).toEqual([{ method: 'PIX', data: {
      amount: 5000, externalId: expect.any(String), description: 'Mecenas teste', expiresIn: 900,
      metadata: { mecenasPaymentRef: expect.any(String) }, passFeesToCustomer: false,
    } }]);
    const identities = await f.t.run(ctx => ctx.db.query('paymentIdentities').collect());
    expect(identities).toHaveLength(1);
    expect(identities[0].hash).toBe(allowedHash);
    expect(JSON.stringify(identities)).not.toContain(cpf);
  });

  test('one CPF claim succeeds across competing accounts, and an owner can reuse it', async () => {
    const f = await fixture();
    const one = await f.offer();
    const other = await f.offer(f.foreign, f.unrelated);
    await expect(f.owner.action(api.pix.start, { offerId: one.offerId, syntheticCpf: '12345678900' })).rejects.toThrow();
    const results = await Promise.allSettled([
      f.owner.action(api.pix.start, { offerId: one.offerId, syntheticCpf: cpf }),
      f.foreign.action(api.pix.start, { offerId: other.offerId, syntheticCpf: cpf }),
    ]);
    expect(results.filter(result => result.status === 'fulfilled')).toHaveLength(1);
    expect(f.createBodies).toHaveLength(1);
    const client = results[0].status === 'fulfilled' ? f.owner : f.foreign;
    const following = await f.offer(client);
    await client.action(api.pix.start, { offerId: following.offerId });
    expect(f.createBodies).toHaveLength(2);
  });

  test('lost response and concurrent start reconcile the original charge without creating another', async () => {
    const f = await fixture();
    const { offerId } = await f.offer();
    f.drop();
    await Promise.all([
      f.owner.action(api.pix.start, { offerId, syntheticCpf: cpf }),
      f.owner.action(api.pix.start, { offerId, syntheticCpf: cpf }),
    ]);
    expect(f.createBodies).toHaveLength(1);
    expect((await f.read(offerId)).phase).toBe('checking');
    await f.owner.action(api.pix.refresh, { offerId });
    expect((await f.read(offerId)).phase).toBe('awaitingPix');
    await f.owner.action(api.pix.start, { offerId });
    expect(f.createBodies).toHaveLength(1);
  });

  test('payment creation retains the price on a three-slot offer and recovers a failed local write', async () => {
    const f = await fixture();
    const { offerId, requestId } = await f.offer(f.owner, f.artist, true, 3);
    expect(await f.owner.query(api.requests.get, { id: requestId })).toMatchObject({ artistSlots: 3, status: 'open' });
    // Use the same Convex runtime handler seam as the prior rollback checks.
    const handler = observe as unknown as { _handler: (...args: unknown[]) => Promise<unknown> };
    const persist = vi.spyOn(handler, '_handler').mockRejectedValueOnce(new Error('Synthetic persistence failure'));
    await f.owner.action(api.pix.start, { offerId, syntheticCpf: cpf });
    expect(persist).toHaveBeenCalledOnce();
    expect(f.records[0]).toMatchObject({ amount: 5000, status: 'PENDING' });
    expect((await f.read(offerId)).phase).toBe('checking');
    await f.owner.action(api.pix.refresh, { offerId });
    expect((await f.read(offerId)).phase).toBe('awaitingPix');
    expect(f.createBodies).toHaveLength(1);
  });

  test('rejects wrong webhook proof and funding from unconfirmed, mismatched or live payments', async () => {
    const f = await fixture();
    const { offerId } = await f.offer();
    await f.owner.action(api.pix.start, { offerId, syntheticCpf: cpf });
    const row = f.records[0];
    const raw = f.event(row);
    expect((await f.deliver(raw, 'wrong')).status).toBe(401);
    expect((await f.deliver(raw, webhookKey, 'invalid')).status).toBe(401);
    expect((await f.deliver(f.event(row, 'log_prod', false))).status).toBe(400);
    expect((await f.deliver(f.event({ ...row, amount: 5001 }))).status).toBe(204);
    expect((await f.deliver(raw)).status).toBe(503);
    row.status = 'PAID';
    row.amount = 4999;
    expect((await f.deliver(raw)).status).toBe(503);
    expect(await f.artist.query(api.payments.view, { offerId })).toEqual({ phase: 'awaitingPayment' });
  });

  test('canonical paid webhook and client refresh fund once, with unchanged artist price', async () => {
    const f = await fixture();
    const { offerId } = await f.offer();
    await f.owner.action(api.pix.start, { offerId, syntheticCpf: cpf });
    const row = f.records[0];
    row.status = 'PAID';
    const raw = f.event(row);
    const [delivery] = await Promise.all([f.deliver(raw), f.owner.action(api.pix.refresh, { offerId })]);
    expect(delivery.status).toBe(204);
    expect((await f.deliver(raw)).status).toBe(204);
    expect((await f.deliver(f.event(row, 'log_resend'))).status).toBe(204);
    expect(await f.artist.query(api.payments.view, { offerId })).toEqual({ phase: 'funded' });
    const attempts = await f.t.run(ctx => ctx.db.query('paymentAttempts').collect());
    expect(attempts).toHaveLength(1);
    expect(attempts[0]).toMatchObject({ phase: 'funded', amountCents: 5000 });
    expect(attempts[0].pixCode).toBeUndefined();
    expect(await f.t.run(ctx => ctx.db.query('paymentEvents').collect())).toHaveLength(2);
  });

  test('confirmed expiry permits replacement and a later distinct paid charge records one conflict', async () => {
    const f = await fixture();
    const { offerId } = await f.offer();
    await f.owner.action(api.pix.start, { offerId, syntheticCpf: cpf });
    f.records[0].status = 'EXPIRED';
    await f.owner.action(api.pix.refresh, { offerId });
    expect((await f.read(offerId)).phase).toBe('replaceable');
    expect((await f.artist.query(api.applications.mine, {}))[0].offer?.status).toBe('accepted');
    await f.owner.action(api.pix.start, { offerId });
    expect(f.records[0].metadata).not.toEqual(f.records[1].metadata);
    f.records[1].status = 'PAID';
    expect((await f.deliver(f.event(f.records[1]))).status).toBe(204);
    f.records[0].status = 'PAID';
    expect((await f.deliver(f.event(f.records[0], 'log_late'))).status).toBe(204);
    const events = await f.t.run(ctx => ctx.db.query('paymentEvents').collect());
    expect(events.map(event => event.result)).toEqual(['funded', 'conflict']);
    const attempts = await f.t.run(ctx => ctx.db.query('paymentAttempts').collect());
    expect(attempts.filter(attempt => attempt.phase === 'funded')).toHaveLength(1);
  });

  test('unexpected production responses and credentials fail closed', async () => {
    const f = await fixture();
    const { offerId } = await f.offer();
    vi.stubEnv('ABACATEPAY_API_KEY', 'abc_prod_synthetic_fixture');
    await expect(f.owner.action(api.pix.start, { offerId, syntheticCpf: cpf })).rejects.toThrow();
    expect(f.fetch).not.toHaveBeenCalled();
    vi.stubEnv('ABACATEPAY_API_KEY', 'abc_dev_synthetic_fixture');
    f.production();
    await f.owner.action(api.pix.start, { offerId, syntheticCpf: cpf });
    expect(await f.read(offerId)).toMatchObject({ phase: 'checking' });
    expect((await f.read(offerId))).not.toHaveProperty('pixCode');
  });
});

test('006 refund requires a canonical match before posting or confirming', async () => {
  const { reconcileRefund } = await import('../lib/pix-provider');
  const attempt = { reference: 'mecenas-' + crypto.randomUUID(), amountCents: 5000, providerId: 'pix_char_test006' };
  vi.stubEnv('ABACATEPAY_TEST_MODE', 'true');
  vi.stubEnv('ABACATEPAY_API_KEY', 'abc_dev_fixture');
  const base = { id: attempt.providerId, amount: 5000, status: 'PAID', devMode: true, metadata: { mecenasPaymentRef: attempt.reference } };
  for (const change of [{ devMode: false }, { id: 'pix_char_other' }, { amount: 4999 }, { paidAmount: 4999 },
    { externalId: 'other' }, { metadata: { mecenasPaymentRef: 'other' } }]) {
    const fetch = vi.fn(async () => Response.json({ success: true, data: [{ ...base, ...change }] }));
    vi.stubGlobal('fetch', fetch);
    const reserve = vi.fn(async () => true);
    expect(await reconcileRefund(attempt, reserve, async () => {})).toBe(false);
    expect(reserve).not.toHaveBeenCalled();
    expect(fetch).toHaveBeenCalledTimes(1);
  }
});
