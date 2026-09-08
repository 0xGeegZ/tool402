# M38-T010 RED review

## Scope

Independent review at pushed `fb95e731dfff85145ed50bd0be28ee087a0173d7` of:

- [M38 control card](../queue/20-active/M38-T010-offering-command-payloads.md)
- [M38 specification](../../specs/m38-offering-command-payloads.md)
- [offering-create runtime/type contracts](../../../packages/core/test/offering-create-payload.test.mjs)
- [directory-publish runtime/type contracts](../../../packages/core/test/directory-publish-payload.test.mjs)
- [attach-candidate runtime/type contracts](../../../packages/core/test/attach-candidate-payload.test.mjs)

## Observed RED

Under Node 22.21.1, each focused runtime contract fails exactly once for its
declared absent source module and skips its remaining GREEN assertions:

- offering-create: one declared-module failure and six skips;
- directory-publish: one declared-module failure and six skips;
- attach-candidate: one declared-module failure and five skips.

No M38 source, barrel, dependency, or lockfile exists or changed in this RED
cycle.

## Established contract

- Each root is closed, descriptor-safe, detached, and frozen; inherited,
  nonenumerable, symbol-keyed, accessor-backed, and hostile-reflection inputs
  fail without invoking a caller accessor.
- The contracts fix the reused local M20, M26, and M28 boundaries, the
  bounded narrative and tinybar rules, exact URL normalization refusal, both
  retained candidate transaction forms, and the ATS_CREATE-only candidate
  address rule.
- Canonical-byte builders must return fresh RFC 8785 JCS UTF-8 bytes without a
  runtime adapter; optional values are omitted rather than rendered as null.
- The public type contracts fix the exact two-member candidate-transaction
  union and require a structurally optional candidate address.

## Verdict

CLEAR — the durable RED contracts are accepted. They authorize only
`packages/core/src/offering-create-payload.ts`,
`packages/core/src/directory-publish-payload.ts`,
`packages/core/src/attach-candidate-payload.ts`, and the root-reserved narrow
append-only `packages/core/src/index.ts` amendment. They do not authorize a
command admission, signature, wallet, provider, network, storage, ATS action,
transaction, deployment, or live claim.
