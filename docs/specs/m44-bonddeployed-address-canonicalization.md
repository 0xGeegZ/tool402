# M44 BondDeployed decoded-address canonicalization

## Delivery boundary

M44-T030 makes one local correction in the accepted direct Factory + viem seam:
`decodeBondDeployed` must accept a valid ABI-decoded EIP-55/mixed-case EVM
address and return the same address in Tool402's canonical lowercase wire form.

The official Factory artifact remains the sole event ABI and existing
`viem@2.56.1` remains the only decoder/validator dependency. No package,
artifact, SDK, browser-compatibility, provider, wallet, RPC, transaction, or
live behavior changes.

## Rules

1. Decode only `BondDeployed` through the official Factory artifact exactly as
   the accepted M44 seam does today.
2. Treat `decoded.args.bondAddress` as untrusted event output, not a
   trusted/canonical configuration input.
3. Validate the decoded value as a complete valid EVM address before any
   normalization. Reject malformed values and the zero address.
4. Return only `0x` plus 40 lowercase hexadecimal characters after validation.
5. Retain the current lowercase-only parser unchanged for every trusted M42 or
   caller-supplied canonical configuration address.

## Executable contract

The focused `factory-deploy-bond` test must prove:

- a valid EIP-55/mixed-case `BondDeployed` address from the official artifact
  decodes to its exact lowercase canonical form;
- a lowercase valid decoded address remains accepted;
- zero address, malformed address/event data, wrong event, and malformed
  topics reject;
- `deployBond` encoding, the imported official artifact ABI, and existing
  event/tuple assertions remain intact.

## Exclusions

No configuration input becomes mixed-case-tolerant. No function may access an
environment value, provider, wallet, signer, RPC, SDK, network, transaction,
candidate, Mirror endpoint, deployment, or live capability.
