import { getAuthUserId } from '@convex-dev/auth/server';
import { ConvexError } from 'convex/values';
import type { QueryCtx, MutationCtx } from '../_generated/server';
import type { Id } from '../_generated/dataModel';
type Ctx = QueryCtx | MutationCtx;
export function fail(message: string): never { throw new ConvexError(message); }
export async function requireUser(ctx: Ctx) {
  const id = await getAuthUserId(ctx);
  if (!id) fail('Entre na sua conta para continuar.');
  return id;
}
export async function requireProfile(ctx: Ctx, role?: 'artist' | 'client') {
  const id = await requireUser(ctx);
  const profile = await ctx.db.query('profiles').withIndex('by_user', q => q.eq('userId', id)).unique();
  if (!profile) fail('Complete seu perfil primeiro.');
  if (role && profile.role !== role) fail('Seu perfil não pode executar esta ação.');
  return profile;
}
export function text(value: string, min: number, max: number, label: string) {
  const trimmed = value.trim();
  if (trimmed.length < min || trimmed.length > max) fail(`${label}: use de ${min} a ${max} caracteres.`);
  return trimmed;
}
export function validateRequest(value: { title: string; description: string; pricePerArtistCents: number; artistSlots: number }) {
  if (!Number.isSafeInteger(value.pricePerArtistCents) || value.pricePerArtistCents < 100 || value.pricePerArtistCents > 100000000) fail('Informe um valor por artista entre R$ 1,00 e R$ 1.000.000,00, sem frações de centavo.');
  if (!Number.isInteger(value.artistSlots) || value.artistSlots < 1 || value.artistSlots > 10) fail('Escolha de 1 a 10 artistas.');
  return { title: text(value.title, 5, 120, 'Título'), description: text(value.description, 20, 3000, 'Descrição'), pricePerArtistCents: value.pricePerArtistCents, artistSlots: value.artistSlots };
}
export async function ownedUploads(ctx: Ctx, ids: Id<'uploads'>[], userId: Id<'users'>, purpose: 'portfolio' | 'reference') {
  if (ids.length > (purpose === 'portfolio' ? 6 : 4) || new Set(ids).size !== ids.length) fail('Limite de imagens excedido ou imagem repetida.');
  const uploads = await Promise.all(ids.map(id => ctx.db.get(id)));
  if (uploads.some(upload => !upload || upload.userId !== userId || upload.purpose !== purpose)) fail('Imagem indisponível para este perfil ou finalidade.');
  return uploads.map(upload => upload!);
}
