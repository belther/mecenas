import { v } from 'convex/values';
import { internal } from './_generated/api';
import { internalMutation, internalQuery } from './_generated/server';
import { fail } from './lib/access';
import { independentReviewer } from './lib/reviewer';
import { currentDelivery, deliveryAccess, deliveryRelease, deliveryVersion, draftAccess, fileKind, uploadKind } from './lib/delivery';

const draft = { offerId: v.id('offers'), expectedVersion: v.number() };
const storageIds = { storageId: v.id('_storage'), previewStorageId: v.optional(v.id('_storage')) };

export const authorizeUpload = internalQuery({
  args: draft,
  handler: async (ctx, args) => { await draftAccess(ctx, args); },
});

export const registerUpload = internalMutation({
  args: { ...draft, ...storageIds, kind: uploadKind, contentType: v.string() },
  handler: async (ctx, args) => {
    const { profile } = await draftAccess(ctx, args);
    const uploadId = await ctx.db.insert('deliveryUploads', { ...args, artistId: profile._id, used: false });
    await ctx.scheduler.runAfter(24 * 60 * 60 * 1000, internal.deliveryFileRecords.expireDraft, { uploadId });
    return uploadId;
  },
});

export const expireDraft = internalMutation({
  args: { uploadId: v.id('deliveryUploads') },
  handler: async (ctx, { uploadId }) => {
    const upload = await ctx.db.get(uploadId);
    if (!upload || upload.used) return;
    await ctx.storage.delete(upload.storageId);
    if (upload.previewStorageId) await ctx.storage.delete(upload.previewStorageId);
    await ctx.db.delete(uploadId);
  },
});

export const storageForRead = internalQuery({
  args: { offerId: v.id('offers'), version: v.number(), kind: fileKind, processIndex: v.optional(v.number()), caseId: v.optional(v.id('disputes')) },
  handler: async (ctx, { offerId, version, kind, processIndex, caseId }) => {
    if (caseId) {
      const record = await ctx.db.get(caseId);
      if (record?.status !== 'open' || record.offerId !== offerId || record.version !== version || kind === 'original') {
        fail('Arquivo indisponível.');
      }
      await independentReviewer(ctx, record);
    } else {
      const { payment, profile } = await deliveryAccess(ctx, offerId);
      if (!payment) fail('Arquivo indisponível.');
      const current = await currentDelivery(ctx, offerId);
      if (profile.role === 'client' && current?.phase === 'rejected') fail('Arquivo indisponível.');
      const artistOwnsRejectedWork = profile.role === 'artist' && current?.phase === 'rejected';
      if (kind === 'original' && !artistOwnsRejectedWork) {
        const release = profile.role === 'client' ? await deliveryRelease(ctx, offerId) : null;
        if (release?.version !== version || release.paymentAttemptId !== payment._id) fail('Arquivo indisponível.');
      }
    }
    if (kind === 'process' && (!Number.isInteger(processIndex) || processIndex === undefined || processIndex < 0)) {
      fail('Imagem do processo indisponível.');
    }
    const delivery = await deliveryVersion(ctx, offerId, version);
    if (!delivery) fail('Arquivo indisponível.');
    const id = kind === 'process' && processIndex !== undefined ? delivery.processIds[processIndex] : delivery.originalId;
    const upload = id ? await ctx.db.get(id) : null;
    if (!upload?.used || upload.offerId !== offerId || upload.kind !== (kind === 'process' ? 'process' : 'original')) {
      fail('Arquivo indisponível.');
    }
    const storageId = kind === 'preview' ? upload.previewStorageId : upload.storageId;
    if (!storageId) fail('Arquivo indisponível.');
    return { storageId, contentType: kind === 'preview' ? 'image/webp' : upload.contentType };
  },
});
