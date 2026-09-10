# M46-T020 test review

## Scope

Fresh exact-head test adequacy review at
`b8843b03fa0cd5452445ae7b90aaa496757a8bd4` of the M46-T020 focused contract,
including the injected-clock regression.

## Review

- `8_640_000_000_000_000` is a safe integer but serializes to an extended-year
  ISO string which the accepted Core boundary rejects.
- The regression would fail against the preceding implementation: it would
  fetch both fixtures and return a read result carrying the invalid descriptor.
- The accepted implementation instead returns the closed unavailable result
  without invoking the injected fetcher.
- The complete focused contract passes 13/13 under Node 22.21.1.

## Verdict

CLEAR — the regression exercises the reported defect and retains the bounded,
injected-only source contract.
