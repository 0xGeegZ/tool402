# M56 Backing demo MVP

## Outcome

The existing S18 funding flow receives one server-derived `OPEN` RiskScan offering and one server-controlled testnet treasury EVM address. A dedicated BACKER may prepare `HEDERA_FUNDING`, explicitly submit exactly one HBAR transfer, and see the canonical transaction hash beside only `Payment submitted — allocation pending.` A hash is not confirmation, funding, allocation, or settlement.

## Server boundary

- Read the existing bounded public RiskScan offering projection on the server; admit only the fixed RiskScan subject in state `OPEN`.
- Read `TOOL402_FUNDING_TREASURY_EVM_ADDRESS` only from a plain own server environment value and require a lower-case canonical EVM address.
- Return `null` for absent, unavailable, malformed, non-OPEN, foreign, or misconfigured inputs. Never derive a treasury from issuer, Factory, x402, browser input, or a default.

## Authority enforcement

`fundingTreasuryAddress` is an optional authority field so pre-existing ISSUER rows remain valid without it. For `HEDERA_FUNDING` only, the bounded internal authority projection, shared authority record, authenticated normalizer, and durable admission require it to be a lower-case canonical EVM address, require exact BACKER role and the named subject in `ownedSubjectPublicIds`, and require exact equality of payload `expectedTarget` to that stored address. Missing, duplicate, malformed, foreign, or mismatched BACKER rows fail before any external-prepare attempt or external-prepare replay write; the independently deduplicated ingress claim remains unchanged. ISSUER offering, directory, ATS, and `external.attachCandidate` behavior remains unchanged when the optional field is absent.

## Human authority and exclusions

Human Ops alone may provision one dedicated BACKER `commandAuthorities` row: chain 296, role BACKER, HEDERA_FUNDING only, named RiskScan subject/authority version, dedicated backer address, and canonical funding treasury; revoke it after the bounded rehearsal. This never broadens ISSUER `external.attachCandidate`. M56 adds no allocation, ownership, capacity, portfolio, payout, refund, revenue distribution, token transfer, durable contribution record, or server-side confirmation. Optional public Mirror proof is a separate successor and never blocks the MVP.
