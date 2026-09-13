# W01-T010 readiness review

## Verdict

Ready for a separate, test-only RED activation only. This review does not
authorize packages, application source, wallet requests, signatures,
transactions, configuration, deployment, merge or live activity.

## Reviewed source

- Delivery base: `origin/dev` `b52829e5a390ca49f09de3986d9157b19eacb716`.
- W01 planning head before this readiness-record commit: `37e337a5`.
- Independent review found an initially stale base, unenforceable catalog
  wording, active ownership collisions, source-form RED probes, and a missing
  replacement seam for `command-relay`'s current-session read.

## Root resolutions

1. W01 was rebased on the stated `origin/dev` base. The catalog keeps
   `Dependencies: none` because its parser accepts only already-60-done
   dependencies; the explicit successor transfers below are the readiness
   authority rather than a bypass of them.
2. W01 owns its migration candidate paths only through the corresponding
   `FILE-OWNERSHIP.md` record. Source and package paths stay prohibited until
   a separate activation accepts focused RED tests.
3. `FILE-OWNERSHIP.md` enumerates each W01 candidate file and test. It records
   exact transport-only transfers from S26/S40/M56/M58/M51/M53/M54/B04; S36 is
   excluded. M51 durable resume, M53 receipt selection, M54 recovery, M58
   reservation/hash evidence and B04 security constraints are mandatory
   preserved behavior, not scope W01 may remove.
4. M49 and M50 are accepted predecessors: W01 must retain their Factory
   calldata/candidate/recovery and passive account-change/no-resend safety
   boundaries while replacing transport.
5. PR #118 was rechecked at 2026-09-13: OPEN, against `main` `9bd52322`, head
   `db83f47a`, and changes `wallet-connect.tsx`, `wallet-session.tsx`,
   `wallet-balance.ts`, wallet balance/session/state tests, `UI-S37.md`, and
   the S37 inbox card. It is outside `origin/dev`; W01 will not merge/copy it
   and must recheck it before final rebase.
6. The plan now requires deterministic mock-connector behavior/race RED tests
   and an injected `WalletActionContext` assertion in command relay before
   deleting `wallet-state`.

## Baseline

Node 22.21.1 Web baseline was not clean before W01 source activation:
`568` passed, `2` failed, `1` skipped. Failures are existing
`provider-tool-journey` Stage-2-signature and `wallet-state` discovery-count
assertions. W01 may replace the latter only with an equivalent behavioral
Wagmi contract; the former remains unrelated and must be reported separately
unless current-head evidence proves W01 caused it.
