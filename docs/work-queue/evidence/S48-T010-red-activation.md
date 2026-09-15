# S48-T010 RED activation

At ready source `b1c4d99542a243a4a59fff467274c2261ebe9572`, the root activates
only these focused test files for S48:

- `apps/web/tests/product-landing.test.mjs`
- `apps/web/tests/public-landing-reconciliation.test.mjs`

The hero, sections, footer, and layout metadata remain frozen. The S26 header
and shell-wrapper reservation in `layout.tsx` remains excluded. The next
permitted action is a test-only contract that fails because the approved
message is not yet rendered.
