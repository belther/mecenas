"use node";
// Iteration 007 synthetic demo seed: draws fictitious images, stores them and fills the
// database. Internal action: run it with `npm run demo:seed` (scripts/demo-seed.mjs).
import sharp from 'sharp';
import { v } from 'convex/values';
import { internal } from './_generated/api';
import type { Id } from './_generated/dataModel';
import { internalAction, type ActionCtx } from './_generated/server';
import { deliveryPreview, normalizeImage } from '../lib/image-validation';
import { DEMO_COMMISSIONS, DEMO_DELIVERY_VERSIONS, DEMO_PALETTES, type DemoCommissionKey } from '../lib/demo-fixture';

/** A simple abstract composition: deterministic for a given seed, clearly not real artwork. */
function art(seed: number, [a, b, c]: string[], stage: 'final' | 'sketch' | 'colour' = 'final') {
  const shapes = Array.from({ length: 7 }, (_, i) => {
    const x = (seed * 97 + i * 131) % 760 + 20, y = (seed * 53 + i * 89) % 480 + 40, r = 30 + (seed * 7 + i * 23) % 90;
    const fill = stage === 'sketch' ? 'none' : [a, b, c][i % 3];
    const stroke = stage === 'final' ? 'none' : '#2b2b2b';
    return i % 2 ? `<circle cx="${x}" cy="${y}" r="${r}" fill="${fill}" stroke="${stroke}" stroke-width="3" opacity="0.9"/>`
      : `<rect x="${x - r}" y="${y - r / 2}" width="${r * 1.6}" height="${r}" rx="12" fill="${fill}" stroke="${stroke}" stroke-width="3" transform="rotate(${(seed + i * 17) % 40 - 20} ${x} ${y})"/>`;
  }).join('');
  const background = stage === 'sketch' ? '#faf7f0' : stage === 'colour' ? '#f3efe6' : '#fffaf2';
  return Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="800" height="600">
    <rect width="800" height="600" fill="${background}"/>${shapes}
  </svg>`);
}

const png = (svg: Buffer) => sharp(svg).png().toBuffer();
const toArrayBuffer = (buffer: Buffer): ArrayBuffer => buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength) as ArrayBuffer;

async function store(ctx: ActionCtx, bytes: Buffer, type: string) {
  return { storageId: await ctx.storage.store(new Blob([new Uint8Array(bytes)], { type })), size: bytes.byteLength };
}
async function webp(ctx: ActionCtx, svg: Buffer) {
  return store(ctx, await normalizeImage(toArrayBuffer(await png(svg)), 'image/png'), 'image/webp');
}

export const run = internalAction({
  args: { password: v.string() },
  handler: async (ctx, { password }): Promise<{ createdAccounts: number; removedCommissions: number; detachedCommissions: number; reviewerUserId: Id<'users'>; commissions: Record<string, string> }> => {
    const prepared: { profiles: Record<string, Id<'profiles'>>; users: Record<string, Id<'users'>>; created: number } =
      await ctx.runMutation(internal.demoData.prepare, { password });
    const { profiles, users, created } = prepared;
    const portfolio: Record<string, { storageId: Id<'_storage'>; size: number }[]> = {};
    for (const [index, artist] of (['iara', 'tomas', 'bento'] as const).entries()) {
      const palette = Object.values(DEMO_PALETTES)[index * 2];
      portfolio[artist] = [await webp(ctx, art(index * 11 + 1, palette)), await webp(ctx, art(index * 11 + 5, [...palette].reverse()))];
    }
    const references: Record<string, { storageId: Id<'_storage'>; size: number }> = {};
    const deliveries: Record<string, { original: Id<'_storage'>; preview: Id<'_storage'>; process: Id<'_storage'>[] }[]> = {};
    for (const [index, key] of (Object.keys(DEMO_COMMISSIONS) as DemoCommissionKey[]).entries()) {
      const palette = DEMO_PALETTES[key];
      references[key] = await webp(ctx, art(index * 7 + 3, palette));
      deliveries[key] = [];
      for (let version = 1; version <= (DEMO_DELIVERY_VERSIONS[key] ?? 0); version++) {
        const seed = index * 13 + version * 5;
        const original = await png(art(seed, palette));
        deliveries[key].push({
          original: (await store(ctx, original, 'image/png')).storageId,
          preview: (await store(ctx, await deliveryPreview(toArrayBuffer(original), 'image/png'), 'image/webp')).storageId,
          process: [(await webp(ctx, art(seed, palette, 'sketch'))).storageId, (await webp(ctx, art(seed, palette, 'colour'))).storageId],
        });
      }
    }
    const result: { summary: Record<string, string>; removed: number; detached: number } =
      await ctx.runMutation(internal.demoData.populate, { profiles, users, portfolio, references, deliveries });
    return { createdAccounts: created, removedCommissions: result.removed, detachedCommissions: result.detached,
      reviewerUserId: users.revisor, commissions: result.summary };
  },
});
