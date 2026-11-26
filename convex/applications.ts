import { v } from 'convex/values';
import { internal } from './_generated/api';
import { OFFER_WINDOW } from './lib/windows';
import { internalMutation, mutation, query, type QueryCtx, type MutationCtx } from './_generated/server';
import type { Doc, Id } from './_generated/dataModel';
import { fail, requireProfile } from './lib/access';

function selection(ctx: QueryCtx, requestId: Id<'requests'>) {
  return ctx.db.query('selections').withIndex('by_request', index =>
    index.eq('requestId', requestId)).unique();
}

function offerFor(ctx: QueryCtx, applicationId: Id<'applications'>) {
  return ctx.db.query('offers').withIndex('by_application', index =>
    index.eq('applicationId', applicationId)).unique();
}

function offersWithStatus(ctx: QueryCtx, requestId: Id<'requests'>, status: 'pending' | 'accepted') {
  return ctx.db.query('offers').withIndex('by_request_status', index =>
    index.eq('requestId', requestId).eq('status', status)).collect();
}

function offerSummary(offer: Doc<'offers'>) {
  return { id: offer._id, slot: offer.slot, status: offer.status, respondBy: offer.respondBy, pricePerArtistCents: offer.pricePerArtistCents };
}

async function createOffer(ctx: MutationCtx, request: Doc<'requests'>, applicationId: Id<'applications'>, slot: number, pricePerArtistCents = request.pricePerArtistCents): Promise<void> {
  const respondBy = Date.now() + OFFER_WINDOW;
  const offerId = await ctx.db.insert('offers', {
    applicationId, requestId: request._id, slot,
    pricePerArtistCents, status: 'pending', respondBy,
  });
  await ctx.scheduler.runAt(respondBy, internal.applications.expire, { offerId, respondBy });
}

export const apply = mutation({
  args: { requestId: v.id('requests') },
  handler: async (ctx, { requestId }) => {
    const artist = await requireProfile(ctx, 'artist');
    const request = await ctx.db.get(requestId);
    if (!request || request.status === 'draft') fail('Encomenda indisponível.');

    const existing = await ctx.db.query('applications').withIndex('by_request_artist', index =>
      index.eq('requestId', requestId).eq('artistId', artist._id)).unique();
    if (existing) return existing._id;
    if (request.status !== 'open') fail('As candidaturas desta encomenda foram encerradas.');
    return ctx.db.insert('applications', { requestId, artistId: artist._id });
  },
});

export const mine = query({
  args: {},
  handler: async ctx => {
    const artist = await requireProfile(ctx, 'artist');
    const applications = await ctx.db.query('applications').withIndex('by_artist', index =>
      index.eq('artistId', artist._id)).order('desc').collect();
    return Promise.all(applications.map(async application => {
      const [request, offer] = await Promise.all([
        ctx.db.get(application.requestId), offerFor(ctx, application._id),
      ]);
      if (!request || request.status === 'draft') fail('Encomenda indisponível.');
      return {
        id: application._id,
        requestId: request._id,
        title: request.title,
        pricePerArtistCents: request.pricePerArtistCents,
        offer: offer ? offerSummary(offer) : null,
      };
    }));
  },
});

export const forRequest = query({
  args: { requestId: v.id('requests') },
  handler: async (ctx, { requestId }) => {
    const client = await requireProfile(ctx, 'client');
    const request = await ctx.db.get(requestId);
    if (!request || request.clientId !== client._id || request.status === 'draft') fail('Encomenda indisponível.');

    const [state, applications] = await Promise.all([
      selection(ctx, requestId),
      ctx.db.query('applications').withIndex('by_request_artist', index =>
        index.eq('requestId', requestId)).collect(),
    ]);
    const applicants = await Promise.all(applications.map(async application => {
      const [profile, offer] = await Promise.all([
        ctx.db.get(application.artistId), offerFor(ctx, application._id),
      ]);
      if (!profile) fail('Perfil de artista indisponível.');
      const images = await Promise.all(profile.portfolioStorageIds.map(id => ctx.storage.getUrl(id)));
      return {
        id: application._id,
        displayName: profile.displayName,
        bio: profile.bio,
        images,
        offer: offer ? offerSummary(offer) : null,
      };
    }));
    return {
      revision: state?.revision ?? 0,
      queue: state?.queue ?? [],
      reserved: applicants.filter(({ offer }) => offer?.status === 'pending' || offer?.status === 'accepted').length,
      applicants,
    };
  },
});

export const select = mutation({
  args: {
    requestId: v.id('requests'),
    expectedRevision: v.number(),
    selectedApplicationIds: v.array(v.id('applications')),
    backupApplicationIds: v.array(v.id('applications')),
  },
  handler: async (ctx, { requestId, expectedRevision, selectedApplicationIds, backupApplicationIds }) => {
    const client = await requireProfile(ctx, 'client');
    const request = await ctx.db.get(requestId);
    if (!request || request.clientId !== client._id || request.status === 'draft') fail('Encomenda indisponível.');

    const state = await selection(ctx, requestId);
    const revision = state?.revision ?? 0;
    if (expectedRevision !== revision) fail('A seleção mudou. Revise as vagas e a fila antes de salvar.');
    if (request.status !== 'open') fail('Todas as vagas desta encomenda já foram aceitas.');

    const [pending, accepted] = await Promise.all([
      offersWithStatus(ctx, requestId, 'pending'), offersWithStatus(ctx, requestId, 'accepted'),
    ]);
    const occupied = new Set([...pending, ...accepted].map(offer => offer.slot));
    const vacant = Array.from({ length: request.artistSlots }, (_, index) => index + 1)
      .filter(slot => !occupied.has(slot));
    if (selectedApplicationIds.length > vacant.length) fail('A seleção excede as vagas disponíveis.');
    if (backupApplicationIds.length && selectedApplicationIds.length !== vacant.length) {
      fail('Preencha todas as vagas antes de salvar a fila de reserva.');
    }

    const candidates = [...selectedApplicationIds, ...backupApplicationIds];
    if (new Set(candidates).size !== candidates.length) fail('Escolha cada candidatura uma única vez.');
    for (const id of candidates) {
      const application = await ctx.db.get(id);
      if (!application || application.requestId !== requestId || await offerFor(ctx, id)) {
        fail('Uma das candidaturas selecionadas está indisponível.');
      }
    }

    for (const [index, id] of selectedApplicationIds.entries()) {
      await createOffer(ctx, request, id, vacant[index]);
    }
    const fields = { revision: revision + 1, queue: backupApplicationIds };
    if (state) await ctx.db.patch(state._id, fields);
    else await ctx.db.insert('selections', { requestId, ...fields });
    return fields.revision;
  },
});

export const respond = mutation({
  args: { offerId: v.id('offers'), response: v.union(v.literal('accept'), v.literal('decline')) },
  handler: async (ctx, { offerId, response }) => {
    const artist = await requireProfile(ctx, 'artist');
    const offer = await ctx.db.get(offerId);
    const application = offer && await ctx.db.get(offer.applicationId);
    if (!offer || application?.artistId !== artist._id) fail('Oferta indisponível.');

    const status = response === 'accept' ? 'accepted' : 'declined';
    if (offer.status !== 'pending') return { status: offer.status } as const;

    const outcome = offer.respondBy !== undefined && Date.now() >= offer.respondBy ? 'expired' : status;
    await finishOffer(ctx, offer, outcome);
    return { status: outcome } as const;
  },
});

async function finishOffer(ctx: MutationCtx, offer: Doc<'offers'>, status: 'accepted' | 'declined' | 'expired'): Promise<void> {
  const [request, state] = await Promise.all([
    ctx.db.get(offer.requestId), selection(ctx, offer.requestId),
  ]);
  if (!request || request.status !== 'open' || !state) fail('Oferta indisponível.');

  await ctx.db.patch(offer._id, { status });
  let queue = state.queue;
  if (status === 'accepted') {
    const accepted = await offersWithStatus(ctx, request._id, 'accepted');
    if (accepted.length === request.artistSlots) await ctx.db.patch(request._id, { status: 'closed' });
  } else {
    for (const [index, id] of queue.entries()) {
      const backup = await ctx.db.get(id);
      if (backup?.requestId === request._id && !(await offerFor(ctx, id))) {
        await createOffer(ctx, request, id, offer.slot, offer.pricePerArtistCents);
        queue = queue.slice(index + 1);
        break;
      }
      if (index === queue.length - 1) queue = [];
    }
  }
  await ctx.db.patch(state._id, { revision: state.revision + 1, queue });
}

export const expire = internalMutation({
  args: { offerId: v.id('offers'), respondBy: v.number() },
  handler: async (ctx, { offerId, respondBy }): Promise<void> => {
    const offer = await ctx.db.get(offerId);
    if (offer?.status === 'pending' && offer.respondBy === respondBy && Date.now() >= respondBy) {
      await finishOffer(ctx, offer, 'expired');
    }
  },
});
