# Tool402

Tool402 is a testnet marketplace for verifiable machine-paid tools. An agent
discovers a tool, receives an explicit x402 payment challenge instead of a
fabricated result, pays on Hedera testnet, gets one bounded result, and keeps
a receipt that ties request, payment, and result together. A provider can
prepare a tool offering, sign a small set of EIP-712 commands from MetaMask,
and, under a separate human gate, issue a revenue note through the official
Asset Tokenization Studio contracts.

The first tool is RiskScan: a bounded, explainable risk assessment for a
request context. Everything in this repository is built for ETHOnline on
Hedera testnet and makes no production, mainnet, or financial claim.

## What is verified, what is not

Local behaviour is proven by tests, typecheck, and browser checks on every
accepted card. Live behaviour is proven only by human-recorded evidence. The
current split is recorded in `docs/work-queue/STATE.md` and
`docs/work-queue/HUMAN-ACTIONS.md`; the short version:

- Verified locally: the RiskScan x402 route, the Agent payment client, the
  tool directory, the public web routes, the wallet island and command relay,
  the provider deploy wizard with its signing bridge, the Convex admission
  and ingress boundaries, and the ATS_CREATE configuration projection.
- Verified live, as redacted human evidence: one x402 Hedera testnet paid
  request, one named Convex development deployment with its ingress key pair,
  and the funded testnet issuer account.
- Pending human actions: public deployment, the Agent payment exercise on the
  public host, the ATS Stage B live execution, the demo video, and the
  submission.

Nothing below claims a public URL, a live revenue note, or a payment that the
evidence records do not name.

## Quick start

Requires Node 22 and npm 10. `nvm use` selects the pinned Node.

```sh
nvm use
npm ci
npm run typecheck
npm test
npm run lint
npm run queue:check
```

Run the web app locally:

```sh
npm run dev --workspace=apps/web
```

With no runtime configuration the app runs in its unconfigured state: the
RiskScan route answers that no payment configuration exists, the directory
lists RiskScan without a live endpoint, and the command relay answers
`not_configured`. Every screen renders that state truthfully instead of
mocking success.

## Architecture

npm workspaces, one repository:

| Workspace          | Role                                                                                                                                                                                                                           |
| ------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `packages/core`    | Pure TypeScript domain: RiskScan assessment, x402 challenge and evidence types, offering terms and revenue math, EIP-712 command payload parsers with RFC 8785 canonical bytes, ATS configuration and authority rules. No I/O. |
| `packages/backend` | Convex backend: durable RiskScan request and settlement records, offering and Tool Directory admission, the HMAC-protected HTTP command ingress, wallet-command normalization, the fail-closed ATS prepare-authority gate.     |
| `apps/web`         | Next.js app: public landing, Explore, RiskScan detail and Try flows, guest workspace, the x402-protected RiskScan API, the tool directory API, the command relay, the provider deploy wizard with the MetaMask signing bridge. |
| `apps/agent`       | The consumer agent: discovers RiskScan through the directory, handles the `402` challenge, pays through the x402 Hedera scheme, and verifies the result and evidence. Ships a CLI for the human-run testnet exercise.          |

Web routes:

| Route                                 | Purpose                                                                     |
| ------------------------------------- | --------------------------------------------------------------------------- |
| `/`                                   | Public landing                                                              |
| `/explore`, `/explore/riskscan`       | Tool catalogue and RiskScan detail                                          |
| `/explore/riskscan/try`               | Bounded browser request against the RiskScan route                          |
| `/explore/riskscan/tool-loop`         | Browser view of the agent discovery, challenge, payment, and result loop    |
| `/dashboard`, `/dashboard/riskscan/*` | Guest workspace: request state, quick preflight, native-quote compatibility |
| `/demo`                               | Guided narration of the loop                                                |
| `/provider/deploy`                    | Provider campaign wizard and stage signing                                  |
| `POST /api/riskscan`                  | x402-protected RiskScan Quick assessment                                    |
| `GET /api/tools`                      | Tool directory                                                              |
| `POST /api/commands`                  | Relay from the browser wallet to the Convex ingress                         |

Convex HTTP actions: `POST /internal/commands` (HMAC-authenticated command
ingress), `GET /public/offerings/*` and `GET /public/directory/*` (public
projections that expose no hash, nonce, or signature).

## Payment flow

1. The agent reads `GET /api/tools` and finds RiskScan, its capability,
   advertised tiers, and payment network.
2. The agent posts a request to `POST /api/riskscan`. With no payment the
   route answers `402` with a `PAYMENT-REQUIRED` header carrying the x402 v2
   challenge; the assessment does not run.
3. The agent evaluates the challenge against its own policy, then pays through
   the x402 Hedera scheme with its own signer. Two closed configuration
   families exist: an EVM CAIP-2 family and a native Hedera testnet family
   that quotes an exact HBAR amount through the facilitator.
4. The facilitator settles; the route runs the bounded assessment only after a
   verified settlement and returns a structured result or an explicit failure.
5. The route records the settlement attempt and evidence durably in Convex.
   The response carries a receipt reference; the workspace pages render
   request state, pending settlement, and finality without inferring success.

No key, funded account, or signed payload lives in this repository. The agent
CLI reads its signer only from the environment of the human who runs it:

```sh
RISKSCAN_PAY_SERVICE_BASE_URL=https://<host> \
RISKSCAN_PAY_INPUT_JSON='{...}' \
RISKSCAN_PAY_POLICY_JSON='{...}' \
RISKSCAN_PAY_PAYER_ACCOUNT_ID=0.0.<id> \
RISKSCAN_PAY_PAYER_PRIVATE_KEY=<never committed> \
npm run riskscan:pay --workspace=apps/agent
```

## Provider campaign and tokenization flow

The provider path is a hybrid: every wallet-signed intent is admitted by
Convex first, Hedera receipts stay authoritative for anything on-chain, and an
offering reaches a state only through a verified record, never a wallet
callback.

1. The provider fills the deploy wizard: tool details, capability, prices,
   funding and revenue-note terms (v1: 1,000 HBAR target, 1 HBAR notes, 80 /
   20 / 0 routing, 1,500 HBAR payout cap).
2. On the review step the provider connects MetaMask on Hedera Testnet
   (`0x128`). The signing bridge builds one EIP-712 `Tool402Command` per
   stage over the canonical payload bytes: `offering.create`,
   `external.prepare` (ATS_CREATE), `external.attachCandidate`, and
   `directory.publish`. Each request uses one clock reading and a fresh
   idempotency key; nothing is retried.
3. The browser posts `{ command, payload }` to `/api/commands`. The relay
   signs the body with the ingress HMAC key and forwards it to the Convex
   ingress, which verifies the envelope, claims the replay identity, normalizes
   the wallet command against the command authority, and admits it durably.
   The relay returns only the backend outcome: `ACCEPTED`, `REPLAYED`,
   `CONFLICT`, `REJECTED`, or `UNSUPPORTED_TYPE`.
4. The revenue note itself is created by the provider's own MetaMask through
   the official Asset Tokenization Studio SDK against the SDK 8.0.0 testnet
   factory. The backend never holds a key. Receipt verification against
   Mirror Node moves the offering from `ASSET_PENDING` to `READY`; only then
   can the directory publish. Live execution sits behind a separate human
   gate (`HA-ATS-STAGE-B-001`).

## Runtime configuration

All values are read from the host environment at request time. None is
tracked. Names only:

| Variable                                                                                                | Read by                                                                             |
| ------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------- |
| `RISKSCAN_X402_PAY_TO`, `RISKSCAN_X402_FACILITATOR_URL`, `RISKSCAN_X402_NETWORK`, `RISKSCAN_X402_PRICE` | `POST /api/riskscan`, EVM family                                                    |
| `RISKSCAN_X402_HEDERA_ASSET`, `RISKSCAN_X402_HEDERA_AMOUNT`                                             | `POST /api/riskscan`, native Hedera family (mutually exclusive with the EVM family) |
| `TOOL402_INGRESS_KEY_ID`, `TOOL402_INGRESS_SECRET`, `TOOL402_CONVEX_SITE_URL`                           | `POST /api/commands` relay; the same key pair is set on the Convex deployment       |
| `RISKSCAN_PAY_*`                                                                                        | Agent CLI only                                                                      |

## How this repository is run

The repository is operated as a work queue. `AGENTS.md` is the runtime
authority; `docs/work-queue/` holds the queue, the task catalogue, the
decisions and human-action ledgers, and review evidence; `docs/specs/` and
`docs/ui/` hold the per-card contracts. Each card lands as a test-only RED
contract, a minimal GREEN, and independent reviews before acceptance. Humans
add work through inbox cards and pull requests; only the root integrator
advances queue state.

## Boundaries

Testnet only. Experimental terms. No yield, principal, or return is promised.
Credentials, keys, funded accounts, and signed payloads never enter tracked
files. A connected wallet is not an authority, a signature is not an accepted
command, and a relayed `ACCEPTED` is a backend admission, not an on-chain
fact.
