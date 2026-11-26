import { setupConvexAuth } from '@convex-dev/auth/server';
import { setupUsernamePassword } from '@convex-dev/auth/methods/username-password/server';
import { components, internal } from './_generated/api';
import { mutation, type MutationCtx } from './_generated/server';
import { ConvexError, v } from 'convex/values';
import type { SignUpResult } from '@convex-dev/auth/methods/username-password/server';
const auth = setupConvexAuth({ component: components.auth });
export const { signOut, refreshSession, isAuthenticated } = auth;
const method = setupUsernamePassword(auth, {
  component: components.authPassword, usernameComponent: components.authUsername,
}).attachUserCallbacks({ createUser: internal.users.createUser });
export const { signInWithUsernamePassword } = method;
// Closed by default. Only explicitly configured synthetic usernames can enroll.
// The library exposes a registered mutation, so this adapter uses its typed
// handler to retain the library's transactional password/session implementation.
// Convex's runtime has _handler but its published declaration omits it. Keep
// this compatibility seam narrow and covered by real signup/session tests.
const signupHandler = (method.signUpWithUsernamePassword as unknown as {
  _handler: (ctx: MutationCtx, args: { username: string; password: string }) => Promise<SignUpResult>;
})._handler;
export const signUpWithUsernamePassword = mutation({
  args: { username: v.string(), password: v.string() },
  handler: async (ctx, args): Promise<SignUpResult> => {
    const allowed = (process.env.MECENAS_DEMO_USERNAMES || '').split(',').map(value => value.trim()).filter(Boolean);
    if (!allowed.includes(args.username)) throw new ConvexError('Cadastro restrito às contas fictícias autorizadas para esta demonstração.');
    return signupHandler(ctx, args);
  },
});
// Iteration 007: lets the administrator-only demo seed create its synthetic accounts
// through the same password implementation, without opening public registration.
export async function createDemoAccount(ctx: MutationCtx, username: string, password: string): Promise<string> {
  const result = await signupHandler(ctx, { username, password });
  if (result.status !== 'complete') throw new ConvexError(`Conta de demonstração recusada: ${result.userError.error}`);
  return result.tokens.userId;
}
