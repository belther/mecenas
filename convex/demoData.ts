// Iteration 007 synthetic demo seed: database part. Internal functions only, so only a
// deployment administrator can run them (see convex/demoSeed.ts and scripts/demo-seed.mjs).
import { v } from 'convex/values';
import { components, internal } from './_generated/api';
import type { Id } from './_generated/dataModel';
import { internalMutation, type MutationCtx } from './_generated/server';
import { createDemoAccount } from './auth';
import { fail } from './lib/access';
import { OFFER_WINDOW, REVIEW_WINDOW } from './lib/windows';
import { DELIVERY_LICENCE } from '../lib/delivery-licence';
import { DEMO_ACCOUNTS, DEMO_COMMISSIONS, DEMO_DELIVERY_VERSIONS, type DemoAccountKey, type DemoCommissionKey } from '../lib/demo-fixture';

const accountKeys = Object.keys(DEMO_ACCOUNTS) as DemoAccountKey[];
const commissionKeys = Object.keys(DEMO_COMMISSIONS) as DemoCommissionKey[];

async function deleteStorage(ctx: MutationCtx, ids: (Id<'_storage'> | undefined)[]) {
  for (const id of ids) if (id && await ctx.db.system.get(id)) await ctx.storage.delete(id);
}

async function removeUploads(ctx: MutationCtx, ids: Id<'uploads'>[]) {
  for (const id of ids) {
    const upload = await ctx.db.get(id);
    if (!upload) continue;
    await deleteStorage(ctx, [upload.storageId]);
    await ctx.db.delete(id);
  }
}

/**
 * Removes every request the seed created, with all rows and files that hang from it. A seeded
 * request that now holds real data (a non-demo payment, such as a real sandbox Pix, or an
 * application from a non-demo artist) is kept and detached from the seed instead of deleted.
 */
async function removeSeededRequests(ctx: MutationCtx, demoProfiles: Set<Id<'profiles'>>) {
  const requests = await ctx.db.query('requests').filter(q => q.eq(q.field('demo'), true)).collect();
  let removed = 0, detached = 0;
  for (const request of requests) {
    const offers = await ctx.db.query('offers').withIndex('by_request_status', q => q.eq('requestId', request._id)).collect();
    const applications = await ctx.db.query('applications').withIndex('by_request_artist', q => q.eq('requestId', request._id)).collect();
    let real = applications.some(row => !demoProfiles.has(row.artistId));
    for (const offer of offers) {
      const attempts = await ctx.db.query('paymentAttempts').withIndex('by_offer', q => q.eq('offerId', offer._id)).collect();
      if (attempts.some(attempt => attempt.demo !== true)) real = true;
    }
    if (real) { await ctx.db.patch(request._id, { demo: undefined }); detached++; continue; }
    removed++;
    for (const offer of offers) {
      for (const attempt of await ctx.db.query('paymentAttempts').withIndex('by_offer', q => q.eq('offerId', offer._id)).collect()) {
        for (const event of await ctx.db.query('paymentEvents').filter(q => q.eq(q.field('attemptId'), attempt._id)).collect()) {
          await ctx.db.delete(event._id);
        }
        await ctx.db.delete(attempt._id);
      }
      for (const upload of await ctx.db.query('deliveryUploads').filter(q => q.eq(q.field('offerId'), offer._id)).collect()) {
        await deleteStorage(ctx, [upload.storageId, upload.previewStorageId]);
        await ctx.db.delete(upload._id);
      }
      for (const table of ['deliveries', 'deliveryReleases', 'disputes'] as const) {
        for (const row of await ctx.db.query(table).withIndex('by_offer', q => q.eq('offerId', offer._id)).collect()) await ctx.db.delete(row._id);
      }
      for (const row of await ctx.db.query('deliveryVersions').withIndex('by_offer_version', q => q.eq('offerId', offer._id)).collect()) {
        await ctx.db.delete(row._id);
      }
      await ctx.db.delete(offer._id);
    }
    for (const row of applications) await ctx.db.delete(row._id);
    for (const row of await ctx.db.query('selections').withIndex('by_request', q => q.eq('requestId', request._id)).collect()) {
      await ctx.db.delete(row._id);
    }
    await removeUploads(ctx, request.exampleUploadIds);
    await ctx.db.delete(request._id);
  }
  return { removed, detached };
}

/** Creates or reuses the demo accounts and their profiles. Old demo data is reset later, in `populate`. */
export const prepare = internalMutation({
  args: { password: v.string() },
  handler: async (ctx, { password }) => {
    if (password.length < 12) fail('A senha de demonstração precisa ter pelo menos 12 caracteres.');
    const profiles = {} as Record<DemoAccountKey, Id<'profiles'>>;
    const users = {} as Record<DemoAccountKey, Id<'users'>>;
    let created = 0;
    for (const key of accountKeys) {
      const account = DEMO_ACCOUNTS[key];
      let userId = await ctx.runQuery(components.authUsername.public.getUserIdByUsername, { username: account.username }) as Id<'users'> | null;
      if (!userId) { userId = await createDemoAccount(ctx, account.username, password) as Id<'users'>; created++; }
      else {
        const check = await ctx.runMutation(components.authPassword.public.verifyPassword, { userId, password });
        // 009: Convex Auth allows 5 password checks per account, then 1 per minute; say so instead of blaming the password.
        if (check.success !== true && check.userError?.error === 'RATE_LIMITED') fail(`Muitas entradas recentes na conta ${account.username}. Aguarde alguns minutos e rode o seed de novo (com a senha original da conta).`);
        if (check.success !== true) fail(`A senha de demonstração não confere com a conta ${account.username}. Use a senha original (.env.demo, ou .env.demo.production em produção) ou uma implantação nova.`);
      }
      const fields = { role: account.role, displayName: account.displayName, bio: account.bio, portfolioStorageIds: [], portfolioUploadIds: [] };
      const existing = await ctx.db.query('profiles').withIndex('by_user', q => q.eq('userId', userId)).unique();
      if (existing) {
        if (existing.role !== account.role) fail(`O perfil de ${account.username} tem outro papel. Use uma implantação nova.`);
        profiles[key] = existing._id;
      } else {
        profiles[key] = await ctx.db.insert('profiles', { userId, ...fields });
      }
      users[key] = userId;
    }
    return { profiles, users, created };
  },
});

const stored = v.object({ storageId: v.id('_storage'), size: v.number() });
const deliveryFiles = v.object({ original: v.id('_storage'), preview: v.id('_storage'), process: v.array(v.id('_storage')) });

/** Writes the six commissions. Storage files are created beforehand by the seed action. */
export const populate = internalMutation({
  args: {
    profiles: v.record(v.string(), v.id('profiles')),
    users: v.record(v.string(), v.id('users')),
    portfolio: v.record(v.string(), v.array(stored)),
    references: v.record(v.string(), stored),
    deliveries: v.record(v.string(), v.array(deliveryFiles)),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    const profile = (key: DemoAccountKey) => args.profiles[key];
    // Reset inside this mutation, after the new files exist, so a failed or concurrent run cannot
    // leave half-deleted or duplicated demo data.
    const { removed, detached } = await removeSeededRequests(ctx, new Set(Object.values(args.profiles)));
    for (const key of accountKeys) {
      const current = await ctx.db.get(profile(key));
      if (!current) fail('Perfil de demonstração indisponível.');
      await removeUploads(ctx, current.portfolioUploadIds);
      const { displayName, bio } = DEMO_ACCOUNTS[key];
      await ctx.db.patch(current._id, { displayName, bio, portfolioUploadIds: [], portfolioStorageIds: [] });
    }
    for (const [key, files] of Object.entries(args.portfolio)) {
      const account = key as DemoAccountKey;
      const ids = [];
      for (const file of files) {
        ids.push(await ctx.db.insert('uploads', { userId: args.users[account], storageId: file.storageId, purpose: 'portfolio', contentType: 'image/webp', size: file.size }));
      }
      await ctx.db.patch(profile(account), { portfolioUploadIds: ids, portfolioStorageIds: files.map(file => file.storageId) });
    }

    const summary: Record<string, string> = {};
    for (const key of commissionKeys) {
      const spec = DEMO_COMMISSIONS[key];
      const reference = args.references[key];
      const exampleUploadId = await ctx.db.insert('uploads', { userId: args.users.cliente, storageId: reference.storageId, purpose: 'reference', contentType: 'image/webp', size: reference.size });
      const offered = spec.state !== 'open';
      const requestId = await ctx.db.insert('requests', {
        clientId: profile('cliente'), title: spec.title, description: spec.description, artType: 'illustration',
        pricePerArtistCents: spec.priceCents, artistSlots: 1, exampleStorageIds: [reference.storageId], exampleUploadIds: [exampleUploadId],
        status: offered && spec.state !== 'pendingOffer' ? 'closed' : 'open', demo: true,
      });
      const applications = [];
      for (const artist of spec.applicants) applications.push(await ctx.db.insert('applications', { requestId, artistId: profile(artist) }));
      summary[key] = `${spec.title}: ${spec.state}`;
      if (!offered) continue;

      const pending = spec.state === 'pendingOffer';
      const respondBy = pending ? now + OFFER_WINDOW : now - OFFER_WINDOW / 2;
      await ctx.db.insert('selections', { requestId, revision: pending ? 1 : 2, queue: applications.slice(1) });
      const offerId = await ctx.db.insert('offers', {
        applicationId: applications[0], requestId, slot: 1, pricePerArtistCents: spec.priceCents,
        status: pending ? 'pending' : 'accepted', respondBy,
      });
      if (pending) { await ctx.scheduler.runAt(respondBy, internal.applications.expire, { offerId, respondBy }); continue; }
      if (spec.state === 'awaitingPayment') continue;

      // Demo payment: no provider charge exists. The app labels it and never calls the provider for it.
      const paymentAttemptId = await ctx.db.insert('paymentAttempts', {
        offerId, reference: `demo-seed-${key}`, amountCents: spec.priceCents, phase: 'funded', demo: true,
      });
      const versions = args.deliveries[key] ?? [];
      if (versions.length !== DEMO_DELIVERY_VERSIONS[key]) fail(`Arquivos de entrega ausentes para a encomenda ${key}.`);
      const artistId = profile(spec.applicants[0]);
      for (const [index, files] of versions.entries()) {
        const upload = (kind: 'original' | 'process', storageId: Id<'_storage'>, previewStorageId?: Id<'_storage'>) =>
          ctx.db.insert('deliveryUploads', { offerId, artistId, expectedVersion: index, kind, storageId, previewStorageId,
            contentType: kind === 'original' ? 'image/png' : 'image/webp', used: true });
        const originalId = await upload('original', files.original, files.preview);
        const processIds = [];
        for (const id of files.process) processIds.push(await upload('process', id));
        await ctx.db.insert('deliveryVersions', { offerId, version: index + 1, originalId, processIds });
      }
      const version = versions.length;
      const revisions = spec.revisionNote ? [{ version: 1, note: spec.revisionNote }] : [];
      if (spec.state === 'review') {
        const reviewBy = now + REVIEW_WINDOW;
        await ctx.db.insert('deliveries', { offerId, version, phase: 'review', reviewBy, licence: DELIVERY_LICENCE, revisions });
        await ctx.scheduler.runAt(reviewBy, internal.deliveries.expireReview, { offerId, version, reviewBy });
      } else if (spec.state === 'approved') {
        await ctx.db.insert('deliveries', { offerId, version, phase: 'approved', licence: DELIVERY_LICENCE, revisions });
        await ctx.db.insert('deliveryReleases', { offerId, version, paymentAttemptId, amountCents: spec.priceCents,
          currency: 'BRL', licence: DELIVERY_LICENCE, reason: 'manual' });
      } else {
        await ctx.db.insert('deliveries', { offerId, version, phase: 'disputed', licence: DELIVERY_LICENCE, revisions });
        await ctx.db.insert('disputes', { offerId, paymentAttemptId, version, artistId, clientId: profile('cliente'),
          reason: spec.disputeReason ?? 'Contestação de demonstração.', status: 'open' });
      }
    }
    return { summary, removed, detached };
  },
});
