# M51-T010 — World issuer Selfie Check

## State

- Tier: CORE_P0
- Queue state: 20-active
- Dependencies: M41-T010, S15-T010, S16-T010, and S21-T010 accepted. M49-T010
  is historical deploy-browser context, not a queue dependency because it has
  no current catalog record.
- Owner: Root owns the queue records, implementation, reviews, commits, and
  draft PR under the explicitly authorised World Sandbox configuration.
- Human actions: World relying party and the `issuer-publish` action are
  configured. Selfie Check Sandbox feature enablement and a Sandbox proof
  remain externally controlled.

## Scope

The provider deploy flow needs a low-friction signal that a live human is
behind the issuer before Tool402 forwards the existing directory publication
command. The local [M51 specification](../../../specs/m51-world-issuer-selfie-check.md)
fixes the server-only configuration, proof request/verification boundary,
short-lived cookie gate, current publication-only scope, UI, and demo evidence.

## Active GREEN requirements

- D-M51-010-002 accepts durable RED `676cf507fad6d7c3ed7e726b38c7851aaea81324`
  and authorizes only the declared World source, package pin, submission
  feedback, and matching tests.
- D-M51-010-006 corrects the configured IDKit environment from `staging` to
  `sandbox`, as required by the official mobile Sandbox flow.
- The implementation must reject any non-sandbox/action-drift configuration,
  bind the verified browser session to the current wallet, and keep stage four
  unavailable until verification.
- No completed World Sandbox proof, production action, KYC/identity claim, wallet
  permission, transaction, deployment, or live authority is part of GREEN.

## Proposed paths

- `apps/web/package.json`, root `package-lock.json`
- `apps/web/src/lib/world/issuer-selfie-check.ts`
- `apps/web/src/app/api/world/request/route.ts`
- `apps/web/src/app/api/world/verify/route.ts`
- `apps/web/src/components/provider/deploy/world-issuer-verification.tsx`
- Root integration reservations in `apps/web/src/lib/wallet/command-relay.ts`
  and `apps/web/src/components/provider/deploy/deploy-stage-signing.tsx`
- `apps/web/tests/world-issuer-selfie-check.test.mjs`, plus narrow assertions
  in the established command and signing-island tests
- `docs/submission/world-selfie-check-feedback.md`

## Verification

Durable RED precedes source. Focused Web, typecheck, full Web/root quality,
queue/local-reference checks, desktop and 390px browser checks, World Sandbox
exercise when enabled, and independent task/module review are required before
the card can move to `60-done`.
