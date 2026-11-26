import { v } from 'convex/values';
import { internal } from './_generated/api';
import { internalMutation } from './_generated/server';
import { fundedPayment } from './lib/delivery';
import { OFFER_WINDOW, REVIEW_WINDOW } from './lib/windows';

const args = { cursor: v.optional(v.string()) };
const pageSize = 32;

// Only rows written before deadline scheduling was introduced need a first window.
export const initializeOffers = internalMutation({
  args,
  handler: async (ctx, { cursor }): Promise<void> => {
    const batch = await ctx.db.query('offers').withIndex('by_response_deadline', q =>
      q.eq('status', 'pending').eq('respondBy', undefined)).paginate({ cursor: cursor ?? null, numItems: pageSize });
    const respondBy = Date.now() + OFFER_WINDOW;
    for (const offer of batch.page) {
      await ctx.db.patch(offer._id, { respondBy });
      await ctx.scheduler.runAt(respondBy, internal.applications.expire, { offerId: offer._id, respondBy });
    }
    if (!batch.isDone) await ctx.scheduler.runAfter(0, internal.deadlines.initializeOffers, { cursor: batch.continueCursor });
  },
});

export const initializeReviews = internalMutation({
  args,
  handler: async (ctx, { cursor }): Promise<void> => {
    const batch = await ctx.db.query('deliveries').withIndex('by_review_deadline', q =>
      q.eq('phase', 'review').eq('reviewBy', undefined)).paginate({ cursor: cursor ?? null, numItems: pageSize });
    const reviewBy = Date.now() + REVIEW_WINDOW;
    for (const delivery of batch.page) {
      if (!await fundedPayment(ctx, await ctx.db.get(delivery.offerId))) continue;
      await ctx.db.patch(delivery._id, { reviewBy });
      await ctx.scheduler.runAt(reviewBy, internal.deliveries.expireReview, {
        offerId: delivery.offerId, version: delivery.version, reviewBy,
      });
    }
    if (!batch.isDone) await ctx.scheduler.runAfter(0, internal.deadlines.initializeReviews, { cursor: batch.continueCursor });
  },
});
