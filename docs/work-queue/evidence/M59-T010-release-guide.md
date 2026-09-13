# M59 public Testnet self-service onboarding release guide

## Scope and proof boundary

This change makes public Testnet onboarding available only after the operators
explicitly enable it. It does not authorize a production deployment, a Convex
schema deployment, a wallet signature, an HBAR transfer, an ATS deployment, or
an allocation. Automated tests and read-only factory-call evidence are not a
replacement for a two-wallet deployed-Testnet rehearsal.

## Required configuration

Set these backend environment variables before enabling the feature. Do not
put their values in source control.

| Variable | Required value |
| --- | --- |
| `TOOL402_PUBLIC_TESTNET_SELF_SERVICE_ENABLED` | `true` only during the enabled Testnet window; any other value disables new self-service writes. |
| `TOOL402_SELF_SERVICE_MAX_TOOLS` | Integer from `1` through `100`; absent or malformed blocks self-service tool creation. |
| `TOOL402_SELF_SERVICE_MAX_PENDING_ATTEMPTS` | Integer from `1` through `100`; absent or malformed blocks new frozen self-service backing intents. |
| `TOOL402_SELF_SERVICE_MAX_BACKING_INTENTS_PER_HOUR` | Integer from `1` through `100`; absent or malformed blocks new frozen self-service backing intents. This durable per-wallet window cannot be reset by refreshing the page. |
| `TOOL402_INGRESS_KEY_ID`, `TOOL402_INGRESS_SECRET`, `TOOL402_CONVEX_SITE_URL` | Existing authenticated provider-session ingress configuration. |
| `TOOL402_FUNDING_EVM_ADDRESS` | Existing legacy RiskScan recipient only. New provider offerings persist their owner-recipient policy instead. |

## Rollout and rollback

1. Deploy the additive schema and application while the public flag is absent
   or `false`.
2. Confirm the authenticated dashboard/session and provider-session ingress
   return an unavailable state rather than a usable button when configuration
   is incomplete.
3. Configure conservative quotas, then set the public flag to `true`.
4. Run the two-wallet checklist below before describing the flow as deployed
   or demo-ready.
5. To stop new self-service activity, set the flag to `false` and redeploy.
   This is non-destructive: existing tools, frozen attempts, payment claims,
   and receipt recovery records remain readable through their scoped paths.

## Two-wallet Testnet checklist

- Wallet A signs in, receives a membership, creates a tool, creates its
  offering, deploys and publishes it through the existing explicit ATS flow.
- Wallet B signs in independently, discovers A's OPEN offering, and sees A's
  wallet as the recipient only after the server has projected the persisted
  recipient policy.
- B chooses a valid whole-unit amount. The server freezes offering, recipient,
  units, tinybars, parameter hash, attempt identity, and expiry before the
  `HEDERA_FUNDING` signature is shown.
- B explicitly signs the intent and separately confirms the MetaMask HBAR
  transfer. A signature alone sends no HBAR.
- Reload after reservation and after a submitted hash. Confirm that only the
  scoped offering record is shown and no second transfer request is made.
- Check the rejected paths: A backing itself, closed/draft offering, expired
  session, wallet mismatch, feature flag off, malformed quota, quota reached,
  invalid network, rejected signature, and reused transaction hash.

## Validation recorded locally

- Targeted command, provider, backing, projection, and UI tests passed on the
  branch before this guide was written.
- Backend and web typechecks and `npm run queue:check` passed locally.
- No browser-authenticated deployed-Testnet transaction was performed.
