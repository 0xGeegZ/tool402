# HA-ATS-LIFECYCLE-001 — smallest lifecycle recommendation

## Recommendation

Use a **one-unit testnet transfer of an already issued ATS asset**. Transfer is
explicitly a qualifying lifecycle operation in the current Hedera ATS prize.
No sponsor question is necessary.

This creates no authority. Current source has no verified ATS asset: M43 keeps
ATS_CREATE receipt outcomes zero-enabled and never calls \`markAssetReady\`; the
Stage-B packet ends at a \`SUBMITTED\` candidate. This packet applies only after
a successor independently verifies and binds the exact Factory asset.

## Why not a compliance check

The immutable Bond configuration has \`isWhiteList: true\`, but
\`internalKycActivated: false\`, no external control-list/KYC IDs, and no
identity-registry or compliance ID. The pinned artifact's compliance getters
would merely prove no active control. They are not a demonstrated compliance
operation and must not be relabelled as lifecycle evidence.

## Exact preconditions and operation

Before a new narrow human authority, record: independently READY asset; asset
EVM address; issuer signer; \`hedera:testnet\` / chain \`296\`; Factory receipt;
configuration hash; and pre-state \`totalSupply\`, issuer/recipient \`balanceOf\`,
\`isInternalKycActivated\`, and \`getControlListCount\` from the pinned artifact.

The artifact exposes these real methods:

\`\`\`text
issue(address to, uint256 amount, bytes data)      // only if supply is zero
transfer(address to, uint256 amount) -> bool       // lifecycle operation
\`\`\`

If issuer supply exists, authorize only
\`transfer(<APPROVED_TESTNET_RECIPIENT>, 1)\` from the verified issuer, value
\`0\`, once. If supply is zero, a separate authority is required for one bounded
issue; it is not implied here. Set an aggregate HBAR fee cap only after
simulation; never send more than one asset unit.

Capture decoded calldata, public transaction/Mirror/HashScan links, receipt,
asset, pre/post supply and balances, sender, recipient, chain, configuration
hash, artifact version, and timestamp. Stop without retry for any failed
precondition, role/whitelist/simulation failure, fee-cap breach, changed
wallet/chain, malformed receipt, or uncertain finality. A returned hash with
unknown outcome is terminal, not permission to send again.
