"use node";
import { action } from './_generated/server';
import { ConvexError, v } from 'convex/values';
import type { Id } from './_generated/dataModel';
import { internal } from './_generated/api';
import { normalizeImage } from '../lib/image-validation';
export const create = action({ args: { bytes: v.bytes(), contentType: v.string(), purpose: v.union(v.literal('portfolio'), v.literal('reference')) }, returns: v.id('uploads'),
  handler: async (ctx, args): Promise<Id<'uploads'>> => {
    const userId = await ctx.runQuery(internal.uploadRecords.currentUser, {}); if (!userId) throw new ConvexError('Entre na sua conta para continuar.');
    await ctx.runQuery(internal.uploadRecords.authorize, { userId, purpose: args.purpose });
    let normalized: Buffer;
    try { normalized = await normalizeImage(args.bytes, args.contentType); }
    catch { throw new ConvexError('Imagem inválida. Use JPEG, PNG ou WebP de até 5 MB e 20 megapixels.'); }
    const storageId = await ctx.storage.store(new Blob([new Uint8Array(normalized)], { type: 'image/webp' }));
    try { return await ctx.runMutation(internal.uploadRecords.register, { userId, storageId, purpose: args.purpose, contentType: 'image/webp', size: normalized.byteLength }); }
    catch (error) { await ctx.storage.delete(storageId); throw error; }
  },
});
export const preview = action({ args: { id: v.id('uploads') }, returns: v.union(v.string(), v.null()), handler: async (ctx, args): Promise<string | null> => {
  const userId = await ctx.runQuery(internal.uploadRecords.currentUser, {}); if (!userId) throw new ConvexError('Entre na sua conta para continuar.');
  return ctx.runQuery(internal.uploadRecords.preview, { userId, id: args.id });
} });
