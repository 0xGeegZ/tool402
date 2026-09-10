# M46-T030 specification module review

## Scope

Fresh independent specification review of source commit
`7ebfa172bd45178724d2ccf90bc6333ed4fe8391` against M46-T030 and the inherited
M02/M06 configuration contracts.

## Review

- M02 and M06 define the EVM family as a strict positive `eip155:<number>`
  CAIP-2 value, not a Base Sepolia-only value. M46 explicitly inherits that
  family.
- Removing the two EntityCheck-only Base Sepolia checks restores that contract
  while leaving strict configuration parsing, source-configuration gating, and
  native Hedera validation unchanged.
- The regression proves a non-default valid EVM configuration produces the
  required unsigned challenge and does not enter the source or settlement path.
- No configuration default, public client value, external action, or behavior
  beyond the declared protected API contract was added.

## Verification

Node 22.21.1 focused EntityCheck plus unchanged RiskScan API checks passed,
and Web typecheck passed. The reviewed diff is limited to the declared
EntityCheck handler and its durable contract.

## Verdict

CLEAR — the implementation matches the local M46 and inherited M02/M06
behavioral authority.
