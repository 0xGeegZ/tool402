# HA-ATS-RUNTIME-BINDING-001 — recommended human decision

> Status: pending human approval. This is a local code-safety decision only.
> It authorizes no wallet, account, SDK, network, asset, transaction,
> deployment, or publication action.

## What this changes

The next local ATS code change would check one thing before any ATS command can
reach durable replay or attempt state: the already-normalized signer carried by
M32 must exactly equal the owner address in the fixed server-side
`ATS_CREATE` configuration. This amendment does not verify or recover a
signature again.

The current ATS manifest stays empty. Therefore every ATS command continues to
fail closed after this change; this decision does not make ATS usable or
testable on Hedera.

## Exact local rule

For `ATS_CREATE` only, after M32's existing current command-authority
revalidation and before replay, idempotency, or database writes:

1. Use only M32's already-normalized canonical signer address.
2. Require the candidate's exact `network`, `chainId`,
   `subjectPublicId`, `operationKind`, `expectedTarget`, and
   `canonicalParametersHash` to match the immutable reference configuration
   returned by `createStageARealIssuerAtsCreateAuthority()`. The future card
   must use a fixed server-side representation of that configuration; it must
   never select configuration from the submitted payload.
3. Only after that comparison, read its
   `parameters.diamondOwnerAccount` and require exact lowercase address
   equality.
4. Reject a missing, malformed, noncanonical, or unequal value before durable
   state.

The current zero-enabled manifest remains unchanged. The change must not add
an authority row, enable a manifest entry, or add a public endpoint.

## Explicit exclusions

This decision does not authorize:

- MetaMask, a wallet prompt, key access, account creation, or funding;
- Convex publication, environment access, SDK import or initialization;
- an ATS asset, payment, transfer, transaction, deployment, or live test; or
- any `ATS_CONTROL_LIST`, `ATS_ISSUE`, `ATS_TRANSFER`, or
  `ATS_COUPON` behavior.

A separate approval remains required before the real Hedera test.

## Approval text

> I authorize the local ATS check that rejects an `ATS_CREATE` command unless
> its M32 already-normalized canonical signer exactly matches the configured ATS owner address. The
> manifest remains disabled. No wallet, Hedera call, asset creation, transaction,
> deployment, or publication is authorized.
