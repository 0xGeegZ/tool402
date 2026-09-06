# M12 RiskScan native quote eligibility contract

## Delivery boundary

This contract adds one pure core evaluator for a caller-defined native
RiskScan quote policy. It decides only whether a supplied quote is compatible
with the caller's exact native network, asset, and maximum atomic amount. It
does not define an economic cap or payment authority.

The evaluator performs no I/O, configuration read, network lookup, account
lookup, payment/header handling, client creation, signing, wallet action,
transaction, settlement, persistence, deployment, or live assertion.

## Public API

`packages/core/src/riskscan-native-quote-eligibility.ts` exports this surface
through `packages/core/src/index.ts`:

```ts
export type RiskScanNativeQuoteDeclineReason =
  | "invalid_policy"
  | "invalid_quote"
  | "network_mismatch"
  | "asset_mismatch"
  | "amount_exceeds_maximum";

export type RiskScanNativeAtomicAmount = bigint & {
  readonly __brand: "RiskScanNativeAtomicAmount";
};

export type RiskScanNativeQuoteEligibility =
  | {
      readonly kind: "eligible";
      readonly network: "hedera:testnet";
      readonly asset: HederaAccountId;
      readonly amount: RiskScanNativeAtomicAmount;
    }
  | {
      readonly kind: "declined";
      readonly reason: RiskScanNativeQuoteDeclineReason;
    };

export function evaluateRiskScanNativeQuote(
  policy: unknown,
  quote: unknown,
): RiskScanNativeQuoteEligibility;
```

The function never throws for untrusted `policy` or `quote` values. It returns
only the union above and never returns a URL, recipient, facilitator, fee
payer, header, credential, account, transaction, or external-state detail.

## Policy and quote rules

The caller's policy must be an exact own-enumerable data record with these
three fields and no others:

```ts
{
  network: "hedera:testnet";
  asset: string;
  maximumAmount: string;
}
```

`asset` must parse as a canonical `HederaAccountId`. `maximumAmount` must
parse through the accepted generic canonical-integer boundary, then become a
local `RiskScanNativeAtomicAmount`; zero is allowed as an explicit no-spend
policy. This is deliberately not `Tinybar`: `0.0.0` represents HBAR in
tinybars, while another canonical asset has its own atomic unit. There is no
default network, asset, or maximum amount. An invalid policy returns
`{ kind: "declined", reason: "invalid_policy" }` before quote values are
read.

The quote must be an exact own-enumerable data record with these three fields
and no others:

```ts
{
  network: string;
  asset: string;
  amount: string;
}
```

`asset` must parse as canonical `HederaAccountId`; `amount` must parse
through the accepted generic canonical-integer boundary, become a local
`RiskScanNativeAtomicAmount`, and be greater than zero. A malformed record,
non-string field, noncanonical value, zero amount, inherited value, accessor,
symbol key, non-enumerable key, or extra field returns
`{ kind: "declined", reason: "invalid_quote" }`.

If a structurally valid quote's `network` differs from the policy network, the
result is `network_mismatch`. If its canonical asset differs, the result is
`asset_mismatch`. If its exact amount is greater than the policy maximum, the
result is `amount_exceeds_maximum`. Exact equality is eligible. An eligible
result preserves the parsed `RiskScanNativeAtomicAmount` exactly, including
amounts larger than `Number.MAX_SAFE_INTEGER`.

## Safety and authority boundary

Both records are untrusted. The evaluator must inspect only own enumerable
data descriptors and must not invoke a getter or directly read a property
after snapshotting. It must use the captured descriptor values exclusively,
reject any own key outside the exact enumerable field set, and fail closed if
record inspection itself throws. It returns a fresh bounded result and does
not retain references to either input. Invalid policy must return before any
quote reflection or descriptor inspection.

An `eligible` result is only local quote compatibility. It must not be treated
as user consent, a payment authorization, a quote guarantee, a balance check,
a configured client, a transaction, settlement, finality, receipt, evidence,
or live-service claim. A later Agent composition may consume this result only
through its own local card; any payment client or live proof remains governed
by HA-X402-HEDERA-001.

## Ownership and acceptance evidence

Only these implementation paths belong to the card:

```text
packages/core/src/riskscan-native-quote-eligibility.ts
packages/core/src/index.ts
packages/core/test/riskscan-native-quote-eligibility.test.mjs
packages/core/test/riskscan-native-quote-eligibility.types.ts
```

The accepted M10 parsers are dependencies, not owned changes. Agent, web,
backend, package metadata, lockfile, runtime configuration, account, wallet,
signer, payment, transaction, settlement, deployment, and live evidence paths
are excluded.

- RED/GREEN public-core tests cover valid exact selection, zero-cap decline,
  equality, excess, network/asset mismatch, and canonical/noncanonical input.
- Adversarial tests prove strict record shape including non-enumerable extras,
  no accessor invocation, descriptor-only evaluation without direct proxy
  reads, invalid-policy precedence over a hostile quote, and fail-closed
  inspection of hostile records.
- A public TypeScript fixture proves the exported union narrows its eligible
  result to public `RiskScanNativeAtomicAmount` and `HederaAccountId` values.
- Core/root typecheck, test, lint, queue/reference/whitespace checks, enabled
  local guard, independent task review, and two fresh clean module-review
  generations pass before acceptance.
