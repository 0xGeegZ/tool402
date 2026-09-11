# S38-T010 durable RED review

## Scope

Independent review of the durable RED contract at
`5a7ca33bd23e3877f77798a8b3490d643eb9a154`, following its test-only activation.

## Review

- The committed RED scope contains only
  `apps/web/tests/dashboard-auth.test.mjs` and
  `apps/web/tests/dashboard-auth-routes.test.mjs`; no production source,
  existing reconciliation assertion, queue record, package, or lockfile changed.
- Node 22.21.1 focused RED reports exactly one source-absence failure listing
  all eight declared S38 source paths and twenty staged contracts skipped. No
  unrelated failure appears.
- The contracts cover the fixed core exports, lower-case address, nonce,
  challenge/session timing, HMAC seam and envelope tampering, exact message,
  signature grammar, generic rejection, success session cookie, strict
  same-origin/exact-body/content-type validation, challenge clearing on every
  rejected verify path, POST-only routes, client sign-in boundary, sign-in page,
  and server dashboard redirect.
- Two independent review rounds cleared all P1 findings. The final correction
  is limited to requiring challenge-cookie clearing on malformed or
  origin-invalid verification requests.

## Verdict

CLEAR — the durable RED contract is accepted. S38 may implement only its eight
declared production source paths and the root-reserved dashboard eyebrow plus
two matching wording assertions, in the plan's staged order. Every other path
and every configuration/environment value, real wallet account request or
signature, provider command, relay, transaction, payment, deployment, and live
action remains prohibited.
