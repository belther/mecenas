import { v } from 'convex/values';
import { DELIVERY_LICENCE } from '../lib/delivery-licence';
import { internal } from './_generated/api';
import { REVIEW_WINDOW } from './lib/windows';
import { internalMutation, mutation, query } from './_generated/server';
import { fail, text } from './lib/access';
import { currentDelivery, deliveryAccess, deliveryRelease, deliveryVersion, draftAccess, fundedPayment, matchesUpload, disputeFor, release } from './lib/delivery';

const versionArgs = { offerId: v.id('offers'), version: v.number() };

export const mine = query({
  args: { offerId: v.id('offers') },
  handler: async (ctx, { offerId }) => {
    const { payment, profile } = await deliveryAccess(ctx, offerId);
    const delivery = payment && await currentDelivery(ctx, offerId);
    if (!delivery) return {
      phase: payment ? 'ready' as const : 'awaitingPayment' as const,
      version: 0, revisions: [], processCount: 0, licence: DELIVERY_LICENCE,
    };
    const dispute = await disputeFor(ctx, offerId);
    const version = await deliveryVersion(ctx, offerId, delivery.version);
    const release = delivery.phase === 'approved' ? await deliveryRelease(ctx, offerId) : null;
    return {
      phase: delivery.phase,
      version: delivery.version,
      revisions: delivery.revisions,
      reviewBy: delivery.reviewBy,
      processCount: version?.processIds.length ?? 0,
      licence: profile.role === 'client' && delivery.phase === 'rejected' ? '' : delivery.licence,
      dispute: dispute ? { status: dispute.status, reason: dispute.reason, decisionNote: dispute.decisionNote } : undefined,
      release: release ? { amountCents: release.amountCents, currency: release.currency, licence: release.licence, reason: release.reason ?? 'manual' } : undefined,
    };
  },
});

export const submit = mutation({
  args: {
    offerId: v.id('offers'), expectedVersion: v.number(), originalId: v.id('deliveryUploads'),
    processIds: v.array(v.id('deliveryUploads')),
  },
  handler: async (ctx, args) => {
    const { profile, delivery } = await draftAccess(ctx, args);
    const { offerId, expectedVersion, originalId, processIds } = args;
    if (processIds.length < 2 || processIds.length > 3 || new Set(processIds).size !== processIds.length) {
      fail('Envie duas ou três imagens do processo.');
    }
    const draft = { offerId, expectedVersion, artistId: profile._id };
    const original = await ctx.db.get(originalId);
    const process = await Promise.all(processIds.map(id => ctx.db.get(id)));
    if (!matchesUpload(original, draft, 'original') || !original.previewStorageId ||
      process.some(image => !matchesUpload(image, draft, 'process'))) {
      fail('Arquivos indisponíveis para esta versão. Envie as imagens novamente.');
    }

    const version = expectedVersion + 1;
    await ctx.db.insert('deliveryVersions', { offerId, version, originalId, processIds });
    for (const id of [originalId, ...processIds]) await ctx.db.patch(id, { used: true });
    const reviewBy = Date.now() + REVIEW_WINDOW;
    if (delivery) await ctx.db.patch(delivery._id, { phase: 'review', version, reviewBy });
    else await ctx.db.insert('deliveries', { offerId, version, phase: 'review', reviewBy, licence: DELIVERY_LICENCE, revisions: [] });
    await ctx.scheduler.runAt(reviewBy, internal.deliveries.expireReview, { offerId, version, reviewBy });
  },
});

export const requestRevision = mutation({
  args: { ...versionArgs, note: v.string() },
  handler: async (ctx, { offerId, version, note }) => {
    const { payment } = await deliveryAccess(ctx, offerId, 'client');
    const delivery = await currentDelivery(ctx, offerId);
    if (!payment || delivery?.phase !== 'review' || delivery.version !== version) {
      fail('Esta versão não está disponível para revisão.');
    }
    if (delivery.reviewBy !== undefined && Date.now() >= delivery.reviewBy) {
      await release(ctx, delivery, payment, 'deadline');
      return;
    }
    if (delivery.revisions.length >= 2) fail('As duas revisões já foram solicitadas.');
    const instruction = text(note, 1, 1000, 'Instrução da revisão');
    await ctx.db.patch(delivery._id, {
      phase: 'revision', reviewBy: undefined, revisions: [...delivery.revisions, { version, note: instruction }],
    });
  },
});

export const approve = mutation({
  args: versionArgs,
  handler: async (ctx, { offerId, version }) => {
    const { payment } = await deliveryAccess(ctx, offerId, 'client');
    const delivery = await currentDelivery(ctx, offerId);
    if (!payment || !delivery || delivery.version !== version || !['review', 'approved'].includes(delivery.phase)) {
      fail('Esta versão não está disponível para aprovação.');
    }
    if (delivery.phase === 'approved') return;

    if (delivery.phase === 'review') {
      const due = delivery.reviewBy !== undefined && Date.now() >= delivery.reviewBy;
      await release(ctx, delivery, payment, due ? 'deadline' : 'manual');
    }
  },
});

export const expireReview = internalMutation({
  args: { ...versionArgs, reviewBy: v.number() },
  handler: async (ctx, { offerId, version, reviewBy }): Promise<void> => {
    if (Date.now() < reviewBy) return;
    const delivery = await currentDelivery(ctx, offerId);
    if (delivery?.phase !== 'review' || delivery.version !== version || delivery.reviewBy !== reviewBy) return;
    const payment = await fundedPayment(ctx, await ctx.db.get(offerId));
    if (payment) await release(ctx, delivery, payment, 'deadline');
  },
});
