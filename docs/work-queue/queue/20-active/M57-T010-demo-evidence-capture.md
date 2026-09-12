# M57-T010 — Demo evidence capture

## State

- Tier: CORE_P0
- Queue state: 20-active
- Dependencies: S46-T010 accepted, B03-T020 accepted, M03-T030 accepted.
- Owner: root integrator for this card, specification, plan, queue records,
  Agent export, Web demo evidence model, focused tests, review, and PR.
- Human actions: wallet access, signer configuration, paid action, blockchain
  verification, deployment, and recording remain human-owned.

## Scope

M57 owns only `apps/agent/src/riskscan-payment-evidence.ts`,
`apps/agent/src/riskscan-pay-cli.ts`, their focused Agent tests, the existing
demo control-room sources/tests, a new demo-only evidence model/test, the
existing HashScan helper/test as needed, and synchronized release-runbook copy.
It consumes the existing B03 `paid` outcome only after it returns; it neither
changes payment retries nor exposes the x402 in-memory settlement sink.

The local contract is [M57 demo evidence capture](../../../specs/m57-demo-evidence-capture.md);
the delivery sequence is the [M57 plan](../../../superpowers/plans/2026-09-12-m57-demo-evidence-capture.md).

## Exclusions

M57 does not alter backend durable records or create a public evidence feed,
does not modify M56 backing, M55/ATS, Provider, World, wallet, signer, x402
handler, API, environment, deployment, or live transaction behavior. Imported
evidence is local-only and never becomes server or blockchain authority.

## Activation

The user authorized this focused follow-up from current `origin/main` after
reviewing the explicit objective. The established S46/B03/M03 dependencies are
accepted and their implementation paths are not modified. The work begins with
focused RED tests; source changes are limited to the declared paths.

## Validation

Run focused Agent/Web RED/GREEN tests, Agent/Web typechecks, root test/lint/
build, queue/reference guards, exact-head independent review, and injected
browser rehearsal at desktop and 390px. No live payment, signature, transfer,
deployment, or submission is part of validation.
