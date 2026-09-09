# HI-005 — Campaign backend deployment evidence intake

## Purpose

Human intake card. The human operator (repository owner) has completed the
publication step that `HA-CAMPAIGN-CONVEX-001` asks for: one named Convex
deployment now exists for this repository's backend workspace, and the
ingress HMAC key pair is provisioned as environment values outside tracked
files. This card carries the redacted evidence so the root can mark the row
accepted. It authorizes no wallet, SDK, provider, asset, transaction, live
relay, or submission action.

## State

- Tier: intake
- Queue state: 00-inbox
- Dependencies: none
- Raised by: human operator, 2026-09-09
- Owner: root integrator on intake. The human-action row and its decision
  row are human-owned and root-recorded.
- Human actions: `HA-CAMPAIGN-CONVEX-001` is complete as evidenced below.
  `HA-ATS-STAGE-B-001`, `HA-PUBLIC-DEPLOY-001`, and
  `HA-B03-AGENT-PAYMENT-001` remain pending and untouched.

## Evidence

- Deployment: the operator linked `packages/backend` to the Convex project
  `yannickmermet:backend` and pushed the committed schema with
  `npx convex dev --once` on 2026-09-09. The named deployment is the
  development deployment `shocking-caiman-843`; its function origin is
  `https://shocking-caiman-843.convex.cloud` and its HTTP-action origin is
  `https://shocking-caiman-843.convex.site`. The push created the accepted
  M04 and M32 tables and indexes; no function outside the committed
  `convex/` directory exists there.
- Reachability: the delegated session read the HTTP-action origin over the
  public network and received `404` for `/internal/commands`, the expected
  answer while the M41-T010 router is not yet committed, and `200` from the
  function origin.
- Ingress key pair: the operator set `TOOL402_INGRESS_KEY_ID` (`key-A`,
  satisfying the M22 `keyId` grammar) and `TOOL402_INGRESS_SECRET` (a 32-byte
  key generated locally and rendered as 64 lower-case hexadecimal
  characters, the form the accepted S15 relay decodes) as Convex environment
  values of that deployment through `npx convex env set`, and the same two
  values plus `TOOL402_CONVEX_SITE_URL` in the ignored `apps/web/.env.local`.
  The delegated session verified only the variable names on both sides.
- Confinement: the secret exists only in the Convex deployment environment
  and in `apps/web/.env.local`, which the root `.gitignore` excludes; it is
  not in any tracked file, commit, transcript, or chat message, and no agent
  has read its value. The link file `packages/backend/.env.local` is
  likewise ignored.
- The public web host is not yet provisioned; its three values are part of
  `HA-PUBLIC-DEPLOY-001`, and until then the relay on any other host answers
  `not_configured`.

## Requested root records

1. One decision row marking `HA-CAMPAIGN-CONVEX-001` accepted as bounded
   evidence of the named deployment and the confined key pair, naming this
   card, the deployment name, and the HTTP-action origin.
2. A note that the operator re-runs `npx convex dev --once` after M41-T010
   and later Convex cards are accepted, since deployments stay human-owned;
   the root asks for that re-push through a pending row when a committed
   `convex/http.ts` exists.
3. No change to any other human-action row.

## Explicit non-authorizations

This card authorizes no wallet, key, signature, SDK, provider, asset
creation, transaction, funding, live relay traffic, public web deployment,
video, or submission action.
