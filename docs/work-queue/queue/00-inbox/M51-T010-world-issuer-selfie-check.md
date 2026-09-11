# M51-T010 — World issuer Selfie Check

## State

- Tier: CORE_P0
- Queue state: 00-inbox
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

## Candidate ready requirements

- The card, specification, catalog, ownership, and state records are committed
  before the RED contract or source.
- The declared World paths are absent and disjoint from every active lane.
- Existing command relay and provider signing paths receive a root integration
  reservation; their established behaviours must remain covered by their
  existing tests.
- The World package version is pinned in the Web manifest and lockfile.

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
