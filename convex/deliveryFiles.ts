"use node";

import { v } from 'convex/values';
import { deliveryPreview, normalizeImage } from '../lib/image-validation';
import { internal } from './_generated/api';
import type { Id } from './_generated/dataModel';
import { action } from './_generated/server';
import { fail } from './lib/access';
import { fileKind, uploadKind } from './lib/delivery';

export const upload = action({
  args: {
    offerId: v.id('offers'), expectedVersion: v.number(), kind: uploadKind,
    bytes: v.bytes(), contentType: v.string(),
  },
  returns: v.id('deliveryUploads'),
  handler: async (ctx, { bytes, contentType, kind, ...draft }): Promise<Id<'deliveryUploads'>> => {
    await ctx.runQuery(internal.deliveryFileRecords.authorizeUpload, draft);
    const final = kind === 'original';
    let rendered: Uint8Array<ArrayBuffer>;
    try {
      rendered = new Uint8Array(await (final ? deliveryPreview(bytes, contentType) : normalizeImage(bytes, contentType)));
    } catch {
      fail('Imagem inválida. Use JPEG, PNG ou WebP de até 5 MB e 20 megapixels.');
    }
    const storedType = final ? contentType : 'image/webp';
    const storageId = await ctx.storage.store(new Blob([final ? bytes : rendered], { type: storedType }));
    let previewStorageId: Id<'_storage'> | undefined;
    try {
      if (final) previewStorageId = await ctx.storage.store(new Blob([rendered], { type: 'image/webp' }));
      return await ctx.runMutation(internal.deliveryFileRecords.registerUpload, {
        ...draft, kind, storageId, previewStorageId, contentType: storedType,
      });
    } catch (error) {
      const cleanup = [ctx.storage.delete(storageId)];
      if (previewStorageId) cleanup.push(ctx.storage.delete(previewStorageId));
      await Promise.allSettled(cleanup);
      throw error;
    }
  },
});

export const read = action({
  args: { offerId: v.id('offers'), version: v.number(), kind: fileKind, processIndex: v.optional(v.number()), caseId: v.optional(v.id('disputes')) },
  returns: v.object({ bytes: v.bytes(), contentType: v.string() }),
  handler: async (ctx, args): Promise<{ bytes: ArrayBuffer; contentType: string }> => {
    const { storageId, contentType } = await ctx.runQuery(internal.deliveryFileRecords.storageForRead, args);
    const file = await ctx.storage.get(storageId);
    if (!file) fail('Arquivo indisponível.');
    return { bytes: await file.arrayBuffer(), contentType };
  },
});
