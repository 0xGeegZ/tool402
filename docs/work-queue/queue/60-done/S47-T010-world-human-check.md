# S47-T010 — World human check on the dashboard

## State

- Tier: PRIZE_OPTIONAL
- Queue state: 60-done
- Dependencies: none. S40-T010 acceptance is the activation gate for this
  card, not a catalog dependency: the card reads the signed dashboard session
  S40 establishes, so it cannot be activated before S40 is accepted, but it
  declares no accepted predecessor while it sits in the inbox.
- Owner: The root owns queue state, catalog, ownership, decisions, reviews,
  commits, and pushes. The proposed implementation paths are exactly these new
  files: `docs/specs/s47-world-human-check.md`,
  `docs/submission/world-selfie-check-feedback.md`,
  `apps/web/tests/world-human-check.test.mjs`,
  `apps/web/src/lib/world/human-check.ts`,
  `apps/web/src/app/api/world/request/route.ts`,
  `apps/web/src/app/api/world/verify/route.ts`,
  `apps/web/src/components/dashboard/world-human-check.tsx`, and
  `apps/web/src/components/dashboard/dashboard-identity.tsx`; and exactly these
  amended files, each under a root integration reservation:
  `apps/web/src/app/dashboard/page.tsx` limited to mounting
  `<DashboardIdentity />` once between the page header and
  `<DashboardCampaign />`, `apps/web/package.json` and the root
  `package-lock.json` limited to adding `@worldcoin/idkit`,
  `apps/web/tests/static-shell.test.mjs` limited to the matching dependency
  literal, `apps/web/.env.example` limited to appending the five `WORLD_*`
  names with empty values, and this card, the catalog row, and the
  specification.
- Human actions: three, all external and all human-owned.
  `WORLD_RP_SIGNING_KEY` must be copied from the Developer Portal into the
  ignored local `apps/web/.env.local` and mirrored into the Vercel project
  environment; the key is never printed, committed, or pasted into a session.
  A physical phone with the Sandbox World App installed is required, because
  Sandbox has no simulator path. One human-run Sandbox Selfie Check must then
  be exercised end to end and recorded as `HA-WORLD-SELFIE-001` evidence. Until
  that record exists, no end-to-end proof is claimed anywhere in this slice.

## Scope

Add a "Your identity" card to the signed dashboard that states plainly what
each of the two signals proves: MetaMask proves control of the Hedera Testnet
account, and a World Selfie Check proves a live human holds it. The World row
has three states — unverified, verified, unavailable — and only the unverified
state mounts a client component.

The check is browser-scoped. A success sets one MACed, address-bound,
HttpOnly cookie for 30 days and nothing else. No proof, nullifier, or World
identifier is stored, in the browser or on the server. The fixed contract is
[the S47 specification](../../../specs/s47-world-human-check.md), and the
required prize-track integration feedback is
[the World Selfie Check feedback document](../../../submission/world-selfie-check-feedback.md),
which states in its own words that an end-to-end Sandbox proof is not claimed
until the human exercise above is recorded.

Requested by the human operator on 2026-09-12. The approved design canvas that
settled the layout and every fixed literal is
https://claude.ai/code/artifact/a1a3bb7b-0bb3-4817-8205-738b1da27e60. The card
follows the existing dashboard campaign card's Card/CardContent anatomy rather
than introducing a new surface shape.

The copy rules are part of the scope, not a style preference. The card says
"verified human". It never says "unique human", never says "identity
verified", and never asserts KYC; the only appearance of that word is the
sentence that denies it. Selfie Check is a medium-assurance liveness and
same-person signal, and the card must not read as more than that.

## Candidate ready requirements

- The card, specification, catalog row, and submission document are committed
  before any source change.
- The five configuration names, their exact accepted forms, the cookie
  contract, all three UI states, and every status sentence are fixed in the
  specification before code, so no additional state, stored value, or client
  behaviour can be introduced while the slice is built.
- The new paths are disjoint from every accepted card's owned paths and from
  every sibling card in the inbox.
- Each amended path is limited to the single change named in the Owner
  paragraph and needs an explicit root integration reservation.
- The dependency addition is a single pinned version with its matching test
  literal, and no other manifest changes.

## Verification

- A durable test-only RED commit precedes every source change and fails only
  because the declared source paths are absent.
- Focused tests prove configuration fail-closed behaviour for each of the five
  names, canonical address validation, the signal binding to the session
  address, the cookie round trip with expiry, wrong-address, and tampering
  cases, the verify route's forwarding of the unmodified result and its cookie
  emission on success only, the shape of its `403` body including the World
  error code, and by source scan the client component's directive, imports,
  signal, fixed status copy, banned words, and `router.refresh()`, the server
  card's three states, and the single `<DashboardIdentity />` mount before
  `<DashboardCampaign />`.
- Every accepted dashboard test passes unchanged, including the campaign and
  page-header pins on `apps/web/src/app/dashboard/page.tsx`.
- Web typecheck, test, and build pass; root `npm run queue:check` passes.
- Desktop and 390px browser checks on `/dashboard`: the card renders in its
  configured state and nothing overflows.
- No test asserts a successful live World verification. The end-to-end Sandbox
  proof is the recorded human action above and is not implied by source or
  unit tests.

## Boundary

This card unlocks nothing. Every route, control, and command available before
the check remains exactly as available after it. It adds no command, relay,
wallet, transaction, schema, Convex, authority, role, allowlist, payment, or
account behaviour, and changes no existing authority record. It stores no
proof, no nullifier, and no World identifier. It adds one dependency, two API
routes, one server component, one client component, and one mount.

## Historical worktree lane request

- Requested at `2026-09-12T00:00:00Z` by the human operator (repository owner)
  through the operator's delegated session, under the explicit-request rule of
  the [runtime worktree policy](../../WORKTREE-POLICY.md). The card's tier,
  dependencies, declared paths, verification list, and boundary are unchanged
  by the lane.
- Worktree `/Users/yannick/git/myProjects/hackathons/tool402/.worktrees/world`,
  branch `work/world-human-check`. Implementer: the human operator's delegated
  Claude Code session (yannick). Reviewer: the root's independent task review
  and module review, unchanged.
- The lane delivers, in this commit order on that branch: the queue records
  (this card, the specification, the catalog row, and the submission document);
  the dependency addition with its matching test literal; one test-only RED
  commit adding exactly the declared focused test, failing only because the
  declared source paths are absent; and the minimal GREEN commit limited to the
  declared source and amended paths.
- The dependency is `@worldcoin/idkit` pinned to `4.2.3`, the current `latest`,
  added to the web workspace only.
- The branch changes no queue state, ledger, catalog state transition,
  ownership, STATE, decision, human-action, or evidence file, and moves no
  existing card.
- The delivery pull request is marked "root integrates; do not merge by hand".
  Nothing from this branch reaches `main` outside the root's integration
  decision.

## Delivery reconciliation

The lane was integrated by pull request #114 at merge commit
`ab79395207070e451b73602b02f24ad36c19d59b`. On current
`origin/main` `689ffbbe3d0abd11197c9d90676cf56a58b6b3ae`, every declared
source path, the dashboard mount, the specification, and the submission
feedback document exist. The focused `world-human-check` contract passed
(19/19) in this reconciliation.

This marks the local source delivery done and releases its queue reservation.
`HA-WORLD-SELFIE-001` remains pending: no Sandbox Selfie Check, World
configuration, phone exercise, or end-to-end proof is claimed here.
