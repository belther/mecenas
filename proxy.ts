import { NextRequest, NextResponse } from 'next/server';
import { convexAuthNextjsProxy } from './lib/server-auth';
export default function proxy(request: NextRequest) {
  if (!process.env.NEXT_PUBLIC_CONVEX_URL) return NextResponse.next();
  return convexAuthNextjsProxy()(request);
}
export const config = { matcher: ['/painel/:path*'] };
