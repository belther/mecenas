// Fills a Convex DEVELOPMENT deployment with the iteration 007 synthetic demo data.
// Usage: npm run demo:seed   (after `npx convex dev` has configured .env.local)
// The demo password comes from MECENAS_DEMO_PASSWORD, or from the ignored file .env.demo,
// which this script creates with a random value on the first run. It is never printed.
import { spawnSync } from 'node:child_process';
import { randomBytes } from 'node:crypto';
import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseEnv } from 'node:util';

export const DEMO_FILE = '.env.demo';

/** Only development or local deployments may receive demo data (production needs separate approval). */
export function checkTarget(deployment) {
  const name = (deployment || '').split(/\s+/)[0];
  if (!/^(dev|local):[\w-]+$/.test(name)) {
    throw new Error('Demo data goes only to a development deployment. Set CONVEX_DEPLOYMENT=dev:<name> in .env.local (run `npx convex dev`).');
  }
  return name;
}

/** A deploy key or self-hosted setting could override CONVEX_DEPLOYMENT, so only dev keys are accepted. */
export function checkOverrides(...sources) {
  for (const env of sources) {
    const key = env.CONVEX_DEPLOY_KEY;
    if (key && !/^(dev|preview):/.test(key)) throw new Error('Remove the non-development CONVEX_DEPLOY_KEY before seeding demo data.');
    if (env.CONVEX_SELF_HOSTED_URL || env.CONVEX_SELF_HOSTED_ADMIN_KEY) throw new Error('Self-hosted Convex settings are not supported by the demo seed.');
  }
}

export function demoPassword(env, file = DEMO_FILE, fs = { existsSync, readFileSync, writeFileSync }) {
  let password = env.MECENAS_DEMO_PASSWORD;
  if (!password && fs.existsSync(file)) password = parseEnv(fs.readFileSync(file, 'utf8')).MECENAS_DEMO_PASSWORD;
  if (!password) {
    password = randomBytes(15).toString('base64url');
    fs.writeFileSync(file, `# Ignored by Git. Synthetic demo accounts only.\nMECENAS_DEMO_PASSWORD=${password}\n`);
  }
  if (password.length < 12) throw new Error('MECENAS_DEMO_PASSWORD must have at least 12 characters.');
  return password;
}

function main() {
  const local = existsSync('.env.local') ? parseEnv(readFileSync('.env.local', 'utf8')) : {};
  const deployment = checkTarget(process.env.CONVEX_DEPLOYMENT || local.CONVEX_DEPLOYMENT);
  checkOverrides(process.env, local);
  const password = demoPassword(process.env);
  // A deploy key in the environment would override the target, so the child gets only the dev name.
  const dir = mkdtempSync(join(tmpdir(), 'mecenas-demo-'));
  const envFile = join(dir, 'target.env');
  writeFileSync(envFile, `CONVEX_DEPLOYMENT=${deployment}\n`);
  const env = { ...process.env };
  for (const key of ['CONVEX_DEPLOYMENT', 'CONVEX_DEPLOY_KEY', 'CONVEX_SELF_HOSTED_URL', 'CONVEX_SELF_HOSTED_ADMIN_KEY', 'MECENAS_DEMO_PASSWORD']) delete env[key];
  try {
    const result = spawnSync(process.execPath, ['node_modules/convex/bin/main.js', 'run', 'demoSeed:run',
      JSON.stringify({ password }), '--env-file', envFile], { env, encoding: 'utf8', timeout: 180000 });
    const clean = text => (text || '').replaceAll(password, '[demo password]');
    process.stderr.write(clean(result.stderr));
    if (result.status !== 0) { process.stdout.write(clean(result.stdout)); process.exitCode = result.status ?? 1; return; }
    const summary = JSON.parse(clean(result.stdout));
    console.log(`Demo data ready on ${deployment}.`);
    console.log(JSON.stringify(summary.commissions, null, 2));
    if (summary.detachedCommissions) console.log(`${summary.detachedCommissions} earlier demo commission(s) held real data and were kept as ordinary commissions.`);
    console.log(`Accounts: demo-cliente, demo-artista-iara, demo-artista-tomas, demo-artista-bento, demo-revisor. Password: ${DEMO_FILE}.`);
    console.log(`To enable the platform review screen for demo-revisor, run:\n  npx convex env set MECENAS_REVIEWER_USER_ID ${summary.reviewerUserId}`);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  try { main(); } catch (error) { console.error(error.message); process.exitCode = 1; }
}
