import { auth, configured } from '../../../lib/server-auth';
export const POST = configured(auth.convexProxyHandler);
