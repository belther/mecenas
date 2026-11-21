import test from "node:test";
import assert from "node:assert/strict";
import { requireSandbox, classifyReversal, runProbe } from "./abacatepay-probe.mjs";

test("production, missing and opt-out keys are rejected before any network call", async () => {
  for (const env of [{}, { ABACATEPAY_TEST_MODE: "true", ABACATEPAY_API_KEY: "abc_prod_fake" }, { ABACATEPAY_TEST_MODE: "false", ABACATEPAY_API_KEY: "abc_dev_fake" }]) {
    assert.throws(() => requireSandbox(env), /Blocked/);
    const result = await runProbe(env, () => { assert.fail("Network must not be called"); });
    assert.equal(result.status, "blocked");
    assert.equal(result.b.result, "not-run");
  }
});

test("balance evidence distinguishes reversal, retained split and unrelated movement", () => {
  assert.equal(classifyReversal(100, 5100, 100), "reversed");
  assert.equal(classifyReversal(100, 5100, 5100), "not-reversed");
  assert.equal(classifyReversal(100, 100, 100), "inconclusive");
  assert.equal(classifyReversal(100, 5100, 4900), "inconclusive");
  assert.equal(classifyReversal(undefined, 5100, 100), "inconclusive");
});
