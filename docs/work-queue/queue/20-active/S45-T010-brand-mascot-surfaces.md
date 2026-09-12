# S45-T010 — Brand mascot surfaces

## State

- Tier: POLISH
- Queue state: 20-active
- Dependencies: S11-T010 accepted, S14-T010 accepted, S20-T010 accepted, S29-T010 accepted, S33-T010 accepted, S43-T010 accepted.
- Raised by: human operator, 2026-09-12. The request is to generate and integrate the four approved mascot compositions for Demo, Explore, Provider deploy review, and route loading.
- Owner: root integrator. The root owns this card, specification, UI manifest, assets, tests, source integration, review records, validation, and draft PR.
- Human actions: none. This local presentation slice introduces no wallet, signature, payment, transaction, deployment, or external action.

## Scope

The exact contract is defined by [`s45-brand-mascot-surfaces`](../../../specs/s45-brand-mascot-surfaces.md) and [`UI-S45`](../../../ui/UI-S45.md).

S45 owns its four new PNG assets, one new shared loading component, the new root loading fallback, the nine existing loading files only for adding the shared cue without changing their skeleton regions, the existing Demo page header, the existing Explore catalogue only for its final provider CTA, the existing Provider deploy wizard only inside `ReviewStep`, the new focused S45 test, and the exact superseded Explore/loading assertions required by those additions.

## Intake

The repository owner explicitly authorized implementation and a new draft PR. At the clean `origin/main` baseline `98cdbe29c59c44cc3145ddbef3615b985dfad45b`, the complete workspace suite passes under Node 22.21.1. S45 begins in inbox pending an independent readiness review. No test, production source, or generated asset is active yet.

## Readiness

The corrected intake at `e5ed2304` passed a fresh independent review with no finding. Dependencies, exact paths, collision boundaries, loader timing, accessibility, and runtime exclusions are clear. S45 moves to `10-ready`; a separate root activation is still required before durable RED.

## RED activation

At ready control source `5780cee2`, the root activates only `apps/web/tests/brand-mascot-surfaces.test.mjs` for durable RED. Production source and generated assets remain prohibited until the focused contract fails only for the four missing surfaces and receives independent RED review.

## RED acceptance

Focused source `26cbf725` fails 6/6 only for the absent declared assets and surfaces. A fresh independent re-review returned `CLEAR` after the contract was hardened to verify actual transparent pixels, decorative accessibility, state-linked delayed reveal and cleanup, and reduced motion. The focused test is frozen. Minimal GREEN may change only the four declared PNGs, the Demo header, the Explore final CTA plus its exact prior contract reconciliation, only `ReviewStep` in the deploy wizard, the shared/root loading cue, the nine loader mounts, and the exact prior loading contract reconciliation.

## Boundary

The slice is presentation-only except for the loader's cancellable 300 ms visual reveal timer and the one internal Explore link. It cannot change catalogue entries, dynamic deploy values, form progression, wallet/session/signing behavior, route skeleton order, network calls, storage, configuration, APIs, dependencies, backend code, deployment, or live evidence.
