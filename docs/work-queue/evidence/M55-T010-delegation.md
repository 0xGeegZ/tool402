# M55-T010 — Delegation packet

## What to build

Allow the same authorized provider to **deploy a new tool**, including with
exactly the same prefilled information as the first. Keep both tools and all
their deployed records. This is not a reset or user-facing “demo attempt”.

Read, in order:

1. Root AGENTS.md and committed [STATE](../STATE.md).
2. [M55 card](../queue/00-inbox/M55-T010-provider-demo-attempt-restart.md).
3. [M55 behavioral specification](../../specs/m55-provider-demo-attempt-restart.md).
4. [Implementation plan](../../superpowers/plans/2026-09-12-m55-deploy-another-tool.md).

The spec owns product/security decisions; the plan owns candidate files and
sequenced tests; this packet owns startup and handoff. Do not ask the owner to
repeat already settled product choices.

## Starting snapshot, not future runtime truth

Prepared from source head `4d1e27fcf9cfe2b3fd2f4a5010f3fbb738187037`,
with refreshed main `5e863970935b074060b88d62a519102f2edfb9af`.
Existing draft: repository PR #97,
branch `feat/issue-93-provider-demo-attempts`.
The legacy branch/spec filenames are retained; their wording does not override
the refined new-tool contract. Obtain current SHAs from Git/GitHub when starting.

The branch already includes the owner's requested provider-continuation
integration: Stage 3 recovery/attachment, Stage 4 configuration, local HTTP
dashboard auth/cookies, root environment loading, and status/action copy.
Do not drop those changes, reapply them blindly, or present them as M55
multi-tool implementation. At this snapshot the new-tool feature is absent.

This handoff/refinement changes documentation only. M55 stays `00-inbox`;
specification completion is not source activation or implementation completion.

## Startup gate the receiving root owns

1. Inspect local modifications and exact head/main/PR diff. Existing generated
   `apps/web/next-env.d.ts` drift was observed in this workspace; do
   not stage it as M55 documentation. Do not move/switch/remove a worktree
   without the owner's permission or edit their separate checkout.
2. Verify the accepted foundation, queue validator, workspaces and integration
   gates from current records. Run focused baselines before interpreting test
   failures as new defects.
3. Resolve **every** candidate-path overlap, not just M51:

| Active records in this snapshot | Relevant overlap |
| --- | --- |
| M51 | Offering admission/projection, dispatcher, durable resume, signing island/tests. |
| M53 and M54 | Browser ATS bridge, receipt recovery, action/state/signing/tests. |
| S26 and S36 | Wallet/session integration, signing island and stage handoff. |
| S42 | Dashboard ownership adapter/component and focused tests. |
| B04 | ATS canonical/display/execution and protected-input security surfaces. |

Read [FILE-OWNERSHIP](../FILE-OWNERSHIP.md) plus each current card. This is a
starting inventory, not a claim that other paths are free. Root may resolve an
overlap by recorded final acceptance/release or by a scoped transfer with
co-review as used for M53/M54. A code merge alone does not release a reservation.
Do not invent predecessor acceptance or skip the gate because the work is urgent.

4. Record exact candidate paths as reservations, obtain fresh independent
   readiness, then root test-only activation/RED review before GREEN.
   The chosen allocation/ownership/configuration design is already specified;
   a new product-design confirmation is not a prerequisite. If a factual
   dependency remains blocked, report that exact dependency while completing
   safe documentation/baseline work; do not silently substitute a UI-only reset.

## Development environment handoff

Read root AGENTS.md's local-runtime section before launching/reusing a server.

- Use Node from `.nvmrc` (22.21.1). Install pinned workspace
  dependencies before treating missing TypeScript/module support as a bug.
- Find the authoritative ignored root env through the Git common directory and
  `apps/web/scripts/root-env.mjs`, not another worktree's sample.
  Verify Convex deployment/cloud/site URLs consistently target the intended
  **dev** database; inspect values without printing secrets. This snapshot's
  earlier intended dev target was efficient-trout-633; revalidate it, do not
  treat this note as current configuration proof.
- Verify dashboard origin/secret, ingress key/secret/site, clearing account,
  and (after implementation) the explicit hosted service endpoint separately.
  Presence is not proof that credentials match the target backend.
- The loader overwrites process.env with the root file. A shell-origin override
  **before** that load can silently be lost. For a port-3000 run, apply the
  verified local origin override after loading, before spawning Next, without
  rewriting the shared ignored environment file. Launch Next with apps/web as
  its working directory. Keep genuine sign-in on HTTP localhost:3000.
- Inspect the process listening on 3000 before reusing it; verify checkout,
  revision and configuration, and do not terminate unrelated work. Restart
  after effective configuration changes.
- Check target route and a non-wallet auth challenge request before saying
  “ready”; distinguish a configured challenge from 503 not_configured. Browser
  acceptance requires the intended session and actual selected-tool route.
- An HTTPS **hosted service endpoint** is not the local login origin. Missing
  publication configuration must not trigger an HTTPS-login or auth-bypass fix.
- Publishing backend source, changing remote env/authority, wallet prompts,
  signatures and testnet transactions require separate explicit authorization.
  Local tests and this handoff authorize none of those actions.

## Expected delivery report

Provide the implementation head and PR link; changed behavior; focused/full
tests and failures; independent review; HTTP/auth/browser evidence; exact dev
backend deployment status; and separately authorized live-demo evidence or its
remaining gate. The decisive scenario is spec A2: two same-information tools
with distinct real deployments and unchanged prior records.

A button screenshot alone, specification commit, mock receipt, or green queue
check must never be reported as this completed scenario.

## Copyable delegation request

> Implement M55 in the existing PR #97 from its current head. Start with
> docs/work-queue/evidence/M55-T010-delegation.md, then its specification and
> plan. The requirement is to deploy another independent tool with the same
> provider and optionally identical prefilled information, preserving every
> previous deployment. Complete the root readiness/ownership and TDD gates,
> implement the full selected-tool/ATS/receipt/Directory/dashboard path, obtain
> independent review, verify and commit/push the changes. Preserve existing
> continuation/auth/env integrations. Report code, CI, browser, dev deployment,
> and human testnet proof separately. No destructive reset or automatic live
> action. Do not re-open the settled product-design question.
