import { defineConfig } from 'vitest/config';
import { readFileSync } from 'node:fs';
export default defineConfig({
  // Convex imports WASM as a compiled Module. Reproduce that loader in Node
  // without substituting or mocking the password hashing implementation.
  plugins: [{ name: 'convex-wasm', enforce: 'pre', load(id) {
    if (id.endsWith('.wasm')) return `export default new WebAssembly.Module(Uint8Array.from(atob('${readFileSync(id).toString('base64')}'), c => c.charCodeAt(0)));`;
  } }],
  test: { include: ['tests/**/*.test.ts'], environment: 'node', testTimeout: 20000, server: { deps: { inline: ['password-hash-wasm'] } } },
});
