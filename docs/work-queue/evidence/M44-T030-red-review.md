# M44-T030 independent RED review

## Scope

Independent review of delegated test-only
`8053346d9aa25e666bf0fe14a12a767d9be3cdb7`, a direct child of canonical
`6dc420625778a4506e4e2e3a37cf1a7617cda287`.

## Verified contract

- The clean diff changes only `apps/web/tests/factory-deploy-bond.test.mjs`.
- The official Factory artifact and viem produce a valid EIP-55 decoded address
  expected to return as canonical lowercase.
- Lowercase decoded output remains accepted; zero, malformed, and wrong-event
  logs reject; deployBond encoding and artifact-only ABI checks remain covered.
- A mixed-case trusted configuration input still rejects.

## Focused RED result

Under Node 22.21.1, the focused suite reports 9 passes and 2 intended
failures. Both arise only from the current `readCanonicalAddress` use on the
decoded `BondDeployed` address.

## Verdict

CLEAR — authorize only `apps/web/src/lib/ats/factory-deploy-bond.ts` and
`apps/web/tests/factory-deploy-bond.test.mjs` for minimal GREEN: validate a
decoded non-zero EVM address first, then return its lowercase canonical form.
The lowercase-only trusted configuration parser remains unchanged. No package,
SDK/browser graph, provider, wallet, RPC, transaction, deployment, or live
path is authorized.
