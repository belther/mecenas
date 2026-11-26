# Initial test design freeze

2026-11-23 (America/Sao_Paulo) · Codex

- The restricted designer received only the specification and synthetic
  interface contract. [Independent design](initial-design.json) contains 18
  cases. SHA-256 `475662c4ad7adebff442732079e3880cee07cbc77645eba715a1be1bf4880ab4`.
- The conductor translated the central cases into `tests/deliveries.test.ts`
  before changing application code. Frozen test SHA-256
  `56e5ca643b766d99360234875d555d1db516bacd564c8175bcc5539c2a15ad3e`.
- The conductor ran `node node_modules/vitest/vitest.mjs run tests/deliveries.test.ts -t "a funded offer supports"`.
  The fixture reached the actual funded payment view. The next assertion
  expected `ready` at version 0 and received no delivery capability. One test
  failed at the assertion, three were outside the focused run. Red log SHA-256
  `94d5fc1a66231496bf1784fa5eea556a181da63c90bcb25529ae9c2929a6a64a`.
- Designer events SHA-256 `a1f670279b43d6927538189625334db4562ff7f7e312c3ae079d8132daf9d274`.
  Recorded usage was 42,347 input tokens, including 20,352 cached, and 1,984
  output tokens. Actual charges and allowance consumption are unavailable.
