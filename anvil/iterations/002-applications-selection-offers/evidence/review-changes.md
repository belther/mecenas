# Repairs from the independent review

2026-11-23 (America/Sao_Paulo) · Codex

1. Profile navigation now asks before discarding a client review draft. The
   warning uses the same draft lifetime as the browser's unload protection.
2. A completed artist application focuses its result after the action leaves
   the page. A saved result from another session does not move local focus.
3. Added deterministic owner-first and artist-first outcomes for acceptance
   and decline. Existing concurrent-call tests retain their assertions and
   document that convex-test serializes top-level transactions. Separate
   direct calls against the development service check concurrent outcomes.
4. Added test-only injected failures after the decline write and on the
   second offer insert. Both tests verify unchanged state, then a single
   successful retry. The original nested-transaction rollback check remains.
5. Added the ten-slot boundary test. Existing test files, test discovery and
   thresholds remain byte-identical. The initial exact-shape assertion was
   corrected to include the specification's permitted blank bio. It still
   rejects unexpected fields.

The native adversarial reviewer could start Node, but the Node entry point
could not traverse the filesystem root. No adversarial-worker runtime test
ran. The conductor ran the synthetic suite and browser checks independently
of that execution attempt.
