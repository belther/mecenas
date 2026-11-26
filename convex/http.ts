import { httpRouter } from 'convex/server';
import { httpAction } from './_generated/server';
import { internal } from './_generated/api';

const http = httpRouter();
http.route({
  path: '/webhooks/abacatepay',
  method: 'POST',
  handler: httpAction(async (ctx, request) => {
    const maxBytes = 64 * 1024;
    if (Number(request.headers.get('content-length')) > maxBytes) return new Response(null, { status: 413 });
    const raw = await request.arrayBuffer();
    if (raw.byteLength > maxBytes) return new Response(null, { status: 413 });
    const status: number = await ctx.runAction(internal.pix.receive, {
      raw,
      secret: request.headers.get('X-Webhook-Secret') ?? new URL(request.url).searchParams.get('webhookSecret') ?? '',
      signature: request.headers.get('X-Webhook-Signature') ?? '',
    });
    return new Response(null, { status });
  }),
});

export default http;
