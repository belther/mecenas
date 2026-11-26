import { createHmac, timingSafeEqual } from 'node:crypto';
import { ConvexError } from 'convex/values';

type Status = 'PENDING' | 'PAID' | 'EXPIRED' | 'CANCELLED';
type Charge = {
  providerId: string;
  status: Status;
  amountCents: number;
  pixCode?: string;
  qrImage?: string;
  expiresAt?: number;
};
type Attempt = { reference: string; amountCents: number; providerId?: string };
type Payload = Record<string, unknown>;

// Public verification material published in the provider's webhook security guide.
// https://docs.abacatepay.com/pages/notificacoes/seguranca
export const webhookBodyKey = 't9dXRhHHo3yDEj5pVDYz0frf7q6bMKyMRmxxCPIPp3RCplBfXRxqlC6ZpiWmOqj4L63qEaeUOtrCI8P0VMUgo6iIga2ri9ogaHFs0WIIywSMg0q7RmBfybe1E5XJcfC4IW3alNqym0tXoAKkzvfEjZxV6bE0oG2zJrNNYmUCKZyV0KZ3JS8Votf9EAWWYdiDkMkpbMdPggfh1EqHlVkMiTady6jOR3hyzGEHrIz2Ret0xHKMbiqkr9HS1JhNHDX9';
const statuses = new Set<unknown>(['PENDING', 'PAID', 'EXPIRED', 'CANCELLED']);
const providerIdPattern = /^pix_char_[A-Za-z0-9]{1,100}$/;
const referencePattern = /^mecenas-[0-9a-f-]{36}$/;

function object(value: unknown): Payload | undefined {
  return typeof value === 'object' && value !== null && !Array.isArray(value) ? value as Payload : undefined;
}

function equal(expected: string, received: string) {
  const left = Buffer.from(expected);
  const right = Buffer.from(received);
  return left.length === right.length && timingSafeEqual(left, right);
}

export function testKey(env = process.env) {
  const key = env.ABACATEPAY_API_KEY;
  if (env.ABACATEPAY_TEST_MODE !== 'true' || !key?.startsWith('abc_dev_')) {
    throw new ConvexError('Pix de teste indisponível nesta configuração.');
  }
  return key;
}

export function cpfHash(input: string, env = process.env) {
  const secret = env.MECENAS_CPF_HASH_SECRET;
  const allowed = env.MECENAS_SYNTHETIC_CPF_HASHES;
  if (!secret || secret.length < 32 || !allowed) throw new ConvexError('CPF de teste indisponível.');
  const value = input.trim();
  if (!/^(\d{11}|\d{3}\.\d{3}\.\d{3}-\d{2})$/.test(value)) {
    throw new ConvexError('Informe um CPF fictício autorizado.');
  }
  const digits = value.replace(/\D/g, '');
  const checksum = (length: number) => {
    const sum = [...digits.slice(0, length)].reduce((total, digit, index) => total + Number(digit) * (length + 1 - index), 0);
    return (sum * 10 % 11) % 10;
  };
  if (/^(\d)\1+$/.test(digits) || checksum(9) !== Number(digits[9]) || checksum(10) !== Number(digits[10])) {
    throw new ConvexError('Informe um CPF fictício autorizado.');
  }
  const hash = createHmac('sha256', secret).update(digits).digest('hex');
  if (!allowed.split(',').some(entry => equal(entry.trim(), hash))) throw new ConvexError('Informe um CPF fictício autorizado.');
  return hash;
}

function matchingCharge(value: unknown, attempt: Attempt) {
  const data = object(value);
  if (!data || data.devMode !== true || data.amount !== attempt.amountCents ||
    (data.paidAmount != null && data.paidAmount !== attempt.amountCents) ||
    typeof data.id !== 'string' || !providerIdPattern.test(data.id) ||
    (attempt.providerId && data.id !== attempt.providerId) ||
    object(data.metadata)?.mecenasPaymentRef !== attempt.reference ||
    (data.externalId != null && data.externalId !== attempt.reference)) return null;
  return data;
}

function readCharge(value: unknown, attempt: Attempt): Charge | null {
  const data = matchingCharge(value, attempt);
  if (!data || !statuses.has(data.status)) return null;
  const status = data.status as Status;
  const summary = { providerId: data.id as string, amountCents: attempt.amountCents, status };
  if (status !== 'PENDING') return summary;
  const expiresAt = typeof data.expiresAt === 'string' ? Date.parse(data.expiresAt) : NaN;
  if (!Number.isFinite(expiresAt) || typeof data.brCode !== 'string' || data.brCode.length === 0 || data.brCode.length > 2048 ||
    typeof data.brCodeBase64 !== 'string' || data.brCodeBase64.length > 150000 ||
    !/^data:image\/png;base64,[A-Za-z0-9+/]+=*$/.test(data.brCodeBase64)) return null;
  return { ...summary, expiresAt, pixCode: data.brCode, qrImage: data.brCodeBase64 };
}

function request(key: string, route: 'create' | 'list' | 'refund', options: { params?: Record<string, string>; body?: object }) {
  const url = new URL(`https://api.abacatepay.com/v2/transparents/${route}`);
  url.search = new URLSearchParams(options.params).toString();
  return fetch(url, {
    method: options.body ? 'POST' : 'GET', redirect: 'error',
    headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
    ...(options.body ? { body: JSON.stringify(options.body) } : {}),
    signal: AbortSignal.timeout(12000),
  });
}

export async function createCharge(key: string, attempt: Attempt) {
  const response = await request(key, 'create', { body: { method: 'PIX', data: {
    amount: attempt.amountCents, externalId: attempt.reference, description: 'Mecenas teste',
    expiresIn: 900, metadata: { mecenasPaymentRef: attempt.reference }, passFeesToCustomer: false,
  } } });
  const envelope = object(await response.json());
  // Only documented validation failures establish that creation never began.
  const error = typeof envelope?.error === 'string' ? envelope.error : object(envelope?.error)?.message;
  if (response.status === 400 && envelope?.success === false &&
    (error === 'PIX is not available for this store' || error === 'expiresIn must be at least 300 seconds')) {
    return { rejected: true, charge: null };
  }
  return { rejected: false, charge: response.ok && envelope?.success === true ? readCharge(envelope.data, attempt) : null };
}

async function canonicalCharge(key: string, attempt: Attempt) {
  const match: Record<string, string> = attempt.providerId ? { id: attempt.providerId } : { externalId: attempt.reference };
  const response = await request(key, 'list', { params: { method: 'PIX_QRCODE', limit: '2', ...match } });
  if (!response.ok) throw new Error('Sandbox lookup unavailable.');
  const envelope = object(await response.json());
  if (envelope?.success !== true || !Array.isArray(envelope.data)) throw new Error('Sandbox lookup unavailable.');
  return envelope.data.length === 1 && object(envelope.pagination)?.hasMore !== true
    ? matchingCharge(envelope.data[0], attempt) : null;
}

export async function lookupCharge(key: string, attempt: Attempt) {
  return readCharge(await canonicalCharge(key, attempt), attempt);
}

export async function settlementStatus(key: string, attempt: Attempt) {
  const charge = await canonicalCharge(key, attempt);
  return charge?.status === 'PAID' || charge?.status === 'REFUNDED' ? charge.status : null;
}

export async function reconcileRefund(attempt: Attempt, reserveSubmission: () => Promise<boolean>,
  recordRefusal: () => Promise<void>) {
  if (!attempt.providerId) return false;
  const key = testKey();
  const before = await canonicalCharge(key, attempt);
  if (before?.status === 'REFUNDED') return true;
  if (before?.status !== 'PAID' || !await reserveSubmission()) return false;
  try {
    const response = await request(key, 'refund', { body: { id: attempt.providerId, reason: 'Decisão de revisão da encomenda de teste' } });
    if (response.status === 400) {
      const body = object(await response.json());
      if (body?.success === false && body.error === 'Saldo insuficiente para realizar o reembolso.') await recordRefusal();
    }
  } catch {
    // A lost response can follow a successful refund. Always check the charge again.
  }
  return (await canonicalCharge(key, attempt))?.status === 'REFUNDED';
}

export function validateDelivery(raw: ArrayBuffer, secret: string, signature: string, expected = process.env.ABACATEPAY_WEBHOOK_SECRET) {
  if (!expected || expected.length < 32 || !equal(expected, secret)) return false;
  const signed = createHmac('sha256', webhookBodyKey).update(Buffer.from(raw)).digest('base64');
  return equal(signed, signature);
}

export function settlementEvent(raw: ArrayBuffer) {
  const event = object(JSON.parse(new TextDecoder().decode(raw)));
  const transparent = object(object(event?.data)?.transparent);
  const refunded = event?.event === 'transparent.refunded';
  if (!event || (!refunded && event.event !== 'transparent.completed') || event.apiVersion !== 2 || event.devMode !== true ||
    typeof event.id !== 'string' || !/^log_[A-Za-z0-9_-]{1,120}$/.test(event.id) ||
    typeof transparent?.id !== 'string' || !providerIdPattern.test(transparent.id) || transparent.status !== (refunded ? 'REFUNDED' : 'PAID') ||
    transparent.devMode !== true || !Number.isSafeInteger(transparent.amount)) return null;
  const reference = object(transparent.metadata)?.mecenasPaymentRef;
  return { refunded, eventId: event.id, providerId: transparent.id, amountCents: transparent.amount,
    reference: typeof reference === 'string' && referencePattern.test(reference) ? reference : undefined };
}
