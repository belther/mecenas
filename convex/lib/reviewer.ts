import type { Doc, Id } from '../_generated/dataModel';
import type { QueryCtx } from '../_generated/server';
import { fail, requireUser } from './access';

export async function reviewerIdentity(ctx: QueryCtx) {
  const user = await requireUser(ctx);
  return user === process.env.MECENAS_REVIEWER_USER_ID ? user : null;
}

export async function independentReviewer(ctx: QueryCtx, record: Doc<'disputes'>): Promise<Id<'users'>> {
  const reviewer = await reviewerIdentity(ctx);
  if (!reviewer) fail('Acesso restrito à revisão da plataforma.');
  const profile = await ctx.db.query('profiles').withIndex('by_user', q => q.eq('userId', reviewer)).unique();
  if (profile && (profile._id === record.clientId || profile._id === record.artistId)) {
    fail('Um participante não pode avaliar a própria encomenda.');
  }
  return reviewer;
}
