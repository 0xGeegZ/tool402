# HA-B03-AGENT-PAYMENT-001 — bounded execution record

## Scope

This record captures one explicitly user-authorized B03 testnet payment run.
It records only its redacted runtime facts and public-ledger corroboration; it
is not a deployment, ATS, backing, video, or submission record.

## Authorization and configuration confinement

Human Ops confirmed the exact Production Blocky402 facilitator before the
run. The dedicated payer values remained in ignored local configuration. No
private key, credential, signed payment header, signed payload, or environment
value is recorded here.

## Recorded execution facts

- Agent source: `d779103b313021be8f66b4203f75699a8728287a`.
- Service: `https://tool402.vercel.app`.
- The fresh non-paying preflight stopped at
  `RISKSCAN_PAY_DIAGNOSTIC PREFLIGHT_GUARD_REACHED`.
- The one subsequent CLI run returned `RISKSCAN_PAY_OUTCOME paid` and
  `RISKSCAN_PAY_DIAGNOSTIC PAID`.
- Redacted facilitator-reported settlement reference:
  `0.0.7162784@1789302725.356257382`.
- The sanitized external evidence artifact was generated at
  `2026-09-13T12:32:11.151Z`; its SHA-256 is
  `35fd86d16febc9a3e2aa24d5a0c171f10822b29e0fb8783f92c0c37315fc7f8b`.

## Public-ledger corroboration

A read-only Hedera testnet Mirror Node query for
`0.0.7162784-1789302725-356257382` returned `CRYPTOTRANSFER`, `SUCCESS`, and
consensus timestamp `1789302730.295627233`. Its transfer rows include one
`100000` tinybar debit and matching `100000` tinybar credit. The payer-side
transaction fee was `266808` tinybar.

## Narrow status

HA-B03-AGENT-PAYMENT-001 is evidenced as its one bounded testnet exercise.
This removes only B03-T010's live-evidence condition. The parser correction
and this control update still require normal draft-PR review and merge before
the card can be accepted. No additional payment or retry is authorized.

This record grants no ATS, backing, funding, allocation, clearing, HCS, payout,
deployment, visibility, video, or submission action.
