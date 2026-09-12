# HA-B03-AGENT-PAYMENT-001 — Consumer Agent payment run packet

## Status and scope

**PENDING — Human Ops only.** This packet prepares one bounded Hedera-testnet
Consumer Agent payment. It neither authorizes nor records that payment.

The non-payable preflight was checked at source
\`00b80850b2eb839638eb851b7942241905be592c\` against
\`https://tool402.vercel.app\` and returned:

\`\`\`text
RISKSCAN_PAY_DIAGNOSTIC PREFLIGHT_GUARD_REACHED
\`\`\`

This proves only discovery, policy evaluation, and a matching unsigned \`402\`.

## Fixed command sequence

Run from the submitted checkout using Node \`22.21.1\`. Replace the host only
after confirming it serves the submitted commit.

\`\`\`sh
export RISKSCAN_PAY_SERVICE_BASE_URL='https://tool402.vercel.app'
export RISKSCAN_PAY_INPUT_JSON='{"requestRef":"b03-release-001","subjectRef":"tool402-release","context":"One authorized Hedera-testnet RiskScan exercise","declarations":{"identity":true,"pricing":true,"limitations":true,"evidence":true}}'
export RISKSCAN_PAY_POLICY_JSON='{"network":"hedera:testnet","asset":"0.0.0","maximumAmount":"100000"}'
npm run riskscan:pay --workspace=@tool402/agent -- --preflight
\`\`\`

Expected preflight exit status is \`0\`, with exactly:

\`\`\`text
RISKSCAN_PAY_DIAGNOSTIC PREFLIGHT_GUARD_REACHED
\`\`\`

Only after that output, Human Ops privately supplies the disposable payer
account and private key through ignored runtime configuration. Never paste a
key into shell history, a recording, ticket, or repository. Then run:

\`\`\`sh
: "\${RISKSCAN_PAY_PAYER_ACCOUNT_ID:?set privately in ignored runtime configuration}"
: "\${RISKSCAN_PAY_PAYER_PRIVATE_KEY:?set privately in ignored runtime configuration}"
npm run riskscan:pay --workspace=@tool402/agent
\`\`\`

The only successful terminal output is:

\`\`\`text
RISKSCAN_PAY_OUTCOME paid
RISKSCAN_PAY_SETTLEMENT <non-empty-safe-settlement-reference>
RISKSCAN_PAY_DIAGNOSTIC PAID
\`\`\`

The CLI makes one unsigned request and at most one signed retry. It permits
only \`hedera:testnet\`, asset \`0.0.0\`, and a maximum \`100000\` atomic units.

## Blocky402 configuration gate

The server uses \`RISKSCAN_X402_FACILITATOR_URL\`; Blocky402 is not hard-coded.
It constructs \`HTTPFacilitatorClient\` from that value and requires an exact v2
\`exact\` \`hedera:testnet\` capability with a fee payer. Human Ops must attest,
outside this repository, that the deployed value is exactly
\`https://api.testnet.blocky402.com\` and that startup capability validation
succeeded. The directory and public \`402\` cannot prove this identity.

## Preconditions, stops, and evidence

Before payment record submitted SHA, service host, payer public account ID,
asset/cap, timestamp, and the Blocky402 attestation. Use a disposable,
testnet-only payer.

Stop permanently—no retry—on any non-zero preflight; directory, quote, or
challenge mismatch; changed network/asset/amount/facilitator; configuration or
key error; rejected payload; signed-retry failure; malformed settlement;
missing result; ambiguous transaction; or uncorroborated finality.

After one success, retain only secret-free facts: submitted/deployed SHA, host,
payer public ID, asset/cap, Blocky402 attestation, terminal CLI lines, safe
result digest, public Mirror/HashScan finality link, timestamp, and an
attestation that no key/header/payload/funded secret was tracked.
