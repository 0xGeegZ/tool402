# M43-T010 RED contract review

## Scope

Two independent reviews at clean pushed
`bcb3f7d5895829e44326a8472d495cd8eb62d757` covered the committed M43 RED
contract, its constrained M41 dispatch-test replacement, and its declared
local GREEN targets.

## Verification

Under Node 22.21.1, the focused M43 run had only the declared absence and
schema-widening failures: the three absent M43 source modules and the pending
attempt-state schema amendment. All other failing/skip assertions were the
recorded source-dependent expectations; no unrelated regression was observed.
`queue:check`, whitespace validation, local-reference validation, and the
zero-enabled M33 manifest check were clear.

## Established boundary

- Every `ATS_*` verification context returns `NOT_CONFIGURED` before Mirror
  I/O or an outcome mutation.
- Only `HEDERA_FUNDING` may use the bounded, fixture-driven Mirror receipt
  observation and terminal-outcome path.
- Candidate attachment is authenticated local durable evidence only; it does
  not prove a transaction, invoke M40 readiness, or disclose a durable
  internal attempt identifier.
- The dispatch mapping remains closed: `ATTACHED` maps to the existing
  accepted response, `ALREADY_ATTACHED` and `COMMAND_REPLAYED` map to the
  existing replayed response, and every other result maps to rejected.
- M43 creates no SDK, wallet, provider, configuration, transaction,
  deployment, or live authority.

## Verdict

CLEAR. The declared local GREEN scope is now authorized: the three M43 source
modules, the reserved attempt-state/optional-field schema amendment, and the
single `external.attachCandidate` dispatch-entry amendment. The implementation
must preserve every boundary above; any enabled ATS receipt verification,
asset-ready transition, or live action remains a separately gated successor.
