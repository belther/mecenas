import { v } from 'convex/values';
import type { Doc } from './_generated/dataModel';
import { query, type QueryCtx } from './_generated/server';
import { fail, requireProfile, requireUser } from './lib/access';
import { currentDelivery, disputeFor, fundedPayment } from './lib/delivery';

async function commissions(ctx: QueryCtx, profile: Doc<'profiles'>) {
  if (profile.role === 'client') {
    const requests = await ctx.db.query('requests').withIndex('by_client', q => q.eq('clientId', profile._id)).collect();
    const groups = await Promise.all(requests.map(r => ctx.db.query('offers').withIndex('by_request_status',
      q => q.eq('requestId', r._id).eq('status', 'accepted')).collect()));
    return groups.flat();
  }
  const applications = await ctx.db.query('applications').withIndex('by_artist', q => q.eq('artistId', profile._id)).collect();
  const offers = await Promise.all(applications.map(a => ctx.db.query('offers').withIndex('by_application',
    q => q.eq('applicationId', a._id)).unique()));
  return offers.filter((o): o is Doc<'offers'> => o?.status === 'accepted');
}

export const facts = query({
  args: { subject: v.union(v.object({ profileId: v.id('profiles') }), v.object({ applicationId: v.id('applications') }),
    v.object({ requestId: v.id('requests') })) },
  handler: async (ctx, { subject }) => {
    const profile = await resolveProfile(ctx, subject);
    if (!profile) fail('Perfil indisponível.');
    const totals = { role: profile.role, paid: 0, delivered: 0, revised: 0, completed: 0, flagged: 0, upheld: 0, dismissed: 0 };
    for (const offer of await commissions(ctx, profile)) {
      if (!await fundedPayment(ctx, offer)) continue;
      totals.paid++;
      const delivery = await currentDelivery(ctx, offer._id);
      if (!delivery) continue;
      totals.delivered++;
      if (delivery.revisions.length) totals.revised++;
      if (delivery.phase === 'approved') totals.completed++;
      const dispute = await disputeFor(ctx, offer._id);
      if (dispute) {
        totals.flagged++;
        if (dispute.status === 'dismissed') totals.dismissed++;
        if (dispute.status === 'refundPending' || dispute.status === 'refunded') totals.upheld++;
      }
    }
    return profile.role === 'artist'
      ? { role: 'artist' as const, completed: totals.completed, upheld: totals.upheld }
      : { role: 'client' as const, paid: totals.paid, delivered: totals.delivered, revised: totals.revised,
          flagged: totals.flagged, upheld: totals.upheld, dismissed: totals.dismissed };
  },
});

async function resolveProfile(ctx: QueryCtx, subject: { profileId: Doc<'profiles'>['_id'] } |
  { applicationId: Doc<'applications'>['_id'] } | { requestId: Doc<'requests'>['_id'] }) {
  if ('applicationId' in subject) {
    const client = await requireProfile(ctx, 'client');
    const application = await ctx.db.get(subject.applicationId);
    const request = application && await ctx.db.get(application.requestId);
    if (!application || request?.clientId !== client._id) fail('Candidatura indisponível.');
    return ctx.db.get(application.artistId);
  }
  if ('requestId' in subject) {
    await requireProfile(ctx, 'artist');
    const request = await ctx.db.get(subject.requestId);
    if (request?.status !== 'open') fail('Encomenda indisponível.');
    return ctx.db.get(request.clientId);
  }
  await requireUser(ctx);
  return ctx.db.get(subject.profileId);
}
