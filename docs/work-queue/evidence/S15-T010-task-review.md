# S15-T010 task review

## Scope

Independent task review at pushed `01100594fed9f0286d401b7dcaaf354dcd504cfe`,
including the remediation source commit
`506f038fffb87739cc5fd302a30033b5c56d36ee` and its recorded build-shape
correction.

The review covers the local [S15 control card](../queue/20-active/S15-T010-metamask-wallet-island.md)
and [UI-S15 manifest](../../ui/UI-S15.md). It uses source and test fakes only:
no environment file, wallet/provider session, relay configuration, external
route, account, transaction, deployment, or live action was accessed.

## Review

- Provider selection accepts the legacy MetaMask provider only when no matching
  EIP-6963 MetaMask candidate exists; unrelated announcements do not suppress
  that fallback, while multiple matching candidates still fail closed.
- The relay rejects every type other than literal `external.prepare` before it
  reads a provider, draws a nonce, requests a signature, or sends a relay body.
- The command builder binds its expiry to the canonical detached payload bytes.
  Returned signatures must be lower-case, 65-byte, low-s secp256k1 values with
  an approved recovery suffix; an accepted wire suffix is preserved.
- The route exports only `POST`, retains the server-only relay handoff, and no
  longer violates Next route-module export rules.
- The changed code introduces no configuration read outside the existing route,
  no provider at module load, no automatic retry, and no new external or wallet
  capability.

## Verification

Under Node 22.21.1:

- focused S15 suite: 56/56 passed;
- Webpack production build with Cache Components passed and lists
  `/api/commands` as dynamic;
- root typecheck, test, lint, and queue check passed; and
- whitespace and the enabled local-reference guard passed before each commit.

The default Turbopack build remains host-blocked while its CSS helper attempts
an internal port bind. The equivalent Webpack production build passed after the
route correction. Its only warning is the pre-existing optional
`@x402/paywall` resolution warning from the unrelated RiskScan x402 import.

## Verdict

CLEAR — no Critical, Important, or Minor finding. S15 may proceed to its fresh
module review. Its historical source chronology remains recorded accurately;
this verdict grants no configuration, provider, wallet, relay, transaction,
deployment, or live action.
