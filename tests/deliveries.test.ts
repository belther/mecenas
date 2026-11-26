import { registerCore, sessionIdentity } from '@convex-dev/auth/test';
import { registerPassword } from '@convex-dev/auth/components/password/test';
import { registerUsername } from '@convex-dev/auth/components/username/test';
import { makeFunctionReference } from 'convex/server';
import { convexTest } from 'convex-test';
import sharp from 'sharp';
import { createHmac } from 'node:crypto';
import { webhookBodyKey } from '../lib/pix-provider';
import { afterEach, expect, test, vi } from 'vitest';
import { api, internal } from '../convex/_generated/api';
import type { GenericId } from 'convex/values';
import type { Id } from '../convex/_generated/dataModel';
import schema from '../convex/schema';

type Offer = { offerId: Id<'offers'> };
type Version = Offer & { version: number };
type Staged = GenericId<'deliveryUploads'>;
type Set = Offer & { expectedVersion: number; originalId: Staged; processIds: Staged[] };
type View = {
  phase: string; version: number; revisions: { version: number; note: string }[];
  processCount: number; release?: { amountCents: number; currency: string; licence: string };
};
const mine = makeFunctionReference<'query', Offer, View>('deliveries:mine');
const upload = makeFunctionReference<'action', Offer & {
  expectedVersion: number; kind: 'original' | 'process'; bytes: ArrayBuffer; contentType: string;
}, Staged>('deliveryFiles:upload');
const submit = makeFunctionReference<'mutation', Set>('deliveries:submit');
const revise = makeFunctionReference<'mutation', Version & { note: string }>('deliveries:requestRevision');
const approve = makeFunctionReference<'mutation', Version>('deliveries:approve');
const read = makeFunctionReference<'action', Version & {
  kind: 'original' | 'preview' | 'process'; processIndex?: number;
}, { bytes: ArrayBuffer; contentType: string }>('deliveryFiles:read');

const modules = import.meta.glob('../convex/**/*.ts');
const note = 'Ajuste a cor do céu.';
afterEach(() => vi.unstubAllEnvs());

async function fixture() {
  vi.stubEnv('CONVEX_CLOUD_URL', 'https://synthetic-test.convex.cloud');
  const t = convexTest(schema, modules);
  registerCore(t);
  registerPassword(t);
  registerUsername(t);
  async function actor(username: string, role: 'artist' | 'client') {
    vi.stubEnv('MECENAS_DEMO_USERNAMES', username);
    const result = await t.mutation(api.auth.signUpWithUsernamePassword, {
      username, password: crypto.randomUUID() + 'aA9!',
    });
    if (result.status !== 'complete') throw new Error('Synthetic sign-up failed');
    const caller = t.withIdentity(sessionIdentity(result.tokens));
    await caller.mutation(api.profiles.save, { role, displayName: username, bio: '', portfolioUploadIds: [] });
    return caller;
  }
  const client = await actor('cliente-entrega', 'client');
  const artist = await actor('artista-entrega', 'artist');
  const otherClient = await actor('cliente-outro', 'client');
  const otherArtist = await actor('artista-outro', 'artist');

  async function offer(funded = true) {
    const requestId = await client.mutation(api.requests.saveDraft, {
      title: 'Encomenda sintética de entrega',
      description: 'Uma ilustração fictícia para testar as revisões e a entrega.',
      artistSlots: 1, pricePerArtistCents: 5000, exampleUploadIds: [],
    });
    await client.mutation(api.requests.publish, { id: requestId });
    const id = await artist.mutation(api.applications.apply, { requestId });
    await client.mutation(api.applications.select, {
      requestId, selectedApplicationIds: [id], backupApplicationIds: [], expectedRevision: 0,
    });
    const offerId = (await artist.query(api.applications.mine, {})).find(row => row.requestId === requestId)?.offer?.id;
    if (!offerId) throw new Error('Synthetic offer missing');
    await artist.mutation(api.applications.respond, { offerId, response: 'accept' });
    if (funded) await t.run(ctx => ctx.db.insert('paymentAttempts', {
      offerId, reference: 'fixture-' + offerId, amountCents: 5000, phase: 'funded',
    }));
    return { offerId };
  }

  const original = new Uint8Array(await sharp({ create: {
    width: 1300, height: 900, channels: 3, background: '#4a5388',
  } }).png().toBuffer()).buffer;

  async function stage(offer: Offer, expectedVersion = 0, count = 2): Promise<Set> {
    const args = { ...offer, expectedVersion, bytes: original, contentType: 'image/png' };
    const originalId = await artist.action(upload, { ...args, kind: 'original' });
    const processIds = [];
    for (let index = 0; index < count; index++) processIds.push(await artist.action(upload, { ...args, kind: 'process' }));
    return { ...offer, expectedVersion, originalId, processIds };
  }

  return { t, client, artist, otherClient, otherArtist, offer, original, stage };
}

test('a funded offer supports a complete delivery and private illustrated review', async () => {
  const { t, client, artist, otherClient, otherArtist, offer, original, stage } = await fixture();
  const funded = await offer();
  await expect(artist.query(api.payments.view, funded)).resolves.toEqual({ phase: 'funded' });
  const eligibility = await artist.query(mine, funded).catch((error: unknown) => {
    if (error instanceof Error && error.message.includes('Could not find module for: "deliveries"')) return null;
    throw error;
  });
  expect(eligibility, 'A verified funded offer should show delivery eligibility').toMatchObject({ phase: 'ready', version: 0 });
  await artist.mutation(submit, await stage(funded, 0, 3));
  const review = await client.query(mine, funded);
  expect(review).toMatchObject({ phase: 'review', version: 1, processCount: 3 });
  expect(JSON.stringify(review)).not.toMatch(/https?:|storageId|originalId/i);

  const args = { ...funded, version: 1 };
  const preview = await client.action(read, { ...args, kind: 'preview' });
  const metadata = await sharp(Buffer.from(preview.bytes)).metadata();
  expect(preview.contentType).toBe('image/webp');
  expect(metadata.width).toBeLessThan(1300);
  const { data } = await sharp(Buffer.from(preview.bytes)).removeAlpha().raw().toBuffer({ resolveWithObject: true });
  expect(new Set(data).size).toBeGreaterThan(10);
  await expect(artist.action(read, { ...args, kind: 'process', processIndex: 2 })).resolves.toMatchObject({ contentType: 'image/webp' });
  await expect(client.action(read, { ...args, kind: 'original' })).rejects.toThrow();
  for (const stranger of [t, otherClient, otherArtist]) {
    await expect(stranger.query(mine, funded)).rejects.toThrow();
    await expect(stranger.action(read, { ...args, kind: 'preview' })).rejects.toThrow();
  }
  await expect(artist.mutation(approve, args)).rejects.toThrow();
  await expect(otherClient.mutation(revise, { ...args, note })).rejects.toThrow();
  await expect(client.action(upload, {
    ...funded, expectedVersion: 1, kind: 'original', bytes: original, contentType: 'image/png',
  })).rejects.toThrow();
});

test('incomplete, invalid and cross-offer files never publish a delivery', async () => {
  const { client, artist, otherArtist, offer, original, stage } = await fixture();
  const funded = await offer();
  const unpaid = await offer(false);
  const args = { ...funded, expectedVersion: 0, kind: 'original' as const, bytes: original, contentType: 'image/png' };
  await expect(artist.action(upload, { ...args, ...unpaid })).rejects.toThrow();
  await expect(otherArtist.action(upload, args)).rejects.toThrow();
  await expect(artist.action(upload, { ...args, bytes: new ArrayBuffer(10) })).rejects.toThrow();
  await expect(artist.action(upload, { ...args, contentType: 'image/jpeg' })).rejects.toThrow();
  const staged = await stage(funded);
  const other = await stage(await offer());
  for (const processIds of [[], [staged.processIds[0]], [staged.processIds[0], staged.processIds[0]],
    [staged.originalId, staged.processIds[0]], other.processIds, [...staged.processIds, ...other.processIds]]) {
    await expect(artist.mutation(submit, { ...staged, processIds })).rejects.toThrow();
  }
  await expect(artist.mutation(submit, { ...staged, originalId: staged.processIds[0] })).rejects.toThrow();
  await expect(client.query(mine, funded)).resolves.toMatchObject({ phase: 'ready', version: 0 });
  await artist.mutation(submit, staged);
  await expect(client.query(mine, funded)).resolves.toMatchObject({ phase: 'review', version: 1, processCount: 2 });
});

test('two revisions preserve history and only the approved original becomes downloadable', async () => {
  const { t, client, artist, offer, original, stage } = await fixture();
  const funded = await offer();
  await artist.mutation(submit, await stage(funded));
  for (const version of [1, 2]) {
    const review = { ...funded, version };
    await client.mutation(revise, { ...review, note: `${note} (${version})` });
    await expect(client.mutation(approve, review)).rejects.toThrow();
    await expect(client.mutation(revise, { ...review, note })).rejects.toThrow();
    await artist.mutation(submit, await stage(funded, version));
    await expect(client.mutation(approve, review)).rejects.toThrow();
  }
  const review = { ...funded, version: 3 };
  await expect(client.mutation(revise, { ...review, note })).rejects.toThrow();
  await Promise.allSettled(Array.from({ length: 3 }, () => client.mutation(approve, review)));
  await client.mutation(approve, review);
  for (const caller of [client, artist]) {
    await expect(caller.query(mine, funded)).resolves.toMatchObject({
      phase: 'approved', version: 3, revisions: [1, 2].map(version => ({ version, note: `${note} (${version})` })),
      release: { amountCents: 5000, currency: 'BRL', licence: expect.stringMatching(/uso pessoal/i) },
    });
  }
  const originalRequest = { ...review, kind: 'original' as const };
  await expect(client.action(read, originalRequest)).resolves.toEqual({ bytes: original, contentType: 'image/png' });
  await expect(client.action(read, { ...originalRequest, version: 2 })).rejects.toThrow();
  await expect(t.action(read, originalRequest)).rejects.toThrow();
  await expect(client.mutation(revise, { ...review, note })).rejects.toThrow();
  const releases = await t.run(ctx => ctx.db.query('deliveryReleases').collect());
  expect(releases).toHaveLength(1);
  expect(releases[0]).toMatchObject({ offerId: funded.offerId, version: 3, amountCents: 5000 });
});

test('competing submissions and reviews each allow one coherent transition', async () => {
  const { client, artist, offer, stage } = await fixture();
  const funded = await offer();
  const first = await stage(funded, 0, 2);
  const second = await stage(funded, 0, 3);
  const submissions = await Promise.allSettled([first, second].map(set => artist.mutation(submit, set)));
  expect(submissions.filter(result => result.status === 'fulfilled')).toHaveLength(1);
  await expect(client.query(mine, funded)).resolves.toMatchObject({
    version: 1, processCount: submissions[0].status === 'fulfilled' ? 2 : 3,
  });

  const version = { ...funded, version: 1 };
  const revisions = await Promise.allSettled([note, 'Troque a cor.'].map(note => client.mutation(revise, { ...version, note })));
  expect(revisions.filter(result => result.status === 'fulfilled')).toHaveLength(1);
  await expect(artist.query(mine, funded)).resolves.toMatchObject({ phase: 'revision', version: 1, revisions: [
    { version: 1, note: revisions[0].status === 'fulfilled' ? note : 'Troque a cor.' },
  ] });

  await expect(artist.mutation(submit, first)).rejects.toThrow();
  await artist.mutation(submit, await stage(funded, 1));
  const next = { ...funded, version: 2 };
  const [approval, revision] = await Promise.allSettled([
    client.mutation(approve, next), client.mutation(revise, { ...next, note }),
  ]);
  expect(approval.status === 'fulfilled').not.toEqual(revision.status === 'fulfilled');
  const state = await client.query(mine, funded);
  expect(state.phase).toBe(approval.status === 'fulfilled' ? 'approved' : 'revision');
  expect(state.revisions).toHaveLength(approval.status === 'fulfilled' ? 1 : 2);
  expect(state.release?.amountCents).toBe(approval.status === 'fulfilled' ? 5000 : undefined);
});

test('005 deadline wins over a late revision and releases the funded version once', async () => {
  const { t, client, artist, offer, stage, original } = await fixture();
  const funded = await offer();
  const files = await stage(funded);
  const version = { ...funded, version: 1 };
  vi.useFakeTimers({ now: Date.now() + 60000 });
  try {
    const due = Date.now() + 72 * 60 * 60 * 1000;
    await artist.mutation(submit, files);
    expect(await client.query(mine, funded)).toMatchObject({ phase: 'review', reviewBy: due });
    vi.setSystemTime(due);
    await client.mutation(revise, { ...version, note });
    await client.mutation(approve, version);
    for (const actor of [artist, client]) {
      expect(await actor.query(mine, funded)).toMatchObject({
        phase: 'approved', version: 1, revisions: [], release: { reason: 'deadline', amountCents: 5000 },
      });
    }
    expect(await t.run(ctx => ctx.db.query('deliveryReleases').collect())).toHaveLength(1);
    expect(Buffer.from((await client.action(read, { ...version, kind: 'original' })).bytes)).toEqual(Buffer.from(original));
  } finally { vi.useRealTimers(); }
});

test('005 scheduled approval ignores old versions and uses the current version and licence', async () => {
  const { t, client, artist, offer, stage } = await fixture();
  const funded = await offer();
  const files = await stage(funded);
  vi.useFakeTimers({ now: Date.now() + 60000 });
  try {
    const window = 72 * 60 * 60 * 1000;
    const firstDue = Date.now() + window;
    await artist.mutation(submit, files);
    const first = { ...funded, version: 1, reviewBy: firstDue };
    await vi.advanceTimersByTimeAsync(window - 1);
    await t.mutation(internal.deliveries.expireReview, first);
    await client.mutation(revise, { ...funded, version: 1, note });
    await vi.advanceTimersByTimeAsync(1);
    await t.finishInProgressScheduledFunctions();
    expect((await client.query(mine, funded)).phase).toBe('revision');
    const secondFiles = await stage(funded, 1);
    await vi.advanceTimersByTimeAsync(1000);
    const secondDue = Date.now() + window;
    await artist.mutation(submit, secondFiles);
    await t.mutation(internal.deliveries.expireReview, first);
    expect(await client.query(mine, funded)).toMatchObject({ phase: 'review', reviewBy: secondDue });
    await vi.advanceTimersByTimeAsync(window);
    await t.finishInProgressScheduledFunctions();
    await t.mutation(internal.deliveries.expireReview, { ...funded, version: 2, reviewBy: secondDue });
    expect(await client.query(mine, funded)).toMatchObject({ phase: 'approved', version: 2, release: { reason: 'deadline' } });
    expect(await t.run(ctx => ctx.db.query('deliveryReleases').collect())).toMatchObject([
      { version: 2, amountCents: 5000, reason: 'deadline' },
    ]);
  } finally { vi.useRealTimers(); }
});

test('005 initializes eligible legacy reviews once and preserves manual approval and historical reads', async () => {
  const { t, artist, client, offer, stage } = await fixture();
  const funded = await offer();
  await artist.mutation(submit, await stage(funded));
  const [delivery] = await t.run(ctx => ctx.db.query('deliveries').collect());
  const [payment] = await t.run(ctx => ctx.db.query('paymentAttempts').collect());
  await t.run(async ctx => {
    await ctx.db.patch(delivery._id, { reviewBy: undefined });
    await ctx.db.patch(payment._id, { amountCents: payment.amountCents - 1 });
  });
  vi.useFakeTimers({ now: Date.now() + 10 * 86400000 });
  try {
    await t.mutation(internal.deadlines.initializeReviews, {});
    expect((await t.run(ctx => ctx.db.get(delivery._id)))?.reviewBy).toBeUndefined();
    await t.run(ctx => ctx.db.patch(payment._id, { amountCents: payment.amountCents }));
    vi.setSystemTime(Date.now() + 100);
    const due = Date.now() + 3 * 86400000;
    await t.mutation(internal.deadlines.initializeReviews, {});
    vi.setSystemTime(due - 100);
    await t.mutation(internal.deadlines.initializeReviews, {});
    expect(await client.query(mine, funded)).toMatchObject({ phase: 'review', reviewBy: due });
    vi.setSystemTime(due - 1);
    await client.mutation(approve, { ...funded, version: 1 });
    vi.setSystemTime(due + 1);
    await t.mutation(internal.deliveries.expireReview, { ...funded, version: 1, reviewBy: due });
    expect(await artist.query(mine, funded)).toMatchObject({ release: { reason: 'manual' } });
    const [release] = await t.run(ctx => ctx.db.query('deliveryReleases').collect());
    await t.run(ctx => ctx.db.patch(release._id, { reason: undefined }));
    await t.mutation(internal.deadlines.initializeReviews, {});
    expect(await client.query(mine, funded)).toMatchObject({ phase: 'approved', release: { reason: 'manual' } });
  } finally { vi.useRealTimers(); }
});

test('005 due callback with unverified funding leaves the original locked', async () => {
  const { t, artist, offer, stage, client } = await fixture();
  const funded = await offer();
  await artist.mutation(submit, await stage(funded));
  const [delivery] = await t.run(ctx => ctx.db.query('deliveries').collect());
  const [payment] = await t.run(ctx => ctx.db.query('paymentAttempts').collect());
  await t.run(ctx => ctx.db.patch(payment._id, { phase: 'checking' }));
  const reviewBy = delivery.reviewBy!;
  vi.useFakeTimers({ now: reviewBy + 1 });
  try {
    await t.mutation(internal.deliveries.expireReview, { ...funded, version: 1, reviewBy });
    expect(await t.run(ctx => ctx.db.query('deliveryReleases').collect())).toHaveLength(0);
    await expect(client.action(read, { ...funded, version: 1, kind: 'original' })).rejects.toThrow();
  } finally { vi.useRealTimers(); }
});

test.each(['approve', 'revise'] as const)('005 due job racing a late %s preserves one automatic release', async action => {
  const { t, client, artist, offer, stage } = await fixture();
  const funded = await offer();
  await artist.mutation(submit, await stage(funded));
  const [delivery] = await t.run(ctx => ctx.db.query('deliveries').collect());
  const reviewBy = delivery.reviewBy!;
  const version = { ...funded, version: 1 };
  vi.useFakeTimers({ now: reviewBy + 1 });
  try {
    const userAction = () => action === 'approve' ? client.mutation(approve, version) :
      client.mutation(revise, { ...version, note });
    const [job] = await Promise.allSettled([
      t.mutation(internal.deliveries.expireReview, { ...version, reviewBy }), userAction(),
    ]);
    expect(job.status).toBe('fulfilled');
    expect(await client.query(mine, funded)).toMatchObject({ phase: 'approved', revisions: [], release: { reason: 'deadline' } });
    expect(await t.run(ctx => ctx.db.query('deliveryReleases').collect())).toHaveLength(1);
  } finally { vi.useRealTimers(); }
});

test('005 review migration continues across pages with an unfunded row and a racing revision', async () => {
  const { t, artist, client, offer, stage } = await fixture();
  const offers: Offer[] = [];
  for (let i = 0; i < 35; i++) {
    const funded = await offer();
    offers.push(funded);
    await artist.mutation(submit, await stage(funded));
    await t.run(async ctx => {
      const row = await ctx.db.query('deliveries').withIndex('by_offer', q => q.eq('offerId', funded.offerId)).unique();
      await ctx.db.patch(row!._id, { reviewBy: undefined });
      if (i === 0) {
        const payment = await ctx.db.query('paymentAttempts').withIndex('by_offer', q => q.eq('offerId', funded.offerId)).unique();
        await ctx.db.patch(payment!._id, { phase: 'checking' });
      }
    });
  }
  vi.useFakeTimers({ now: Date.now() + 60000 });
  try {
    const due = Date.now() + 3 * 86400000;
    await t.mutation(internal.deadlines.initializeReviews, {});
    const rows = () => t.run(ctx => ctx.db.query('deliveries').collect());
    expect((await rows()).filter(d => d.reviewBy === due)).toHaveLength(31);
    await Promise.all([
      client.mutation(revise, { ...offers[34], version: 1, note }),
      vi.advanceTimersByTimeAsync(1),
    ]);
    await t.finishInProgressScheduledFunctions();
    const states = await rows();
    expect(states.filter(d => d.phase === 'review' && d.reviewBy !== undefined)).toHaveLength(33);
    expect(states.find(d => d.offerId === offers[0].offerId)?.reviewBy).toBeUndefined();
    const revised = states.find(d => d.offerId === offers[34].offerId);
    expect(revised?.phase).toBe('revision');
    expect(revised?.reviewBy).toBeUndefined();
    expect(await t.run(ctx => ctx.db.query('deliveryReleases').collect())).toHaveLength(0);
  } finally { vi.useRealTimers(); }
}, 90000);

test('006 timely client flag freezes the version through the scheduled deadline', async () => {
  const { t, artist, client, offer, stage } = await fixture();
  const funded = await offer();
  await artist.mutation(submit, await stage(funded));
  const row = await t.run(ctx => ctx.db.query('deliveries').unique());
  const due = row!.reviewBy!;
  vi.useFakeTimers({ now: due - 1 });
  try {
    const flag = makeFunctionReference<'mutation', Version & { reason: string }>('disputes:flag');
    const result = await Promise.allSettled([client.mutation(flag, { ...funded, version: 1, reason: 'Peço avaliação do processo.' })]);
    vi.setSystemTime(due + 100);
    await t.mutation(internal.deliveries.expireReview, { ...funded, version: 1, reviewBy: due });
    expect(await client.query(mine, funded)).toMatchObject({ phase: 'disputed', version: 1 });
    expect(result[0].status).toBe('fulfilled');
    expect(await t.run(ctx => ctx.db.query('deliveryReleases').collect())).toHaveLength(0);
  } finally { vi.useRealTimers(); }
});

type Scenario = Awaited<ReturnType<typeof fixture>>;
async function designate(f: Scenario, actor: Scenario['client']) {
  const profile = await actor.query(api.profiles.me, {});
  const record = await f.t.run(ctx => ctx.db.get(profile!._id));
  vi.stubEnv('MECENAS_REVIEWER_USER_ID', record!.userId);
}

test.each([0, 1])('006 a flag %i milliseconds after the deadline settles automatic approval', async delta => {
  const f = await fixture();
  const funded = await f.offer();
  await f.artist.mutation(submit, await f.stage(funded));
  const view = await f.client.query(api.deliveries.mine, funded);
  vi.useFakeTimers({ now: view.reviewBy! + delta });
  try {
    await f.client.mutation(api.disputes.flag, { ...funded, version: 1, reason: 'Verificar' });
    expect(await f.client.query(api.deliveries.mine, funded)).toMatchObject({ phase: 'approved', release: { reason: 'deadline' } });
    expect(await f.t.run(ctx => ctx.db.query('disputes').collect())).toHaveLength(0);
  } finally { vi.useRealTimers(); }
});

test.each(['approve', 'revise'] as const)('006 flag competing with %s gives one actionable state', async action => {
  const f = await fixture();
  const funded = await f.offer();
  await f.artist.mutation(submit, await f.stage(funded));
  const version = { ...funded, version: 1 };
  const competing = () => action === 'approve' ? f.client.mutation(approve, version) : f.client.mutation(revise, { ...version, note });
  const result = await Promise.allSettled([f.client.mutation(api.disputes.flag, { ...version, reason: 'Verificar' }), competing()]);
  expect(result.filter(r => r.status === 'fulfilled')).toHaveLength(1);
  const view = await f.client.query(api.deliveries.mine, funded);
  const disputes = await f.t.run(ctx => ctx.db.query('disputes').collect());
  expect(disputes).toHaveLength(view.phase === 'disputed' ? 1 : 0);
  expect(await f.t.run(ctx => ctx.db.query('deliveryReleases').collect())).toHaveLength(view.phase === 'approved' ? 1 : 0);
});

test('006 only the independent reviewer can inspect case evidence and decide the bound version', async () => {
  const f = await fixture();
  const funded = await f.offer();
  await f.artist.mutation(submit, await f.stage(funded));
  const version = { ...funded, version: 1 };
  const flag = { ...version, reason: 'Compare o processo e a prévia.' };
  await expect(f.otherClient.mutation(api.disputes.flag, flag)).rejects.toThrow();
  await expect(f.artist.mutation(api.disputes.flag, flag)).rejects.toThrow();
  await expect(f.client.mutation(api.disputes.flag, { ...flag, version: 2 })).rejects.toThrow();
  await f.client.mutation(api.disputes.flag, flag);
  await f.client.mutation(api.disputes.flag, flag);
  await designate(f, f.otherClient);
  const cases = await f.otherClient.query(api.disputes.queue, {});
  expect(cases).toHaveLength(1);
  const caseId = cases![0].id;
  const ruling = { caseId, outcome: 'dismiss' as const, note: 'Etapas coerentes com a ilustração.' };
  const evidence = { ...version, caseId };
  for (const actor of [f.artist, f.client, f.otherArtist]) {
    expect(await actor.query(api.disputes.queue, {})).toBeNull();
    await expect(actor.mutation(api.disputes.decide, ruling)).rejects.toThrow();
    await expect(actor.action(api.deliveryFiles.read, { ...evidence, kind: 'preview' })).rejects.toThrow();
  }
  await designate(f, f.client);
  expect(await f.client.query(api.disputes.queue, {})).toEqual([]);
  await expect(f.client.mutation(api.disputes.decide, ruling)).rejects.toThrow();
  await designate(f, f.otherClient);
  expect((await f.otherClient.action(api.deliveryFiles.read, { ...evidence, kind: 'process', processIndex: 1 })).bytes.byteLength).toBeGreaterThan(0);
  await expect(f.otherClient.action(api.deliveryFiles.read, { ...evidence, kind: 'original' })).rejects.toThrow();
  const decisions = await Promise.allSettled([f.otherClient.mutation(api.disputes.decide, ruling),
    f.otherClient.mutation(api.disputes.decide, { ...ruling, outcome: 'uphold' })]);
  expect(decisions.filter(r => r.status === 'fulfilled')).toHaveLength(1);
  const state = await f.client.query(api.deliveries.mine, funded);
  if (state.phase === 'approved') {
    expect(state.release).toMatchObject({ amountCents: 5000, reason: 'dismissed' });
    expect(Buffer.from((await f.client.action(read, { ...version, kind: 'original' })).bytes)).toEqual(Buffer.from(f.original));
  } else {
    expect(state.phase).toBe('rejected');
    expect(state.release).toBeUndefined();
  }
  await expect(f.otherClient.action(api.deliveryFiles.read, { ...evidence, kind: 'preview' })).rejects.toThrow();
});

test('006 refund survives refusal, lost confirmation and repeat notifications with every client version locked', async () => {
  const f = await fixture();
  const funded = await f.offer();
  await designate(f, f.otherClient);
  for (const n of [0, 1]) {
    await f.artist.mutation(submit, await f.stage(funded, n));
    if (n === 0) await f.client.mutation(revise, { ...funded, version: 1, note });
  }
  const reference = 'mecenas-' + crypto.randomUUID();
  const providerId = 'pix_char_synthetic006';
  const attemptId = await f.t.run(async ctx => {
    const payment = (await ctx.db.query('paymentAttempts').unique())!;
    await ctx.db.patch(payment._id, { reference, providerId }); return payment._id;
  });
  await f.client.mutation(api.disputes.flag, { ...funded, version: 2, reason: 'Revisar a versão final' });
  const caseId = (await f.otherClient.query(api.disputes.queue, {}))![0].id;
  vi.stubEnv('ABACATEPAY_API_KEY', 'abc_dev_fixture');
  vi.stubEnv('ABACATEPAY_TEST_MODE', 'true');
  let refundCalls = 0;
  let refunded = false;
  let outage = false;
  let staleRead = false;
  const sandbox = vi.fn(async (input: URL | Request | string, options?: RequestInit) => {
    const url = new URL(String(input));
    expect(url.origin).toBe('https://api.abacatepay.com');
    if (url.pathname.endsWith('/refund')) {
      expect(JSON.parse(String(options?.body)).id).toBe(providerId);
      refundCalls++;
      if (refundCalls === 1) return Response.json({ success: false, error: 'Saldo insuficiente para realizar o reembolso.' }, { status: 400 });
      refunded = true; outage = true; throw Error('Lost response');
    }
    expect(url.searchParams.get('id')).toBe(providerId);
    if (outage) throw Error('Temporary lookup failure');
    return Response.json({ success: true, data: [{ id: providerId, metadata: { mecenasPaymentRef: reference },
      amount: 5000, devMode: true, status: refunded && !staleRead ? 'REFUNDED' : 'PAID' }] });
  });
  vi.stubGlobal('fetch', sandbox);
  vi.useFakeTimers({ now: Date.now() + 60000 });
  try {
    await f.otherClient.mutation(api.disputes.decide, { caseId, outcome: 'uphold', note: 'Contestação acolhida.' });
    const run = async () => { await vi.advanceTimersByTimeAsync(10); await f.t.finishInProgressScheduledFunctions(); };
    await run();
    expect(refundCalls).toBe(1);
    expect(await f.client.query(api.deliveries.mine, funded)).toMatchObject({ phase: 'rejected', licence: '', dispute: { status: 'refundPending' } });
    for (const version of [1, 2]) {
      for (const kind of ['original', 'preview', 'process'] as const) {
        await expect(f.client.action(read, { ...funded, version, kind, processIndex: 0 })).rejects.toThrow();
      }
    }
    expect(Buffer.from((await f.artist.action(read, { ...funded, version: 2, kind: 'original' })).bytes)).toEqual(Buffer.from(f.original));
    await f.otherClient.mutation(api.disputes.retryRefund, { caseId });
    await run();
    expect((await f.artist.query(api.deliveries.mine, funded)).dispute?.status).toBe('refundPending');
    outage = false;
    staleRead = true;
    await f.otherClient.mutation(api.disputes.retryRefund, { caseId });
    await run();
    expect(refundCalls).toBe(2);
    expect((await f.client.query(api.deliveries.mine, funded)).dispute?.status).toBe('refundPending');
    staleRead = false;
    await f.otherClient.mutation(api.disputes.retryRefund, { caseId });
    await run();
    expect(refundCalls).toBe(2);
    const secret = 'synthetic-demo-webhook-secret-iteration-006';
    vi.stubEnv('ABACATEPAY_WEBHOOK_SECRET', secret);
    for (const type of ['refunded', 'refunded', 'completed']) {
      const raw = JSON.stringify({ id: 'log_fixture006', devMode: true, apiVersion: 2, event: 'transparent.' + type,
        data: { transparent: { id: providerId, devMode: true, amount: 5000, metadata: { mecenasPaymentRef: reference },
          status: type === 'refunded' ? 'REFUNDED' : 'PAID' } } });
      const signature = createHmac('sha256', webhookBodyKey).update(raw).digest('base64');
      const response = await f.t.fetch('/webhooks/abacatepay', { method: 'POST', body: raw,
        headers: { 'X-Webhook-Secret': secret, 'X-Webhook-Signature': signature } });
      expect(response.status).toBe(204);
    }
    expect(await f.t.run(ctx => ctx.db.get(attemptId))).toMatchObject({ phase: 'funded' });
    expect((await f.client.query(api.deliveries.mine, funded)).dispute?.status).toBe('refunded');
    expect(await f.t.run(ctx => ctx.db.query('deliveryReleases').collect())).toHaveLength(0);
    await expect(f.otherClient.mutation(api.disputes.retryRefund, { caseId })).rejects.toThrow();
  } finally { vi.unstubAllGlobals(); vi.useRealTimers(); }
});

test('006 reputation counts distinct paid offers across legacy, revisions and all rulings', async () => {
  const f = await fixture();
  await designate(f, f.otherClient);
  const clientId = (await f.client.query(api.profiles.me, {}))!._id;
  const artistId = (await f.artist.query(api.profiles.me, {}))!._id;
  const facts = (id: Id<'profiles'>) => f.otherArtist.query(api.reputation.facts, { subject: { profileId: id } });
  expect(await facts(clientId)).toMatchObject({ paid: 0, delivered: 0, revised: 0 });
  for (const scenario of ['legacy', 'revised', 'open', 'upheld', 'dismissed', 'undelivered', 'unpaid']) {
    const funded = await f.offer(scenario !== 'unpaid');
    if (scenario === 'unpaid' || scenario === 'undelivered') continue;
    await f.artist.mutation(submit, await f.stage(funded));
    if (scenario === 'revised' || scenario === 'legacy') {
      let version = 1;
      if (scenario === 'revised') for (let i = 0; i < 2; i++) {
        await f.client.mutation(revise, { ...funded, version, note });
        await f.artist.mutation(submit, await f.stage(funded, version++));
      }
      await f.client.mutation(approve, { ...funded, version });
      if (scenario === 'legacy') await f.t.run(async ctx => {
        const row = await ctx.db.query('deliveryReleases').withIndex('by_offer', q => q.eq('offerId', funded.offerId)).unique();
        await ctx.db.patch(row!._id, { reason: undefined });
      });
      continue;
    }
    await f.client.mutation(api.disputes.flag, { ...funded, version: 1, reason: 'Revisar.' });
    if (scenario !== 'open') {
      const record = (await f.otherClient.query(api.disputes.queue, {}))!.find(d => d.offerId === funded.offerId)!;
      await f.otherClient.mutation(api.disputes.decide, { caseId: record.id, outcome: scenario === 'upheld' ? 'uphold' : 'dismiss', note });
      if (scenario === 'upheld') {
        const payment = await f.t.run(ctx => ctx.db.query('paymentAttempts').withIndex('by_offer', q => q.eq('offerId', funded.offerId)).unique());
        await f.t.mutation(internal.disputes.observeRefund, { attemptId: payment!._id });
      }
    }
  }
  expect(await facts(clientId)).toEqual({ role: 'client', paid: 6, delivered: 5, revised: 1, flagged: 3, upheld: 1, dismissed: 1 });
  expect(await facts(artistId)).toEqual({ role: 'artist', completed: 3, upheld: 1 });
});

test.each(['flag', 'job'] as const)('006 at the deadline, %s first still yields one release', async first => {
  const f = await fixture();
  const funded = await f.offer();
  await f.artist.mutation(submit, await f.stage(funded));
  const view = await f.client.query(api.deliveries.mine, funded);
  const reviewBy = view.reviewBy!;
  const version = { ...funded, version: 1 };
  vi.useFakeTimers({ now: reviewBy });
  try {
    const flag = () => f.client.mutation(api.disputes.flag, { ...version, reason: 'Avaliar.' });
    const job = () => f.t.mutation(internal.deliveries.expireReview, { ...version, reviewBy });
    if (first === 'flag') { await flag(); await job(); }
    else { await job(); await expect(flag()).rejects.toThrow(); }
    expect(await f.client.query(api.deliveries.mine, funded)).toMatchObject({ phase: 'approved', release: { reason: 'deadline' } });
    expect(await f.t.run(ctx => ctx.db.query('disputes').collect())).toHaveLength(0);
    expect(await f.t.run(ctx => ctx.db.query('deliveryReleases').collect())).toHaveLength(1);
  } finally { vi.useRealTimers(); }
});

test.each(['approve', 'revise'] as const)('006 committing %s before the flag preserves that transition', async action => {
  const f = await fixture();
  const funded = await f.offer();
  await f.artist.mutation(submit, await f.stage(funded));
  const version = { ...funded, version: 1 };
  if (action === 'approve') await f.client.mutation(approve, version);
  else await f.client.mutation(revise, { ...version, note });
  await expect(f.client.mutation(api.disputes.flag, { ...version, reason: 'Avaliar.' })).rejects.toThrow();
  expect((await f.client.query(api.deliveries.mine, funded)).phase).toBe(action === 'approve' ? 'approved' : 'revision');
  expect(await f.t.run(ctx => ctx.db.query('disputes').collect())).toHaveLength(0);
});

test('006 a late-starting interrupted refund is recovered by canonical lookup without another refund', async () => {
  const f = await fixture();
  const funded = await f.offer();
  const providerId = 'pix_char_recovery006';
  const reference = 'mecenas-' + crypto.randomUUID();
  await f.t.run(async ctx => {
    const payment = (await ctx.db.query('paymentAttempts').unique())!;
    await ctx.db.patch(payment._id, { providerId, reference });
  });
  await f.artist.mutation(submit, await f.stage(funded));
  await f.client.mutation(api.disputes.flag, { ...funded, version: 1, reason: 'Avaliar.' });
  await designate(f, f.otherClient);
  const caseId = (await f.otherClient.query(api.disputes.queue, {}))![0].id;
  vi.useFakeTimers({ now: Date.now() + 60000 });
  vi.stubEnv('ABACATEPAY_TEST_MODE', 'true');
  vi.stubEnv('ABACATEPAY_API_KEY', 'abc_dev_recovery');
  const lookup = vi.fn(async (url: URL, options: RequestInit) => {
    expect(url.pathname.endsWith('/list')).toBe(true);
    expect(options.method).toBe('GET');
    return Response.json({ success: true, data: [{ id: providerId, amount: 5000, devMode: true,
      metadata: { mecenasPaymentRef: reference }, status: 'REFUNDED' }] });
  });
  vi.stubGlobal('fetch', lookup);
  try {
    await f.otherClient.mutation(api.disputes.decide, { caseId, outcome: 'uphold', note });
    vi.setSystemTime(Date.now() + 70000);
    // The first run began late and stopped after its claim, before recording the provider outcome.
    expect(await f.t.mutation(internal.disputes.claim, { caseId, run: 1 })).toMatchObject({ providerId });
    await expect(f.otherClient.mutation(api.disputes.retryRefund, { caseId })).rejects.toThrow();
    // Simulate the scheduler recording termination of the lost execution.
    await f.t.run(async ctx => {
      const record = (await ctx.db.get(caseId))!;
      await ctx.scheduler.cancel(record.refundJob!);
    });
    await f.otherClient.mutation(api.disputes.retryRefund, { caseId });
    await vi.advanceTimersByTimeAsync(10);
    await f.t.finishInProgressScheduledFunctions();
    await f.t.mutation(internal.disputes.finish, { caseId, run: 1, confirmed: false });
    expect(lookup).toHaveBeenCalledTimes(1);
    expect((await f.client.query(api.deliveries.mine, funded)).dispute?.status).toBe('refunded');
    expect(await f.t.run(ctx => ctx.db.query('deliveryReleases').collect())).toHaveLength(0);
  } finally { vi.useRealTimers(); vi.unstubAllGlobals(); }
});

test('006 an in-flight provider request cannot overlap a reviewer retry', async () => {
  const f = await fixture();
  const funded = await f.offer();
  const reference = 'mecenas-' + crypto.randomUUID();
  const providerId = 'pix_char_overlap006';
  await f.t.run(async ctx => {
    const payment = (await ctx.db.query('paymentAttempts').unique())!;
    await ctx.db.patch(payment._id, { reference, providerId });
  });
  await f.artist.mutation(submit, await f.stage(funded));
  await f.client.mutation(api.disputes.flag, { ...funded, version: 1, reason: 'Avaliar.' });
  await designate(f, f.otherClient);
  const caseId = (await f.otherClient.query(api.disputes.queue, {}))![0].id;
  let signalPost!: () => void;
  const posted = new Promise<void>(resolve => { signalPost = resolve; });
  let allowReply!: () => void;
  const reply = new Promise<void>(resolve => { allowReply = resolve; });
  let posts = 0;
  let refunded = false;
  vi.stubEnv('ABACATEPAY_API_KEY', 'abc_dev_fixture');
  vi.stubEnv('ABACATEPAY_TEST_MODE', 'true');
  vi.stubGlobal('fetch', async (url: URL) => {
    if (url.pathname.endsWith('/refund')) {
      posts++; signalPost(); await reply; refunded = true;
      return Response.json({ success: true });
    }
    return Response.json({ success: true, data: [{ id: providerId, amount: 5000, devMode: true,
      metadata: { mecenasPaymentRef: reference }, status: refunded ? 'REFUNDED' : 'PAID' }] });
  });
  vi.useFakeTimers({ toFake: ['Date'], now: Date.now() + 60000 });
  try {
    await f.otherClient.mutation(api.disputes.decide, { caseId, outcome: 'uphold', note });
    await posted;
    vi.setSystemTime(Date.now() + 120000);
    await expect(f.otherClient.mutation(api.disputes.retryRefund, { caseId })).rejects.toThrow('andamento');
    allowReply();
    await f.t.finishInProgressScheduledFunctions();
    expect(posts).toBe(1);
    expect((await f.client.query(api.deliveries.mine, funded)).dispute?.status).toBe('refunded');
  } finally { allowReply(); vi.useRealTimers(); vi.unstubAllGlobals(); }
});
