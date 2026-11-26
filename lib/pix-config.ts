// Iteration 009: tells the app, without calling the provider, whether the sandbox Pix can run here.
// Production keeps payments off (Nabo, 2026-11-26), so the client sees a note instead of an error.
type Env = Record<string, string | undefined>;

/** The sandbox key, or undefined when test mode or a sandbox key is missing. Shared with lib/pix-provider.ts. */
export function sandboxKey(env: Env = process.env) {
  const key = env.ABACATEPAY_API_KEY;
  return env.ABACATEPAY_TEST_MODE === 'true' && key?.startsWith('abc_dev_') ? key : undefined;
}

/** Synthetic CPF settings, with the same rule lib/pix-provider.ts cpfHash enforces. */
export function cpfSettings(env: Env = process.env) {
  const secret = env.MECENAS_CPF_HASH_SECRET;
  const allowed = env.MECENAS_SYNTHETIC_CPF_HASHES;
  return secret && secret.length >= 32 && allowed ? { secret, allowed } : undefined;
}

export function pixConfigured(env: Env = process.env) {
  return !!sandboxKey(env) && !!env.ABACATEPAY_WEBHOOK_SECRET && !!cpfSettings(env);
}

export const PIX_UNAVAILABLE = 'Pix de teste não configurado nesta demonstração. Com as chaves de sandbox da AbacatePay, o cliente gera o Pix aqui. As encomendas em avaliação, aprovada e contestada mostram as etapas seguintes com pagamentos de demonstração.';
