"use node";
import { v } from 'convex/values';
import { internal } from './_generated/api';
import { internalAction } from './_generated/server';
import { reconcileRefund } from '../lib/pix-provider';

export const process = internalAction({
  args: { caseId: v.id('disputes'), run: v.number() },
  handler: async (ctx, args): Promise<void> => {
    const payment = await ctx.runMutation(internal.disputes.claim, args);
    if (!payment) return;
    let confirmed = false;
    try {
      confirmed = await reconcileRefund(payment,
        () => ctx.runMutation(internal.disputes.reserveSubmission, args),
        async () => { await ctx.runMutation(internal.disputes.recordRefusal, args); });
    } catch {
      // Keep the refund pending so the reviewer can reconcile the same charge.
    }
    await ctx.runMutation(internal.disputes.finish, { ...args, confirmed });
  },
});
