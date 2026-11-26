import { registerCore, sessionIdentity } from '@convex-dev/auth/test';
import { registerPassword } from '@convex-dev/auth/components/password/test';
import { registerUsername } from '@convex-dev/auth/components/username/test';
import { convexTest } from 'convex-test';
import { afterEach, expect, test, vi } from 'vitest';
import { api, internal } from '../convex/_generated/api';
import type { Id } from '../convex/_generated/dataModel';
import schema from '../convex/schema';
import { DEMO_ACCOUNTS, DEMO_COMMISSIONS, type DemoCommissionKey } from '../lib/demo-fixture';

const modules = import.meta.glob('../convex/**/*.ts');
const password = 'synthetic-demo-password-007';
afterEach(() => vi.unstubAllEnvs());

async function seeded() {
  vi.stubEnv('CONVEX_CLOUD_URL', 'https://synthetic-test.convex.cloud');
  const t = convexTest(schema, modules);
  registerCore(t); registerPassword(t); registerUsername(t);
  const result = await t.action(internal.demoSeed.run, { password });
  async function login(key: keyof typeof DEMO_ACCOUNTS) {
    const session = await t.mutation(api.auth.signInWithUsernamePassword, { username: DEMO_ACCOUNTS[key].username, password });
    if (session.status !== 'complete') throw new Error('Demo sign-in failed');
    return t.withIdentity(sessionIdentity(session.tokens));
  }
  async function offer(key: DemoCommissionKey) {
    return t.run(async ctx => {
      const request = (await ctx.db.query('requests').collect()).find(row => row.title === DEMO_COMMISSIONS[key].title)!;
      return (await ctx.db.query('offers').withIndex('by_request_status', q => q.eq('requestId', request._id)).unique())!._id;
    });
  }
  return { t, result, login, offer };
}

async function counts(t: Awaited<ReturnType<typeof seeded>>['t']) {
  return t.run(async ctx => {
    const tables = ['users', 'profiles', 'requests', 'applications', 'offers', 'paymentAttempts', 'deliveryVersions', 'disputes', 'deliveryReleases', 'uploads', 'deliveryUploads'] as const;
    const out: Record<string, number> = {};
    for (const table of tables) out[table] = (await ctx.db.query(table).collect()).length;
    out.files = (await ctx.db.system.query('_storage').collect()).length;
    return out;
  });
}

test('007 seed creates every demo state and a second run reproduces it without duplicates', async () => {
  const { t, result } = await seeded();
  expect(result).toMatchObject({ createdAccounts: 5, removedCommissions: 0 });
  const first = await counts(t);
  expect(first).toMatchObject({ users: 5, profiles: 5, requests: 6, applications: 8, offers: 5, paymentAttempts: 3,
    deliveryVersions: 4, disputes: 1, deliveryReleases: 1 });
  const again = await t.action(internal.demoSeed.run, { password });
  expect(again).toMatchObject({ createdAccounts: 0, removedCommissions: 6, detachedCommissions: 0, commissions: result.commissions });
  expect(await counts(t)).toEqual(first);
  expect(await t.run(ctx => ctx.db.query('paymentAttempts').collect())).toSatisfy(
    (rows: { demo?: true; providerId?: string }[]) => rows.every(row => row.demo === true && row.providerId === undefined));
});

test('007 seed refuses a short password', async () => {
  vi.stubEnv('CONVEX_CLOUD_URL', 'https://synthetic-test.convex.cloud');
  const t = convexTest(schema, modules);
  registerCore(t); registerPassword(t); registerUsername(t);
  await expect(t.action(internal.demoSeed.run, { password: 'short' })).rejects.toThrow(/12 caracteres/);
});

test('007 demo accounts sign in and both roles see labelled demo payments in each state', async () => {
  const { login, offer } = await seeded();
  const client = await login('cliente');
  const iara = await login('iara');
  const [b, c, d, e, f] = await Promise.all((['B', 'C', 'D', 'E', 'F'] as const).map(offer));
  expect((await iara.query(api.applications.mine, {})).find((row: { offer: { id: string; status: string } | null }) => row.offer?.id === b)?.offer?.status).toBe('pending');
  expect(await client.query(api.payments.view, { offerId: c })).toEqual(expect.not.objectContaining({ demo: true }));
  for (const actor of [client, iara]) expect(await actor.query(api.payments.view, { offerId: d })).toMatchObject({ phase: 'funded', demo: true });
  expect(await client.query(api.deliveries.mine, { offerId: d })).toMatchObject({ phase: 'review', version: 1, demoPayment: true, processCount: 2 });
  expect(await client.query(api.deliveries.mine, { offerId: e })).toMatchObject({ phase: 'approved', version: 2,
    revisions: [{ version: 1 }], release: { reason: 'manual', amountCents: 20000 } });
  const original = await client.action(api.deliveryFiles.read, { offerId: e, version: 2, kind: 'original' });
  expect(original.contentType).toBe('image/png');
  expect(await client.query(api.deliveries.mine, { offerId: f })).toMatchObject({ phase: 'disputed', dispute: { status: 'open' } });
  await expect(client.action(api.deliveryFiles.read, { offerId: d, version: 1, kind: 'original' })).rejects.toThrow();
});

test('007 upholding a dispute on a demo payment gives a labelled demo refund with no provider job', async () => {
  const { t, result, login, offer } = await seeded();
  vi.stubEnv('MECENAS_REVIEWER_USER_ID', result.reviewerUserId);
  const reviewer = await login('revisor');
  const client = await login('cliente');
  const f = await offer('F');
  const [record] = (await reviewer.query(api.disputes.queue, {}))!;
  expect(record).toMatchObject({ offerId: f, status: 'open' });
  await reviewer.mutation(api.disputes.decide, { caseId: record.id as Id<'disputes'>, outcome: 'uphold', note: 'Acolhida na demonstração.' });
  expect(await client.query(api.deliveries.mine, { offerId: f })).toMatchObject({ phase: 'rejected', demoPayment: true, dispute: { status: 'refunded' } });
  // 009: after a refund neither side is told the payment is still confirmed.
  const bento = await login('bento');
  for (const actor of [client, bento]) expect(await actor.query(api.payments.view, { offerId: f })).toMatchObject({ phase: 'funded', demo: true, refunded: true });
  expect((await client.query(api.requests.mine, {})).find(r => r.title === DEMO_COMMISSIONS.F.title)?.stage).toBe('refunded');
  expect(await reviewer.query(api.disputes.queue, {})).toEqual([]);
  const jobs = await t.run(ctx => ctx.db.system.query('_scheduled_functions').collect());
  expect(jobs.some(job => job.name.includes('refunds'))).toBe(false);
  expect(await t.run(ctx => ctx.db.query('deliveryReleases').collect())).toHaveLength(1);
  await expect(client.action(api.deliveryFiles.read, { offerId: f, version: 1, kind: 'original' })).rejects.toThrow();
});

test('007 reseeding keeps a commission that holds a real (non-demo) payment, and refuses a changed password', async () => {
  const { t, offer } = await seeded();
  const c = await offer('C');
  await t.run(ctx => ctx.db.insert('paymentAttempts', { offerId: c, reference: 'mecenas-real', amountCents: 12000, phase: 'funded', providerId: 'sandbox-charge' }));
  const again = await t.action(internal.demoSeed.run, { password });
  expect(again).toMatchObject({ removedCommissions: 5, detachedCommissions: 1 });
  const kept = await t.run(async ctx => ({
    attempt: await ctx.db.query('paymentAttempts').withIndex('by_provider', q => q.eq('providerId', 'sandbox-charge')).unique(),
    requests: (await ctx.db.query('requests').collect()).filter(r => r.title === DEMO_COMMISSIONS.C.title).map(r => r.demo === true),
  }));
  expect(kept.attempt?.offerId).toBe(c);
  expect(kept.requests.sort()).toEqual([false, true]);
  await expect(t.action(internal.demoSeed.run, { password: 'another-demo-password-1' })).rejects.toThrow(/não confere/);
});

test('007 payment observation ignores a demo attempt', async () => {
  const { t, offer } = await seeded();
  const d = await offer('D');
  const attempt = await t.run(async ctx => (await ctx.db.query('paymentAttempts').withIndex('by_offer', q => q.eq('offerId', d)).unique())!);
  const charge = { providerId: 'forged', amountCents: attempt.amountCents, status: 'PAID' as const };
  expect(await t.mutation(internal.payments.observe, { attemptId: attempt._id, charge, eventId: 'evt-demo' })).toBe(false);
  expect((await t.run(ctx => ctx.db.get(attempt._id)))?.providerId).toBeUndefined();
});

test('009 the client list shows one stage per commission, and Pix says it is not configured here', async () => {
  const { login, offer } = await seeded();
  const client = await login('cliente');
  const stages = Object.fromEntries((await client.query(api.requests.mine, {})).map(r => [r.title, r.stage]));
  expect((['A', 'B', 'C', 'D', 'E', 'F'] as const).map(key => stages[DEMO_COMMISSIONS[key].title]))
    .toEqual([undefined, 'pendingOffer', 'awaitingPayment', 'review', 'approved', 'disputed']);
  expect(await client.query(api.payments.view, { offerId: await offer('C') })).toMatchObject({ phase: 'awaitingPayment', pixUnavailable: true });
  expect(await client.query(api.payments.view, { offerId: await offer('D') })).not.toHaveProperty('pixUnavailable');
  expect(await client.query(api.payments.view, { offerId: await offer('D') })).not.toHaveProperty('refunded');
});

test('009 a declined offer drops out of the stage; the backup offer shows as sent', async () => {
  const { login, offer } = await seeded();
  const client = await login('cliente');
  const iara = await login('iara');
  await iara.mutation(api.applications.respond, { offerId: await offer('B'), response: 'decline' });
  expect((await client.query(api.requests.mine, {})).find(r => r.title === DEMO_COMMISSIONS.B.title)?.stage).toBe('pendingOffer');
});
