import { setupConvexAuthServer } from '@convex-dev/auth/ssr';
import { setupConvexAuthNextjs } from '@convex-dev/auth/ssr/nextjs';
import { api } from '../convex/_generated/api';

// The fallback lets the unconfigured app build and show setup instructions.
// Auth routes explicitly refuse requests until a deployment is configured.
const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL || 'https://unconfigured.convex.cloud';
export const auth = setupConvexAuthServer({
  convexUrl,
  refreshSession: api.auth.refreshSession,
  signOut: api.auth.signOut,
  signIn: [api.auth.signInWithUsernamePassword, api.auth.signUpWithUsernamePassword],
  cookieOptions: { secure: process.env.NODE_ENV === 'production' },
});
export const { ConvexAuthNextjsServerProvider, convexAuthNextjsProxy } = setupConvexAuthNextjs({
  convexUrl, refreshSession: api.auth.refreshSession, isAuthenticated: api.auth.isAuthenticated,
});
export function configured(handler: (request: Request) => Promise<Response>) {
  return (request: Request) => process.env.NEXT_PUBLIC_CONVEX_URL
    ? handler(request)
    : Promise.resolve(Response.json({ error: 'Backend não configurado.' }, { status: 503 }));
}
