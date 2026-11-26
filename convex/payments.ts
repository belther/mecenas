import { v } from 'convex/values';
import { internalMutation, internalQuery, query, type QueryCtx } from './_generated/server';
import type { Doc, Id } from './_generated/dataModel';
import { fail, requireProfile } from './lib/access';
import { pixConfigured } from '../lib/pix-config';

const offerId = v.id('offers');
const charge = v.object({
  providerId: v.string(), amountCents: v.number(),
  status: v.union(v.literal('PENDING'), v.literal('PAID'), v.literal('EXPIRED'), v.literal('CANCELLED')),
  pixCode: v.optional(v.string()), qrImage: v.optional(v.string()), expiresAt: v.optional(v.number()),
});

async function access(ctx: QueryCtx, id: Id<'offers'>, clientOnly = false) {
  const profile = await requireProfile(ctx);
  const offer = await ctx.db.get(id);
  if (!offer || offer.status !== 'accepted') fail('Oferta indisponível para pagamento.');
  if (profile.role === 'client') {
    const request = await ctx.db.get(offer.requestId);
    if (request?.clientId === profile._id) return { profile, offer };
  } else if (!clientOnly) {
    const application = await ctx.db.get(offer.applicationId);
    if (application?.artistId === profile._id) return { profile, offer };
  }
  fail('Oferta indisponível para pagamento.');
}

function latest(ctx: QueryCtx, id: Id<'offers'>) {
  return ctx.db.query('paymentAttempts').withIndex('by_offer', q => q.eq('offerId', id)).order('desc').first();
}

function funded(ctx: QueryCtx, id: Id<'offers'>) {
  return ctx.db.query('paymentAttempts').withIndex('by_offer_phase', q =>
    q.eq('offerId', id).eq('phase', 'funded')).unique();
}

export const view = query({
  args: { offerId },
  handler: async (ctx, { offerId }) => {
    const { profile } = await access(ctx, offerId);
    const paid = await funded(ctx, offerId);
    // `demo` appears only on seeded demo payments, so real payment views keep their exact shape.
    const demo = paid?.demo ? { demo: true as const } : {};
    // `refunded` / `refundPending` appear only after an upheld flag, so the label stops saying "confirmado".
    const dispute = paid && await ctx.db.query('disputes').withIndex('by_offer', q => q.eq('offerId', offerId)).order('desc').first();
    const refunded = dispute?.status === 'refunded' ? { refunded: true as const }
      : dispute?.status === 'refundPending' ? { refundPending: true as const } : {};
    if (profile.role === 'artist') return paid ? { phase: 'funded' as const, ...demo, ...refunded } : { phase: 'awaitingPayment' as const };
    const identity = await ctx.db.query('paymentIdentities').withIndex('by_client', q => q.eq('clientId', profile._id)).unique();
    const attempt = paid ?? await latest(ctx, offerId);
    const unavailable = !paid && !pixConfigured() ? { pixUnavailable: true as const } : {};
    return {
      phase: attempt?.phase ?? 'awaitingPayment' as const,
      ...demo,
      ...refunded,
      ...unavailable,
      requiresCpf: !identity,
      expiresAt: attempt?.phase === 'awaitingPix' ? attempt.expiresAt : undefined,
      pixCode: attempt?.phase === 'awaitingPix' ? attempt.pixCode : undefined,
      qrImage: attempt?.phase === 'awaitingPix' ? attempt.qrImage : undefined,
    };
  },
});

export const reserve = internalMutation({
  args: { offerId, reference: v.string(), cpfHash: v.optional(v.string()) },
  handler: async (ctx, args) => {
    const { profile, offer } = await access(ctx, args.offerId, true);
    const identity = await ctx.db.query('paymentIdentities').withIndex('by_client', q => q.eq('clientId', profile._id)).unique();
    if (!identity) {
      const hash = args.cpfHash;
      if (!hash) fail('Informe o CPF fictício autorizado.');
      const other = await ctx.db.query('paymentIdentities').withIndex('by_hash', q => q.eq('hash', hash)).unique();
      if (other) fail('CPF indisponível para esta conta.');
      await ctx.db.insert('paymentIdentities', { clientId: profile._id, hash });
    } else if (args.cpfHash && identity.hash !== args.cpfHash) {
      fail('Use o CPF fictício vinculado à sua conta.');
    }
    const attempt = await funded(ctx, offer._id) ?? await latest(ctx, offer._id);
    if (attempt && attempt.phase !== 'replaceable') return { attempt, create: false };
    const fields = {
      offerId: offer._id, reference: args.reference, amountCents: offer.pricePerArtistCents,
      phase: 'checking' as const,
    };
    const id = await ctx.db.insert('paymentAttempts', fields);
    return { attempt: { _id: id, ...fields }, create: true };
  },
});

export const forRefresh = internalQuery({
  args: { offerId },
  handler: async (ctx, { offerId }) => {
    await access(ctx, offerId, true);
    return await funded(ctx, offerId) ?? await latest(ctx, offerId);
  },
});

export const forEvent = internalQuery({
  args: { providerId: v.string(), reference: v.optional(v.string()) },
  handler: async (ctx, { providerId, reference }) => {
    const attempt = await ctx.db.query('paymentAttempts').withIndex('by_provider', q => q.eq('providerId', providerId)).unique();
    if (attempt || !reference) return attempt;
    return ctx.db.query('paymentAttempts').withIndex('by_reference', q => q.eq('reference', reference)).unique();
  },
});

export const rejectedCreation = internalMutation({
  args: { attemptId: v.id('paymentAttempts') },
  handler: async (ctx, { attemptId }) => {
    const attempt = await ctx.db.get(attemptId);
    if (attempt?.phase === 'checking' && !attempt.providerId) {
      await ctx.db.patch(attemptId, { phase: 'replaceable' });
    }
  },
});

export const observe = internalMutation({
  args: { attemptId: v.id('paymentAttempts'), charge, eventId: v.optional(v.string()) },
  handler: async (ctx, { attemptId, charge, eventId }) => {
    const attempt = await ctx.db.get(attemptId);
    if (!attempt || attempt.demo || attempt.amountCents !== charge.amountCents ||
      (attempt.providerId && attempt.providerId !== charge.providerId)) return false;
    const binding = await ctx.db.query('paymentAttempts').withIndex('by_provider', q => q.eq('providerId', charge.providerId)).unique();
    if (binding && binding._id !== attemptId) return false;

    if (charge.status === 'PAID') {
      if (eventId && await ctx.db.query('paymentEvents').withIndex('by_event', q => q.eq('eventId', eventId)).unique()) return true;
      const offer = await ctx.db.get(attempt.offerId);
      if (!offer || offer.status !== 'accepted' || offer.pricePerArtistCents !== charge.amountCents) return false;
      const existing = await funded(ctx, attempt.offerId);
      const result = !existing ? 'funded' : existing._id === attemptId ? 'duplicate' : 'conflict';
      if (!existing) {
        await ctx.db.patch(attemptId, {
          phase: 'funded', providerId: charge.providerId, pixCode: undefined, qrImage: undefined,
        });
      }
      if (eventId) await ctx.db.insert('paymentEvents', { eventId, attemptId, result });
      return true;
    }

    if (attempt.phase === 'funded' || attempt.phase === 'replaceable') return true;
    if (charge.status === 'EXPIRED' || charge.status === 'CANCELLED') {
      await ctx.db.patch(attemptId, {
        phase: 'replaceable', providerId: charge.providerId, pixCode: undefined, qrImage: undefined,
      });
    } else if (charge.pixCode && charge.qrImage && charge.expiresAt !== undefined) {
      await ctx.db.patch(attemptId, {
        phase: 'awaitingPix', providerId: charge.providerId, pixCode: charge.pixCode,
        qrImage: charge.qrImage, expiresAt: charge.expiresAt,
      });
    }
    return true;
  },
});
