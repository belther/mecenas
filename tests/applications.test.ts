import { describe, expect, test, vi } from 'vitest';
import { convexTest } from 'convex-test';
import { registerCore, sessionIdentity } from '@convex-dev/auth/test';
import { registerPassword } from '@convex-dev/auth/components/password/test';
import { registerUsername } from '@convex-dev/auth/components/username/test';
import type { DefaultFunctionArgs, RegisteredMutation } from 'convex/server';
import schema from '../convex/schema';
import { api } from '../convex/_generated/api';
import type { Id } from '../convex/_generated/dataModel';
import type { MutationCtx } from '../convex/_generated/server';
import { respond as respondMutation, select as selectMutation } from '../convex/applications';

const modules = import.meta.glob('../convex/**/*.ts');
const applications = api.applications;
vi.stubEnv('CONVEX_CLOUD_URL', 'https://synthetic-test.convex.cloud');

// The test adapter uses the same runtime handler seam as the auth adapter.
// This injects write failures without adding a fault flag to public mutations.
function handler<Args extends DefaultFunctionArgs, Result>(mutation: RegisteredMutation<'public', Args, Result>) {
  return (mutation as unknown as { _handler: (ctx: MutationCtx, args: Args) => Result })._handler;
}

async function fixture(artistSlots = 2) {
  const db = convexTest(schema, modules);
  registerCore(db);
  registerPassword(db);
  registerUsername(db);

  async function actor(username: string, role?: 'artist' | 'client') {
    vi.stubEnv('MECENAS_DEMO_USERNAMES', username);
    const result = await db.mutation(api.auth.signUpWithUsernamePassword, {
      username, password: crypto.randomUUID() + 'aA9!',
    });
    if (result.status !== 'complete') throw Error('Synthetic sign-up failed');
    const caller = db.withIdentity(sessionIdentity(result.tokens));
    if (role) await caller.mutation(api.profiles.save, { displayName: username, role, bio: '', portfolioUploadIds: [] });
    return caller;
  }

  const owner = await actor('cliente-sol', 'client');
  const other = await actor('cliente-rio', 'client');
  const artistA = await actor('artista-ana', 'artist');
  const artistB = await actor('artista-bia', 'artist');
  const artistC = await actor('artista-caio', 'artist');
  const artistD = await actor('artista-duda', 'artist');
  const artistE = await actor('artista-elias', 'artist');
  const request = {
    artistSlots, pricePerArtistCents: 5000, exampleUploadIds: [],
    title: 'Jardim sintético', description: 'Uma ilustração sintética de um jardim com flores.',
  };
  const requestId = await owner.mutation(api.requests.saveDraft, request);
  await owner.mutation(api.requests.publish, { id: requestId });

  async function apply(artist: typeof artistA, id = requestId) {
    return artist.mutation(applications.apply, { requestId: id });
  }
  async function select(selectedApplicationIds: Id<'applications'>[], backupApplicationIds: Id<'applications'>[] = [], expectedRevision = 0) {
    return owner.mutation(applications.select, { requestId, selectedApplicationIds, backupApplicationIds, expectedRevision });
  }
  const review = () => owner.query(applications.forRequest, { requestId });
  const mine = (artist: typeof artistA) => artist.query(applications.mine, {});
  async function offer(artist: typeof artistA) {
    const result = (await mine(artist)).find(application => application.requestId === requestId)?.offer;
    if (!result) throw Error('Offer was not created');
    return result;
  }
  async function respond(artist: typeof artistA, offerId: Id<'offers'>, response: 'accept' | 'decline') {
    return artist.mutation(applications.respond, { offerId, response });
  }
  return { db, actor, owner, other, artistA, artistB, artistC, artistD, artistE,
    requestId, request, apply, select, review, mine, offer, respond };
}

describe('iteration 002 application and offer contract', () => {
  test('T01–T04, T20 enforces roles and privacy, applies once to an existing request', async () => {
    const f = await fixture();
    const incomplete = await f.actor('sem-perfil');
    const draft = await f.owner.mutation(api.requests.saveDraft, f.request);
    for (const caller of [f.db, f.other, incomplete]) {
      await expect(f.apply(caller)).rejects.toThrow();
      await expect(caller.query(applications.forRequest, { requestId: f.requestId })).rejects.toThrow();
    }
    await expect(f.apply(f.artistA, draft)).rejects.toThrow();
    await expect(f.owner.query(applications.forRequest, { requestId: draft })).rejects.toThrow();
    await expect(f.artistA.query(applications.forRequest, { requestId: f.requestId })).rejects.toThrow();
    const [a, retry] = await Promise.all([f.apply(f.artistA), f.apply(f.artistA)]);
    expect(retry).toBe(a);
    expect(await f.apply(f.artistA)).toBe(a);
    expect(await f.mine(f.artistA)).toEqual([
      { id: a, requestId: f.requestId, title: f.request.title, pricePerArtistCents: 5000, offer: null },
    ]);
    expect(await f.mine(f.artistB)).toEqual([]);
    expect((await f.review()).applicants).toEqual([{ id: a, displayName: 'artista-ana', bio: '', images: [], offer: null }]);

    const write = { requestId: f.requestId, expectedRevision: 0, selectedApplicationIds: [a], backupApplicationIds: [] };
    for (const caller of [f.db, f.other, f.artistA, incomplete]) {
      await expect(caller.mutation(applications.select, write)).rejects.toThrow();
    }
    await f.select([a]);
    const offer = await f.offer(f.artistA);
    for (const caller of [f.db, f.owner, f.artistB, incomplete]) {
      await expect(f.respond(caller, offer.id, 'accept')).rejects.toThrow();
    }
    expect(await f.offer(f.artistA)).toEqual(offer);
  });

  test('T05–T08, T14 bounds selections and queue atomically at the stored price', async () => {
    const f = await fixture(3);
    const a = await f.apply(f.artistA);
    const b = await f.apply(f.artistB);
    const c = await f.apply(f.artistC);
    const d = await f.apply(f.artistD);
    const foreignRequest = await f.other.mutation(api.requests.saveDraft, f.request);
    await f.other.mutation(api.requests.publish, { id: foreignRequest });
    const foreign = await f.apply(f.artistE, foreignRequest);

    await expect(f.select([a, b, c, d])).rejects.toThrow();
    await expect(f.select([a, a])).rejects.toThrow();
    await expect(f.select([a, b, c], [c])).rejects.toThrow();
    await expect(f.select([a, foreign])).rejects.toThrow();
    await expect(f.select([a], [b])).rejects.toThrow();
    expect(await f.review()).toMatchObject({ revision: 0, reserved: 0, queue: [] });
    expect((await f.review()).applicants.every(row => row.offer === null)).toBe(true);

    await f.select([a]);
    expect(await f.offer(f.artistA)).toMatchObject({ slot: 1, status: 'pending', pricePerArtistCents: 5000 });
    await expect(f.select([b], [], 0)).rejects.toThrow(/seleção mudou/);
    await expect(f.select([a], [], 1)).rejects.toThrow();
    await expect(f.select([b, c], [a], 1)).rejects.toThrow();
    const e = await f.apply(f.artistE);
    await f.select([b, c], [d, e], 1);
    expect(await f.review()).toMatchObject({ revision: 2, reserved: 3, queue: [d, e] });
    expect(await f.offer(f.artistB)).toMatchObject({ slot: 2, pricePerArtistCents: 5000 });
    await f.select([], [e, d], 2);
    expect(await f.review()).toMatchObject({ revision: 3, queue: [e, d] });
  });

  test('T09–T12 promotes a saved order into distinct released slots and retries neither response', async () => {
    const f = await fixture();
    const [a, b, c, d] = await Promise.all([f.apply(f.artistA), f.apply(f.artistB), f.apply(f.artistC), f.apply(f.artistD)]);
    await f.select([a, b], [c, d]);
    await f.select([], [d, c], 1);
    const first = await f.offer(f.artistA);
    const second = await f.offer(f.artistB);
    // convex-test serializes top-level transactions. This verifies shared
    // state invariants after concurrent submissions, without simulating OCC.
    const answers = await Promise.all([
      f.respond(f.artistA, first.id, 'decline'),
      f.respond(f.artistB, second.id, 'decline'),
    ]);
    expect(answers).toEqual([{ status: 'declined' }, { status: 'declined' }]);
    const view = await f.review();
    expect(view).toMatchObject({ revision: 4, reserved: 2, queue: [] });
    const nextC = await f.offer(f.artistC);
    const nextD = await f.offer(f.artistD);
    expect(new Set([nextC.slot, nextD.slot])).toEqual(new Set([first.slot, second.slot]));
    expect(nextD).toMatchObject({ status: 'pending', pricePerArtistCents: 5000 });
    expect(nextC).toMatchObject({ status: 'pending', pricePerArtistCents: 5000 });
    expect(await f.respond(f.artistA, first.id, 'decline')).toEqual({ status: 'declined' });
    expect(await f.respond(f.artistA, first.id, 'accept')).toEqual({ status: 'declined' });
    expect(await f.review()).toEqual(view);

    await f.respond(f.artistD, nextD.id, 'decline');
    expect(await f.review()).toMatchObject({ reserved: 1, revision: 5, queue: [] });
    const e = await f.apply(f.artistE);
    await f.select([e], [], 5);
    expect(await f.offer(f.artistE)).toMatchObject({ status: 'pending', slot: nextD.slot });
  });

  test('T09 follows saved rank for the same slot even with a different application order', async () => {
    const f = await fixture(1);
    const a = await f.apply(f.artistA);
    const b = await f.apply(f.artistB);
    const c = await f.apply(f.artistC);
    await f.select([a], [b, c]);
    await f.select([], [c, b], 1);
    const first = await f.offer(f.artistA);
    await f.respond(f.artistA, first.id, 'decline');
    expect(await f.offer(f.artistC)).toMatchObject({ slot: first.slot, status: 'pending' });
    expect((await f.mine(f.artistB))[0].offer).toBeNull();
    expect(await f.review()).toMatchObject({ queue: [b], reserved: 1, revision: 3 });
  });

  test('T11–T13, T17 accepts one final answer and closes applications only at full acceptance', async () => {
    const f = await fixture(1);
    const a = await f.apply(f.artistA);
    const b = await f.apply(f.artistB);
    await f.select([a], [b]);
    const first = await f.offer(f.artistA);
    const answers = await Promise.all([
      f.respond(f.artistA, first.id, 'accept'), f.respond(f.artistA, first.id, 'decline'),
    ]);
    expect(answers[0]).toEqual(answers[1]);
    expect((await f.review()).revision).toBe(2);
    const winning = (await f.offer(f.artistA)).status;
    let accepted = first;
    let recipient = f.artistA;
    if (winning === 'declined') {
      accepted = await f.offer(f.artistB);
      recipient = f.artistB;
      await f.respond(recipient, accepted.id, 'accept');
    }
    expect(await f.respond(recipient, accepted.id, 'accept')).toEqual({ status: 'accepted' });
    expect(await f.respond(recipient, accepted.id, 'decline')).toEqual({ status: 'accepted' });
    expect(await f.offer(recipient)).toEqual({ ...accepted, status: 'accepted' });
    expect(await f.apply(f.artistA)).toBe(a);
    await expect(f.apply(f.artistE)).rejects.toThrow(/encerradas/);
    expect(await f.artistE.query(api.requests.browse, {})).toEqual([]);
    expect(await f.owner.query(api.requests.get, { id: f.requestId })).toMatchObject({ status: 'closed' });
  });

  test('T15 serializes an owner reorder against a decline without losing a promotion', async () => {
    const f = await fixture(1);
    const a = await f.apply(f.artistA);
    const b = await f.apply(f.artistB);
    const c = await f.apply(f.artistC);
    await f.select([a], [b, c]);
    const first = await f.offer(f.artistA);
    const [save, response] = await Promise.allSettled([
      f.select([], [c, b], 1), f.respond(f.artistA, first.id, 'decline'),
    ]);
    expect(response).toEqual({ status: 'fulfilled', value: { status: 'declined' } });
    const reordered = save.status === 'fulfilled';
    if (save.status === 'rejected') expect(String(save.reason)).toMatch(/seleção mudou/);
    expect(await f.review()).toMatchObject({ revision: reordered ? 3 : 2, queue: [reordered ? b : c], reserved: 1 });
    const promoted = await f.offer(reordered ? f.artistC : f.artistB);
    expect(promoted).toMatchObject({ slot: first.slot, status: 'pending', pricePerArtistCents: 5000 });
  });

  test('T16 abort after nested promotion rolls back both updates and queue consumption', async () => {
    const f = await fixture(1);
    const a = await f.apply(f.artistA);
    const b = await f.apply(f.artistB);
    await f.select([a], [b]);
    const first = await f.offer(f.artistA);
    const before = await f.review();
    await expect(f.artistA.run(async ctx => {
      expect(await ctx.runMutation(applications.respond, { offerId: first.id, response: 'decline' }))
        .toEqual({ status: 'declined' });
      throw Error('Synthetic outer rollback');
    })).rejects.toThrow('Synthetic outer rollback');
    expect(await f.review()).toEqual(before);
    expect(await f.offer(f.artistA)).toEqual(first);
    expect((await f.mine(f.artistB))[0].offer).toBeNull();
  });

  test('T05 reserves at most ten slots across pending and accepted offers', async () => {
    const f = await fixture(10);
    const artists = [f.artistA, f.artistB, f.artistC, f.artistD, f.artistE];
    for (const name of ['fabi', 'gabi', 'hugo', 'ivo', 'jose', 'lara']) {
      artists.push(await f.actor(`artista-${name}`, 'artist'));
    }
    const ids = await Promise.all(artists.map(artist => f.apply(artist)));
    await f.select(ids.slice(0, 9));
    const first = await f.offer(f.artistA);
    await f.respond(f.artistA, first.id, 'accept');
    const before = await f.review();
    expect(before.reserved).toBe(9);
    await expect(f.select(ids.slice(9), [], before.revision)).rejects.toThrow(/vagas/);
    expect(await f.review()).toEqual(before);
    await f.select(ids.slice(9, 10), ids.slice(10), before.revision);
    const after = await f.review();
    expect(after.reserved).toBe(10);
    expect(new Set(after.applicants.flatMap(({ offer }) => offer ? [offer.slot] : [])).size).toBe(10);
  });

  test.each(['accept', 'decline'] as const)('T13–T15 preserves either commit order for owner save and %s', async decision => {
    for (const saveFirst of [false, true]) {
      const f = await fixture(1);
      const [a, b, c] = await Promise.all([f.apply(f.artistA), f.apply(f.artistB), f.apply(f.artistC)]);
      await f.select([a], [b, c]);
      const first = await f.offer(f.artistA);
      if (saveFirst) await f.select([], [c, b], 1);
      const result = await f.respond(f.artistA, first.id, decision);
      if (!saveFirst) await expect(f.select([], [c, b], 1)).rejects.toThrow(/seleção mudou/);
      const opposite = decision === 'accept' ? 'decline' : 'accept';
      expect(await f.respond(f.artistA, first.id, opposite)).toEqual(result);
      const view = await f.review();
      expect(view).toMatchObject({ revision: saveFirst ? 3 : 2, reserved: 1 });
      if (decision === 'decline') {
        expect(view.queue).toEqual([saveFirst ? b : c]);
        expect(await f.offer(saveFirst ? f.artistC : f.artistB)).toMatchObject({ slot: first.slot, status: 'pending' });
      } else {
        expect(view.queue).toEqual(saveFirst ? [c, b] : [b, c]);
      }
    }
  });

  test('T16 failure after a decline write rolls it back before promotion and permits one retry', async () => {
    const f = await fixture(1);
    const a = await f.apply(f.artistA);
    const b = await f.apply(f.artistB);
    await f.select([a], [b]);
    const first = await f.offer(f.artistA);
    const before = await f.review();
    const offersBefore = await f.db.run(ctx => ctx.db.query('offers').collect());
    await expect(f.artistA.run(async ctx => {
      const insert: MutationCtx['db']['insert'] = async (table, value) => {
        if (table === 'offers') {
          expect((await ctx.db.get(first.id))?.status).toBe('declined');
          throw Error('Synthetic promotion write failure');
        }
        return ctx.db.insert(table, value);
      };
      await handler(respondMutation)({ ...ctx, db: { ...ctx.db, insert } }, { offerId: first.id, response: 'decline' });
    })).rejects.toThrow('Synthetic promotion write failure');
    expect(await f.review()).toEqual(before);
    expect(await f.db.run(ctx => ctx.db.query('offers').collect())).toEqual(offersBefore);
    await f.respond(f.artistA, first.id, 'decline');
    expect(await f.offer(f.artistB)).toMatchObject({ slot: first.slot, status: 'pending' });
    expect(await f.review()).toMatchObject({ revision: 2, queue: [], reserved: 1 });
  });

  test('T16 failure after the first selection insert rolls it back and permits one retry', async () => {
    const f = await fixture();
    const [a, b, c] = await Promise.all([f.apply(f.artistA), f.apply(f.artistB), f.apply(f.artistC)]);
    const before = await f.review();
    await expect(f.owner.run(async ctx => {
      let writes = 0;
      const insert: MutationCtx['db']['insert'] = async (table, value) => {
        if (table === 'offers' && ++writes === 2) {
          expect(await ctx.db.query('offers').collect()).toHaveLength(1);
          throw Error('Synthetic second selection write failure');
        }
        return ctx.db.insert(table, value);
      };
      await handler(selectMutation)({ ...ctx, db: { ...ctx.db, insert } }, {
        requestId: f.requestId, expectedRevision: 0, selectedApplicationIds: [a, b], backupApplicationIds: [c],
      });
    })).rejects.toThrow('Synthetic second selection write failure');
    expect(await f.review()).toEqual(before);
    expect(await f.db.run(ctx => ctx.db.query('offers').collect())).toEqual([]);
    await f.select([a, b], [c]);
    expect(await f.review()).toMatchObject({ revision: 1, queue: [c], reserved: 2 });
  });
});
