"use node";
import { randomUUID } from 'node:crypto';
import { action, internalAction } from './_generated/server';
import { internal } from './_generated/api';
import { ConvexError, v } from 'convex/values';
import { settlementEvent, settlementStatus, cpfHash, createCharge, lookupCharge, testKey, validateDelivery } from '../lib/pix-provider';

export const start = action({
  args: { offerId: v.id('offers'), syntheticCpf: v.optional(v.string()) },
  handler: async (ctx, { offerId, syntheticCpf }): Promise<void> => {
    await ctx.runQuery(internal.payments.forRefresh, { offerId });
    const key = testKey();
    const { attempt, create } = await ctx.runMutation(internal.payments.reserve, {
      offerId, reference: `mecenas-${randomUUID()}`,
      cpfHash: syntheticCpf ? cpfHash(syntheticCpf) : undefined,
    });
    if (!create) return;
    try {
      const result = await createCharge(key, attempt);
      if (result.rejected) await ctx.runMutation(internal.payments.rejectedCreation, { attemptId: attempt._id });
      if (result.charge) await ctx.runMutation(internal.payments.observe, { attemptId: attempt._id, charge: result.charge });
    } catch {
      // An unknown result keeps the same reservation for later reconciliation.
    }
  },
});

export const refresh = action({
  args: { offerId: v.id('offers') },
  handler: async (ctx, { offerId }): Promise<void> => {
    const attempt = await ctx.runQuery(internal.payments.forRefresh, { offerId });
    if (!attempt || attempt.phase === 'funded' || attempt.phase === 'replaceable') return;
    const key = testKey();
    try {
      const charge = await lookupCharge(key, attempt);
      if (!charge || !await ctx.runMutation(internal.payments.observe, { attemptId: attempt._id, charge })) {
        throw new Error('Charge not confirmed.');
      }
    } catch {
      throw new ConvexError('Ainda não conseguimos confirmar a cobrança. Tente verificar novamente.');
    }
  },
});

export const receive = internalAction({
  args: { raw: v.bytes(), secret: v.string(), signature: v.string() },
  handler: async (ctx, { raw, secret, signature }): Promise<number> => {
    if (!process.env.ABACATEPAY_WEBHOOK_SECRET) return 503;
    if (!validateDelivery(raw, secret, signature)) return 401;
    let event;
    try { event = settlementEvent(raw); } catch { return 400; }
    if (!event) return 400;
    const { providerId, reference, amountCents, eventId } = event;
    const attempt = await ctx.runQuery(internal.payments.forEvent, { providerId, reference });
    if (!attempt || attempt.amountCents !== amountCents || (attempt.providerId && attempt.providerId !== providerId)) return 204;
    try {
      const status = await settlementStatus(testKey(), { ...attempt, providerId });
      if (status === 'REFUNDED' && attempt.phase === 'funded' && attempt.providerId === providerId) {
        await ctx.runMutation(internal.disputes.observeRefund, { attemptId: attempt._id });
        return 204;
      }
      if (status !== 'PAID' || event.refunded) return 503;
      const charge = { providerId, amountCents, status: 'PAID' as const };
      return await ctx.runMutation(internal.payments.observe, { attemptId: attempt._id, charge, eventId }) ? 204 : 409;
    } catch {
      return 503;
    }
  },
});
