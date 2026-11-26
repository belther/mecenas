import { v } from 'convex/values';
import { internal } from './_generated/api';
import type { Doc } from './_generated/dataModel';
import { internalMutation, mutation, query, type MutationCtx } from './_generated/server';
import { fail, text } from './lib/access';
import { currentDelivery, deliveryAccess, deliveryVersion, disputeFor, fundedPayment, release } from './lib/delivery';
import { independentReviewer, reviewerIdentity } from './lib/reviewer';

export const flag = mutation({
  args: { offerId: v.id('offers'), version: v.number(), reason: v.string() },
  handler: async (ctx, { offerId, version, reason }): Promise<void> => {
    const { profile, payment } = await deliveryAccess(ctx, offerId, 'client');
    const delivery = await currentDelivery(ctx, offerId);
    if (!payment || !delivery || delivery.version !== version) fail('Entrega indisponível para contestação.');
    if (delivery.phase === 'disputed') return;
    if (delivery.phase !== 'review') fail('O prazo de contestação desta versão terminou.');
    if (delivery.reviewBy !== undefined && Date.now() >= delivery.reviewBy) {
      await release(ctx, delivery, payment, 'deadline');
      return;
    }
    const offer = await ctx.db.get(offerId);
    const application = offer && await ctx.db.get(offer.applicationId);
    if (!application) fail('Artista indisponível.');
    await ctx.db.insert('disputes', { offerId, version, clientId: profile._id, artistId: application.artistId,
      paymentAttemptId: payment._id, status: 'open', reason: text(reason, 1, 1000, 'Motivo') });
    await ctx.db.patch(delivery._id, { phase: 'disputed', reviewBy: undefined });
  },
});

export const queue = query({
  args: {},
  handler: async ctx => {
    const reviewer = await reviewerIdentity(ctx);
    if (!reviewer) return null;
    const profile = await ctx.db.query('profiles').withIndex('by_user', q => q.eq('userId', reviewer)).unique();
    const open = await ctx.db.query('disputes').withIndex('by_status', q => q.eq('status', 'open')).collect();
    const pending = await ctx.db.query('disputes').withIndex('by_status', q => q.eq('status', 'refundPending')).collect();
    const cases = [...open, ...pending].filter(d => d.clientId !== profile?._id && d.artistId !== profile?._id);
    return Promise.all(cases.map(async d => {
      const offer = await ctx.db.get(d.offerId);
      const request = offer && await ctx.db.get(offer.requestId);
      const version = await deliveryVersion(ctx, d.offerId, d.version);
      return { id: d._id, offerId: d.offerId, title: request?.title ?? 'Encomenda', version: d.version,
        reason: d.reason, status: d.status, decisionNote: d.decisionNote, processCount: version?.processIds.length ?? 0 };
    }));
  },
});

async function scheduleRefund(ctx: MutationCtx, record: Doc<'disputes'>): Promise<void> {
  const run = (record.refundRun ?? 0) + 1;
  const refundJob = await ctx.scheduler.runAfter(0, internal.refunds.process, { caseId: record._id, run });
  await ctx.db.patch(record._id, { refundRun: run, refundJob });
}

export const decide = mutation({
  args: { caseId: v.id('disputes'), outcome: v.union(v.literal('uphold'), v.literal('dismiss')), note: v.string() },
  handler: async (ctx, { caseId, outcome, note }): Promise<void> => {
    const record = await ctx.db.get(caseId);
    if (!record) fail('Caso indisponível.');
    const reviewer = await independentReviewer(ctx, record);
    if (record.status !== 'open') fail('Este caso já recebeu uma decisão.');
    const delivery = await currentDelivery(ctx, record.offerId);
    const payment = await fundedPayment(ctx, await ctx.db.get(record.offerId));
    if (delivery?.phase !== 'disputed' || delivery.version !== record.version || payment?._id !== record.paymentAttemptId) {
      fail('A entrega ou o pagamento mudou.');
    }
    const upheld = outcome === 'uphold';
    // A seeded demo payment has no provider charge, so its refund is a labelled demo refund.
    const demo = payment.demo === true;
    await ctx.db.patch(caseId, { reviewer, decidedAt: Date.now(), decisionNote: text(note, 1, 1000, 'Justificativa'),
      status: upheld ? (demo ? 'refunded' : 'refundPending') : 'dismissed' });
    if (upheld) {
      await ctx.db.patch(delivery._id, { phase: 'rejected' });
      if (!demo) await scheduleRefund(ctx, record);
    } else {
      await release(ctx, delivery, payment, 'dismissed');
    }
  },
});

export const retryRefund = mutation({
  args: { caseId: v.id('disputes') },
  handler: async (ctx, { caseId }): Promise<void> => {
    const record = await ctx.db.get(caseId);
    if (!record) fail('Caso indisponível.');
    await independentReviewer(ctx, record);
    if (record.status !== 'refundPending') fail('Nenhum reembolso pendente.');
    const job = record.refundJob && await ctx.db.system.get(record.refundJob);
    if (job?.state.kind === 'pending' || job?.state.kind === 'inProgress') fail('Aguarde a verificação em andamento.');
    await scheduleRefund(ctx, record);
  },
});

const runArgs = { caseId: v.id('disputes'), run: v.number() };
export const claim = internalMutation({
  args: runArgs,
  handler: async (ctx, { caseId, run }): Promise<Doc<'paymentAttempts'> | null> => {
    const record = await ctx.db.get(caseId);
    if (record?.status !== 'refundPending' || record.refundRun !== run || record.startedRun === run) return null;
    const payment = await fundedPayment(ctx, await ctx.db.get(record.offerId));
    if (payment?._id !== record.paymentAttemptId || !payment.providerId || payment.demo) return null;
    await ctx.db.patch(caseId, { startedRun: run });
    return payment;
  },
});

// Commit the intent before the external POST. A crash or an ambiguous response leaves
// future attempts in lookup-only mode until the provider confirms the refund.
export const reserveSubmission = internalMutation({
  args: runArgs,
  handler: async (ctx, { caseId, run }): Promise<boolean> => {
    const record = await ctx.db.get(caseId);
    if (record?.status !== 'refundPending' || record.refundRun !== run || record.startedRun !== run || record.refundSubmitted) return false;
    await ctx.db.patch(caseId, { refundSubmitted: true });
    return true;
  },
});

export const recordRefusal = internalMutation({
  args: runArgs,
  handler: async (ctx, { caseId, run }) => {
    const record = await ctx.db.get(caseId);
    if (record?.status === 'refundPending' && record.refundRun === run && record.startedRun === run) {
      await ctx.db.patch(caseId, { refundSubmitted: false });
    }
  },
});

export const finish = internalMutation({
  args: { ...runArgs, confirmed: v.boolean() },
  handler: async (ctx, { caseId, run, confirmed }): Promise<void> => {
    const record = await ctx.db.get(caseId);
    if (record?.status !== 'refundPending' || record.refundRun !== run || record.startedRun !== run) return;
    await ctx.db.patch(caseId, { status: confirmed ? 'refunded' : 'refundPending' });
  },
});

export const observeRefund = internalMutation({
  args: { attemptId: v.id('paymentAttempts') },
  handler: async (ctx, { attemptId }) => {
    const payment = await ctx.db.get(attemptId);
    if (payment?.phase !== 'funded') return;
    const record = await disputeFor(ctx, payment.offerId);
    if (record?.status === 'refundPending' && record.paymentAttemptId === payment._id) {
      await ctx.db.patch(record._id, { status: 'refunded' });
    }
  },
});
