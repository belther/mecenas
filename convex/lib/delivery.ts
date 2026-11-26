import { v } from 'convex/values';
import type { Doc, Id } from '../_generated/dataModel';
import type { QueryCtx, MutationCtx } from '../_generated/server';
import { fail, requireProfile } from './access';

export const uploadKind = v.union(v.literal('original'), v.literal('process'));
export const fileKind = v.union(v.literal('original'), v.literal('process'), v.literal('preview'));

export async function deliveryAccess(ctx: QueryCtx, offerId: Id<'offers'>, role?: 'artist' | 'client') {
  const profile = await requireProfile(ctx, role);
  const offer = await ctx.db.get(offerId);
  if (!offer || offer.status !== 'accepted') fail('Entrega indisponível para esta oferta.');
  const owner = profile.role === 'client'
    ? (await ctx.db.get(offer.requestId))?.clientId
    : (await ctx.db.get(offer.applicationId))?.artistId;
  if (owner !== profile._id) fail('Entrega indisponível para esta oferta.');

  return { profile, payment: await fundedPayment(ctx, offer) };
}

export async function fundedPayment(ctx: QueryCtx, offer: Doc<'offers'> | null) {
  if (offer?.status !== 'accepted') return null;
  const payment = await ctx.db.query('paymentAttempts').withIndex('by_offer_phase', q =>
    q.eq('offerId', offer._id).eq('phase', 'funded')).unique();
  return payment?.amountCents === offer.pricePerArtistCents ? payment : null;
}

export function currentDelivery(ctx: QueryCtx, offerId: Id<'offers'>) {
  return ctx.db.query('deliveries').withIndex('by_offer', q => q.eq('offerId', offerId)).unique();
}

export function deliveryVersion(ctx: QueryCtx, offerId: Id<'offers'>, version: number) {
  return ctx.db.query('deliveryVersions').withIndex('by_offer_version', q =>
    q.eq('offerId', offerId).eq('version', version)).unique();
}

export function deliveryRelease(ctx: QueryCtx, offerId: Id<'offers'>) {
  return ctx.db.query('deliveryReleases').withIndex('by_offer', q => q.eq('offerId', offerId)).unique();
}

export async function draftAccess(ctx: QueryCtx, { offerId, expectedVersion }: {
  offerId: Id<'offers'>; expectedVersion: number;
}) {
  const { profile, payment } = await deliveryAccess(ctx, offerId, 'artist');
  if (!payment) fail('Aguarde a confirmação do pagamento para enviar a entrega.');
  const delivery = await currentDelivery(ctx, offerId);
  if (expectedVersion !== (delivery?.version ?? 0) || (delivery && delivery.phase !== 'revision')) {
    fail('A entrega mudou. Confira a versão atual.');
  }
  return { profile, delivery };
}

export function matchesUpload(upload: Doc<'deliveryUploads'> | null, draft: {
  offerId: Id<'offers'>; artistId: Id<'profiles'>; expectedVersion: number;
}, kind: Doc<'deliveryUploads'>['kind']): upload is Doc<'deliveryUploads'> {
  return !!upload && !upload.used && upload.offerId === draft.offerId && upload.artistId === draft.artistId &&
    upload.expectedVersion === draft.expectedVersion && upload.kind === kind;
}

export function disputeFor(ctx: QueryCtx, offerId: Id<'offers'>) {
  return ctx.db.query('disputes').withIndex('by_offer', q => q.eq('offerId', offerId)).unique();
}

export async function release(ctx: MutationCtx, delivery: Doc<'deliveries'>, payment: Doc<'paymentAttempts'>,
  reason: 'manual' | 'deadline' | 'dismissed'): Promise<void> {
  await ctx.db.insert('deliveryReleases', {
    offerId: delivery.offerId, version: delivery.version, paymentAttemptId: payment._id,
    amountCents: payment.amountCents, currency: 'BRL', licence: delivery.licence, reason,
  });
  await ctx.db.patch(delivery._id, { phase: 'approved' });
}
