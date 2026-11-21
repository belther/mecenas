import { mkdir, writeFile } from "node:fs/promises";
import { pathToFileURL } from "node:url";

const BASE = "https://api.abacatepay.com/v2";
const SYNTHETIC_CPF = "11144477735"; // Provider's documented example, sandbox only.

export function requireSandbox(env) {
  if (env.ABACATEPAY_TEST_MODE !== "true" || !env.ABACATEPAY_API_KEY?.startsWith("abc_dev_")) {
    throw new Error("Blocked: set ABACATEPAY_TEST_MODE=true and a sandbox abc_dev_ key in .env.local.");
  }
  return env.ABACATEPAY_API_KEY;
}

export function classifyReversal(before, paid, refunded) {
  if (![before, paid, refunded].every(Number.isSafeInteger) || paid - before !== 5000) return "inconclusive";
  if (refunded === before) return "reversed";
  if (refunded === paid) return "not-reversed";
  return "inconclusive";
}

export async function runProbe(env = process.env, fetcher = fetch) {
  const report = {
    checkedAt: new Date().toISOString(), mode: "sandbox", status: "blocked",
    a: { result: "unverified", reason: "Withdrawals are production-only. Sandbox and one API credential cannot prove absence of external seller access." },
    b: { result: "not-run", documentation: "Provider states refunds debit the platform; credited subaccount split does not reverse automatically." },
    sources: ["https://docs.abacatepay.com/pages/dinheiro/subcontas-e-split", "https://docs.abacatepay.com/pages/comecar/modo-teste"],
    steps: [],
  };
  try {
    const key = requireSandbox(env);
    if (!process.argv.includes("--execute")) throw new Error("Dry run: add --execute to create synthetic sandbox records, simulate a Pix payment and request its refund. No withdrawals are called.");
    async function request(path, body, allowNoDevMode = false) {
      const response = await fetcher(`${BASE}${path}`, {
        method: body ? "POST" : "GET",
        headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
        ...(body ? { body: JSON.stringify(body) } : {}),
        signal: AbortSignal.timeout(20000),
      });
      // Never persist raw responses: they can contain personal data or payment artifacts.
      const json = await response.json();
      if (!response.ok || json.success !== true || !json.data) {
        throw new Error(`Provider rejected ${path.split("?")[0]} (HTTP ${response.status}); check sandbox permissions, feature enablement and refund balance in dashboard.`);
      }
      if ((!allowNoDevMode && json.data.devMode !== true) || json.data.devMode === false) {
        throw new Error("Blocked: provider resource did not confirm sandbox devMode=true.");
      }
      report.steps.push({ route: path.split("?")[0], httpStatus: response.status });
      return json.data;
    }
    const sub = await request("/sub-accounts/create", { name: "Artista Sintetico Mecenas", taxId: SYNTHETIC_CPF, externalId: "mecenas-sandbox-artist-01" });
    if (!/^sacc_[A-Za-z0-9]+$/.test(sub.id)) throw new Error("Unexpected subaccount ID.");
    const balance = async () => {
      const data = await request(`/sub-accounts/get?id=${encodeURIComponent(sub.id)}`);
      const total = data.balance?.available + data.balance?.blocked;
      if (!Number.isSafeInteger(total)) throw new Error("Unexpected balance response.");
      return total;
    };
    const before = await balance();
    const charge = await request("/transparents/create", { method: "PIX", data: {
      amount: 10000, description: "Mecenas sandbox split refund probe", externalId: `mecenas-probe-${crypto.randomUUID()}`,
      splits: [{ subAccountId: sub.id, amount: 5000 }],
    } });
    if (!/^pix_char_[A-Za-z0-9]+$/.test(charge.id)) throw new Error("Unexpected Pix ID.");
    // IDs retained locally allow manual recovery after timeout; never automatically retry money mutations.
    report.sandboxChargeId = charge.id;
    report.sandboxSubaccountId = sub.id;
    await request(`/transparents/simulate-payment?id=${encodeURIComponent(charge.id)}`, {});
    const paid = await balance();
    await request("/transparents/refund", { id: charge.id, reason: "Synthetic sandbox split reversal verification" }, true);
    const refunded = await balance();
    report.b = { ...report.b, result: classifyReversal(before, paid, refunded), balancesCents: { before, paid, refunded }, reason: "Single immediate balance observation; unexpected deltas require follow-up, not a pass." };
    report.status = "observed";
  } catch (error) {
    report.blocker = error instanceof Error ? error.message : "Unknown probe failure";
  }
  return report;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const report = await runProbe();
  await mkdir("local-evidence", { recursive: true });
  const path = `local-evidence/abacatepay-${Date.now()}.json`;
  await writeFile(path, JSON.stringify(report, null, 2));
  console.log(JSON.stringify(report, null, 2));
  console.log(`Local evidence: ${path}. Review and summarize in SPEC section 6; do not commit raw account evidence.`);
  if (report.status === "blocked" || report.b.result === "inconclusive") process.exitCode = 1;
}
