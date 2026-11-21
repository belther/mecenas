import { query, mutation } from './_generated/server';
import { v } from 'convex/values';
import { getAuthUserId } from '@convex-dev/auth/server';
import { fail, ownedUploads, requireUser, text } from './lib/access';
export const me = query({ args: {}, handler: async ctx => {
  const userId = await getAuthUserId(ctx); if (!userId) return null;
  const p = await ctx.db.query('profiles').withIndex('by_user', q => q.eq('userId', userId)).unique();
  if (!p) return null;
  return { _id: p._id, role: p.role, displayName: p.displayName, bio: p.bio ?? '', portfolioUploadIds: p.portfolioUploadIds,
    images: await Promise.all(p.portfolioStorageIds.map(id => ctx.storage.getUrl(id))) };
} });
export const save = mutation({
  args: { role: v.union(v.literal('artist'), v.literal('client')), displayName: v.string(), bio: v.string(), portfolioUploadIds: v.array(v.id('uploads')) },
  handler: async (ctx, args) => {
    const userId = await requireUser(ctx);
    const existing = await ctx.db.query('profiles').withIndex('by_user', q => q.eq('userId', userId)).unique();
    if (existing && existing.role !== args.role) fail('O tipo de perfil não pode ser alterado.');
    if (args.role === 'client' && args.portfolioUploadIds.length) fail('Somente artistas têm portfólio.');
    const uploads = await ownedUploads(ctx, args.portfolioUploadIds, userId, 'portfolio');
    const fields = { role: args.role, displayName: text(args.displayName, 2, 60, 'Nome artístico'), bio: text(args.bio, 0, 1000, 'Biografia'), portfolioUploadIds: args.portfolioUploadIds, portfolioStorageIds: uploads.map(u => u.storageId) };
    if (existing) { await ctx.db.patch(existing._id, fields); return existing._id; }
    return ctx.db.insert('profiles', { userId, ...fields });
  },
});
