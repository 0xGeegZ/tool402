# Tool402

> **Back the tools agents pay to use.**

Tool402 is a marketplace for verifiable, machine-paid tools. A Consumer Agent
can discover a bounded capability, meet an explicit `402 Payment Required`
challenge, and receive a result only after verified x402 settlement. Providers
can prepare a campaign without giving the application custody of their wallet
or keys.

The judged/demo path is Hedera testnet. The source retains a generic EVM x402
configuration branch, but no mainnet use is configured, rehearsed, or
evidenced. Tool402 is not a custody or investment product and makes no promise
of yield, principal, users, revenue, or returns.

## Judge summary

**Flow:** Agent → Tool Directory → unpaid tool request → x402 `402` →
spend-policy check → payment proof to the same tool service →
service/facilitator verification → bounded result.

- **RiskScan Quick** is the first listed tool: an explainable, caller-context
  assessment, not financial, legal, insurance, security, or identity advice.
- **EntityCheck** exists at `POST /api/entitycheck` for a source-bounded
  French-entity assessment. It is not yet in the canonical directory and its
  live sources and payment configuration are intentionally absent.
- **Providers** can review EIP-712 campaign commands. A local Factory-artifact
  + viem seam tests ATS revenue-note encoding/decoding, but is not wired to a
  provider transaction flow.

For RiskScan, the Agent reads the directory, evaluates a Hedera-asset quote,
then posts its payment proof back to the tool service. The service—not the
Agent—uses its configured facilitator to validate settlement before releasing
the result. Blocky402 is not hard-coded or evidenced here; name it in a final
demo only if its configured-facilitator `402 → payment → protected 200` path
is independently recorded.

No funding, payout, HCS event, allocation, or mainnet payment is implemented
or claimed for the Hedera-testnet demo.

## Architecture

### Consumer Agent

`apps/agent` contains the consumer boundary. It discovers RiskScan from
`GET /api/tools`, rejects malformed directory or challenge data, applies an
explicit native-Hedera spending policy, and performs at most one signed retry
after the initial unsigned request. Its CLI is a human-run testnet exercise;
the payer account and private key stay in ignored runtime configuration.

### Marketplace roles

| Actor | Responsibility | What it never proves alone |
| --- | --- | --- |
| Consumer Agent | Discovers a descriptor, evaluates policy, submits payment proof to the tool service, and validates the returned result shape. | A wallet, unsigned request, or `402` response is not payment. |
| Tool service | Publishes bounded metadata, challenges unpaid requests, obtains facilitator validation, and returns the bounded result. | Configuration is not public deployment or payment completion. |
| Provider | Prepares campaign commands for review. | A signature or relay outcome is not an ATS event. |
| Human operator | Owns wallet access, funding, live configuration, deployment, narration, and submission. | No agent receives those authorities by default. |

### Provider campaign

The provider flow in `apps/web` is a preparation and signing boundary:

`Provider wizard → MetaMask EIP-712 signature → POST /api/commands → HMAC-protected Convex ingress`

The ingress checks the authenticated envelope, expiry, command authority,
canonical payload, idempotency, and replay identity before durable admission.
It returns an admission outcome such as `ACCEPTED`, `REPLAYED`, `CONFLICT`, or
`REJECTED`; none of these means that an on-chain action happened.

### Hedera ATS revenue note

Tool402 includes a tested local revenue-note encode/decode seam using the
official `@hashgraph/asset-tokenization-contracts@8.0.0` Factory artifact and
existing `viem@2.56.1`. It validates the accepted configuration, encodes
`deployBond`, and can decode `BondDeployed`; it does **not** prompt a wallet,
call an RPC, simulate, send a transaction, or deploy an asset.

This direct Artifact + viem path is the selected local implementation decision;
the earlier SDK browser-bundle work is historical fallback evidence. It is not
currently wired into the provider campaign: the live UI exposes only a disabled
“Create revenue note — unavailable” control. `HA-ATS-STAGE-B-001` remains the
sole authority for any later provider interaction, signing, transaction,
candidate attachment, Mirror Node verification, or lifecycle action. There is
no live ATS deployment or successful Stage B claim.

## Security and authority model

- Runtime secrets, private keys, signed payment headers, and funded-account
  values are never committed. Documentation names variables but never gives
  values.
- The web relay authenticates browser command bodies to Convex with an HMAC;
  the command itself is EIP-712 signed, canonicalized, expiry-bound, and
  replay/idempotency checked.
- Payment, command admission, receipt verification, and directory publication
  are separate states. A `402`, wallet signature, relay `ACCEPTED`, or pending
  receipt cannot be presented as final settlement or issuance.
- ATS verification fails closed: current ATS paths are `NOT_CONFIGURED` until
  the separate human Stage B authority and its successor verification work
  exist.

## Run locally

Requires Node 22 and npm 10. Use the repository pin before installing or
testing:

```sh
nvm use
npm ci
```

Run quality checks:

```sh
npm run typecheck
npm run lint
npm run test
npm run queue:check
```

Run the web app:

```sh
npm run dev --workspace=@tool402/web
```

Run the consumer Agent exercise only after Human Ops has provided approved,
ignored testnet configuration:

```sh
npm run riskscan:pay --workspace=@tool402/agent
```

### Runtime-variable names only

Do not commit, paste, or log the values for any of these variables.

| Scope | Variable names |
| --- | --- |
| RiskScan x402 | `RISKSCAN_X402_PAY_TO`, `RISKSCAN_X402_FACILITATOR_URL`, `RISKSCAN_X402_NETWORK`, plus either `RISKSCAN_X402_PRICE` for the EVM family or `RISKSCAN_X402_HEDERA_ASSET` and `RISKSCAN_X402_HEDERA_AMOUNT` for native Hedera. |
| EntityCheck x402 and sources | `ENTITYCHECK_X402_PAY_TO`, `ENTITYCHECK_X402_FACILITATOR_URL`, `ENTITYCHECK_X402_NETWORK`, plus either `ENTITYCHECK_X402_PRICE` or `ENTITYCHECK_X402_HEDERA_ASSET` and `ENTITYCHECK_X402_HEDERA_AMOUNT`; also `ENTITYCHECK_REGISTRY_BASE_URL`, `ENTITYCHECK_SANCTIONS_URL`. |
| Provider command relay | `TOOL402_INGRESS_KEY_ID`, `TOOL402_INGRESS_SECRET`, `TOOL402_CONVEX_SITE_URL`. |
| Agent CLI | `RISKSCAN_PAY_SERVICE_BASE_URL`, `RISKSCAN_PAY_INPUT_JSON`, `RISKSCAN_PAY_POLICY_JSON`, `RISKSCAN_PAY_PAYER_ACCOUNT_ID`, `RISKSCAN_PAY_PAYER_PRIVATE_KEY`. |

Without configuration, routes remain explicitly unavailable rather than
inventing a payment, source read, or deployment result.

## Expected demo journey

Use the following only with evidence from the recorded commit:

1. Open Explore or the Tool Loop and explain the thesis: agents discover a
   useful tool before they pay.
2. Inspect RiskScan's scope and limitations, then send one valid request to
   show the explicit `402` boundary.
3. On an approved public testnet host, run the Consumer Agent once with its
   bounded spend policy and show the protected result only after verified
   payment evidence. Do not simulate a successful payment.
4. Open the provider campaign page and show the signed-command boundary and
   disabled Factory-artifact control. Before Stage B, state that it is not
   wired for execution—do not imply a deployed revenue note.
5. If Stage B later completes, replace the centralized evidence placeholders
   in the submission pack and show only the independently checkable testnet
   transaction and receipt outcome.

The under-four-minute narration, evidence checklist, prize copy, and the
single replacement table live in [the submission pack](docs/submission/README.md).

## Repository structure

```text
apps/agent       Consumer Agent, x402 policy/payment boundary, CLI
apps/web         Next.js marketplace, provider flow, protected API routes
packages/core    Pure domain models, parsers, lifecycle and security rules
packages/backend Convex admission, replay, directory, and receipt boundaries
docs/specs       Committed implementation contracts
docs/submission  Draft judge-facing submission material; not a submission
docs/work-queue  Local control-plane records and human-action gates
```

## Current limitations

- Public RiskScan deployment: [https://tool402.vercel.app](https://tool402.vercel.app)
  serves source commit `5de50e0ae045b60e6091877b7092d38b55178975`; only
  nonpayable public smokes are recorded. The Consumer Agent CLI paid exercise
  remains pending.
- EntityCheck is implemented as a protected endpoint but is not yet in the
  canonical Tool Directory; its live source configuration is pending.
- Stage B is pending: no live revenue note, ATS asset, provider transaction,
  candidate attachment, or positive ATS receipt verification is claimed.
- Funding, clearing, payouts, HCS publication, allocation, and holder
  distribution are outside the implemented demo.
- The final video and event submission remain human-owned actions.

See [the submission pack](docs/submission/README.md) for the deliberate final
evidence placeholders and the items that must be refreshed after rehearsal.
