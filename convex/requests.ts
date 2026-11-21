import { query, mutation, type QueryCtx } from './_generated/server';
import type { Doc } from './_generated/dataModel';
import { v } from 'convex/values';
import { fail, ownedUploads, requireProfile, validateRequest } from './lib/access';
async function project(ctx: QueryCtx, r: Doc<'requests'>) {
  return { _id: r._id, title: r.title, description: r.description, artType: r.artType, pricePerArtistCents: r.pricePerArtistCents,
    artistSlots: r.artistSlots, status: r.status, exampleUploadIds: r.exampleUploadIds,
    images: await Promise.all(r.exampleStorageIds.map(id => ctx.storage.getUrl(id))) };
}
export const saveDraft = mutation({
  args: { id: v.optional(v.id('requests')), title: v.string(), description: v.string(), pricePerArtistCents: v.number(), artistSlots: v.number(), exampleUploadIds: v.array(v.id('uploads')) },
  handler: async (ctx, args) => {
    const client = await requireProfile(ctx, 'client');
    const existing = args.id ? await ctx.db.get(args.id) : null;
    if (args.id && (!existing || existing.clientId !== client._id)) fail('Encomenda indisponível.');
    if (existing && existing.status !== 'draft') fail('Uma encomenda publicada não pode ser editada como rascunho.');
    const uploads = await ownedUploads(ctx, args.exampleUploadIds, client.userId, 'reference');
    const fields = { ...validateRequest(args), artType: 'illustration' as const, exampleUploadIds: args.exampleUploadIds, exampleStorageIds: uploads.map(u => u.storageId) };
    if (existing) { await ctx.db.patch(existing._id, fields); return existing._id; }
    return ctx.db.insert('requests', { ...fields, clientId: client._id, status: 'draft' });
  },
});
export const publish = mutation({ args: { id: v.id('requests') }, handler: async (ctx, { id }) => {
  const client = await requireProfile(ctx, 'client'); const row = await ctx.db.get(id);
  if (!row || row.clientId !== client._id) fail('Encomenda indisponível.');
  if (row.status === 'open') return null;
  if (row.status !== 'draft') fail('Encomenda indisponível.');
  validateRequest(row);
  const uploads = await ownedUploads(ctx, row.exampleUploadIds, client.userId, 'reference');
  if (uploads.length !== row.exampleStorageIds.length || uploads.some((upload, index) => upload.storageId !== row.exampleStorageIds[index])) fail('As imagens do rascunho não correspondem aos arquivos autorizados. Salve o rascunho novamente.');
  await ctx.db.patch(id, { status: 'open' }); return null;
} });
export const mine = query({ args: {}, handler: async ctx => {
  const client = await requireProfile(ctx, 'client');
  return Promise.all((await ctx.db.query('requests').withIndex('by_client', q => q.eq('clientId', client._id)).order('desc').collect()).map(r => project(ctx, r)));
} });
export const browse = query({ args: {}, handler: async ctx => {
  await requireProfile(ctx, 'artist');
  return Promise.all((await ctx.db.query('requests').withIndex('by_status', q => q.eq('status', 'open')).order('desc').take(100)).map(r => project(ctx, r)));
} });
export const get = query({ args: { id: v.id('requests') }, handler: async (ctx, { id }) => {
  const p = await requireProfile(ctx); const row = await ctx.db.get(id);
  if (!row || !(row.clientId === p._id || (p.role === 'artist' && row.status === 'open'))) fail('Encomenda indisponível.');
  return project(ctx, row);
} });
