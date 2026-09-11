# M53 Stage-B Factory receipt-log selection

## Outcome

For a successful fixed Factory receipt, the browser bridge identifies the one
ABI-valid `BondDeployed` event emitted by the fixed Factory even when the same
receipt also contains arbitrary logs from the created Bond or other contracts.

## Invariants

- Receipt, transaction, chain, fixed issuer, fixed Factory, zero-value send,
  and Mirror corroboration checks stay unchanged.
- The complete receipt log array is treated as untrusted data.
- Only own enumerable records with a canonical fixed Factory emitter can be
  considered eligible.
- Exactly one eligible Factory log must exist. None, more than one, malformed,
  zero-address, or ABI-decode-failing Factory logs return `submission_unknown`.
- Valid non-Factory logs are ignored; they neither create authority nor make a
  unique valid Factory event ambiguous.
- The existing M44 decoded-address boundary remains responsible for validating
  and normalizing a valid ABI-decoded event address.
- This is a local correction. It must not perform a real provider request,
  Mirror read, transaction, retry, candidate attachment, or deployment during
  tests or implementation.

## Acceptance

- A receipt containing a valid Factory `BondDeployed` event plus arbitrary
  non-Factory logs yields the existing fully corroborated candidate outcome in
  injected tests.
- Existing single-event success behavior remains intact.
- Missing, malformed, zero-address, and two-Factory-event receipts remain
  terminal `submission_unknown` outcomes without candidate attachment.
