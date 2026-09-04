# Tool402

Tool402 is intended to be a testnet marketplace for verifiable machine-paid tools. Its planned first tool is RiskScan: the D-Day implementation path will test consumer-agent discovery, x402 payment, a result, and associated Hedera evidence before making any runtime claim.

This is the fresh ETHOnline implementation repository. It inherits no prior Git history. Only local committed slices and later in-event amendments are current behavior authority.

Setup commands, sponsor claims, and runtime claims are added only when the corresponding implementation and live evidence exist. Until then, this repository makes no deployment, payment, sponsor, or submission claim.

## Root workspace

Run `nvm use` before running npm commands.

The root npm workspace currently contains no application or package implementation. It requires Node 22 and npm 10. The `queue:check` command is deliberately unavailable until M01-T090 creates its validator.
