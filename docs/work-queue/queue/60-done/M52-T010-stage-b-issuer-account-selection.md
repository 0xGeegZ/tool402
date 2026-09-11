# M52-T010 — Stage-B issuer account selection

## State

- Tier: CORE_P0
- Queue state: 60-done
- Dependencies: M47-T010 accepted, M48-T010 accepted, M50-T010 accepted.
- Owner: root integrator owns queue/control records, reviews, integration, commits, and pushes.
- Human actions: none. This card did not authorize a wallet request, transaction, Mirror read, candidate, attachment, or other live action.

## Purpose

MetaMask legitimately returns every account that the user authorized for a
site from `eth_accounts`. The Stage-B bridge previously rejected that ordinary
multi-account response even when the fixed approved issuer was present exactly
once.

## Local authority

The implementation contract is [M52 Stage-B issuer account selection](../../../specs/m52-stage-b-issuer-account-selection.md). The readiness, activation,
RED, task, specification, and standards reviews resolve locally.

## Accepted behavior

The pre-send bridge validates every returned account and accepts the set only
when the fixed issuer occurs exactly once. It keeps the fixed chain, issuer,
Factory, calldata, and zero transaction value unchanged. Absent issuer,
duplicate issuer, and malformed entries still reject before a send.

## Acceptance

Accepted at `dc5c0701` after durable RED/GREEN, focused 31/31, complete Web
379/379, Web typecheck, root lint, queue, and whitespace checks. This is local
source/test evidence only: no real provider request, transaction, receipt,
Mirror read, candidate, attachment, authority, or other live action occurred.
