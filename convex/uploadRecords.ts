import { internalMutation, internalQuery } from './_generated/server';
import { v } from 'convex/values';
import { fail } from './lib/access';
import { getAuthUserId } from '@convex-dev/auth/server';
const purpose = v.union(v.literal('portfolio'), v.literal('reference'));
export const authorize = internalQuery({ args: { userId: v.id('users'), purpose }, handler: async (ctx, args) => {
  const p = await ctx.db.query('profiles').withIndex('by_user', q => q.eq('userId', args.userId)).unique();
  if (!p || p.role !== (args.purpose === 'portfolio' ? 'artist' : 'client')) fail('Seu perfil não pode enviar esta imagem.');
  return null;
} });
export const register = internalMutation({ args: { userId: v.id('users'), storageId: v.id('_storage'), purpose, contentType: v.string(), size: v.number() }, handler: async (ctx, args) => {
  const p = await ctx.db.query('profiles').withIndex('by_user', q => q.eq('userId', args.userId)).unique();
  if (!p || p.role !== (args.purpose === 'portfolio' ? 'artist' : 'client')) fail('Seu perfil não pode enviar esta imagem.');
  return ctx.db.insert('uploads', args);
} });
export const preview = internalQuery({ args: { userId: v.id('users'), id: v.id('uploads') }, handler: async (ctx, args) => {
  const upload = await ctx.db.get(args.id); if (!upload || upload.userId !== args.userId) fail('Imagem indisponível.');
  return ctx.storage.getUrl(upload.storageId);
} });
export const currentUser = internalQuery({ args: {}, handler: ctx => getAuthUserId(ctx) });
