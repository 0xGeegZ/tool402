# Production HI-011 and M56 control plan

> **Execution note:** This plan is limited to control and evidence records. It
> does not authorize authority activation, a signature, a transaction, a
> deployment, or a change to application code.

**Goal:** Bind the pending HI-011 and M56 Human Ops flows to the current
Production source and deployment, while preserving separate, non-overlapping
ISSUER and BACKER authority boundaries for the same public wallet.

**Constraints:** Production is `https://tool402.vercel.app`; the local M56
runtime and PID 40487 are out of scope. No environment value, credential,
signature, authority activation, payment, or transaction may be performed or
recorded.

**Verification:** `npm run queue:check`, focused backing and authority
contracts, root lint, `git diff --check`, and the repository reference guard.

## Work items

- [x] Record the exact serving source and Vercel Production deployment, then
  compare it with the formerly approved HI-011 source on the signing/runtime
  boundary.
- [x] Add a fresh, DRAFT-only Production HI-011 decision packet and control
  review that preserve the approved 30-minute ISSUER window and explicitly
  exclude Stage B.
- [x] Amend the M56 backing packet with Production environment attestation,
  the literal BACKER authority tuple, and the one-total-authority sequencing
  rule.
- [x] Update the authoritative Human Ops and HI-011 queue references without
  claiming any human decision or external action has occurred.
- [x] Validate the control records with queue, lint, focused backing/authority
  contracts, and whitespace checks.
- [x] Commit the documentation-only change and open the requested pull request.
