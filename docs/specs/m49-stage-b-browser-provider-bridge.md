# M49 Stage-B browser/provider bridge

## Delivery boundary

M49 creates the minimum client-side execution boundary that the accepted M42,
M44, M47, and M48 local controls intentionally deferred. It uses one fixed
public execution projection to produce accepted Factory calldata, makes at most
one explicitly human-clicked MetaMask transaction, observes its outcome through
bounded public reads, and returns a local candidate only when every identity
link corroborates.

The card is implementation authority only. It does not itself authorize a
wallet, provider, transaction, candidate attachment, Mirror request, asset,
receipt verification, lifecycle operation, funding, deployment, or live claim.
HA-ATS-STAGE-B-001 remains the sole execution authority.

## Fixed execution projection

`stage-b-ats-create-execution-projection.ts` exports one function that creates
a detached, deeply frozen non-secret object with two parts:

```text
configuration: exact complete M42 real-issuer configuration
issuerEvmAddress: 0xc89f87052c3e080b4a9b021d4930055031ef378e
issuerHederaAccountId: 0.0.10430887
mirrorNodeBaseUrl: https://testnet.mirrornode.hedera.com/api/v1/
```

`configuration` has exactly M42's closed root, descriptor, and parameter
fields. Its JCS/Keccak preimage excludes its root
`canonicalParametersHash`; every call recomputes and requires exactly:

```text
1880065c5ae64b3fc6279cfdd8c85a6880d43e98ce129ed697c72372204296f9
```

It contains the accepted real issuer/factory/descriptor/parameters already
represented in the local M42/M44 boundary. It is not imported from private
Backend source, supplied by a caller, used as a command projection, or treated
as server authority. The existing M47 six-field command projection and S16
display projection remain separate and unchanged.

The fixed issuer Hedera account is public human evidence from HI-004. It is not
a key, account capability, provider selection, or transaction authority.

## Browser transaction boundary

`stage-b-browser-provider-bridge.ts` receives injected EIP-1193 provider,
fetch, and bounded wait dependencies. Tests inject all three. It accepts no
caller configuration, host, URL, Factory, issuer, candidate id, calldata, or
receipt.

Before `eth_sendTransaction`, it must:

1. call `eth_chainId` and require exactly `"0x128"`;
2. call `eth_accounts`, require exactly one valid EVM address, normalize that
   valid address to lowercase, then require exact equality with the execution
   projection issuer. It must not silently accept an invalid address or loosen
   the strict-lowercase parser for trusted M42 configuration inputs;
3. create the execution projection and require its digest;
4. pass only its exact `configuration` and `issuerEvmAddress` to the accepted
   M44 request builder, then encode it with the accepted M44 encoder.

The sole transaction request is exactly:

```text
eth_sendTransaction({
  from: fixed canonical issuer,
  to: fixed M42 Factory address,
  data: accepted M44 deployBond calldata,
  value: "0x0"
})
```

There is no caller gas, value, target, data, configuration, chain, signer, or
provider override. A returned transaction hash must be canonical lowercase
`0x` plus 64 hexadecimal characters. The user can reject before a hash; that
is a local rejected result with no candidate.

One page-session controller owns this action. It synchronously acquires its
private invocation mutex before its first `await` or provider request, so two
same-tick clicks cannot race to `eth_sendTransaction`. A pre-hash wallet
rejection releases only the in-flight mutex for a later explicit click. Once a
hash is returned, the controller latches terminal state for the page session:
successful candidate and `submission_unknown` outcomes both reject every later
invocation without another send. Reload is the only reset. The UI holds this
controller in a ref rather than constructing it per click.

The bridge polls only `eth_getTransactionReceipt` for a fixed maximum of five
observations across five seconds. It requires a same-hash successful receipt,
Factory `to` equal to the M42 target, and exactly one valid Factory-emitted
`BondDeployed` log. Before M44 sees a candidate log, its emitter `address` must
be a valid EVM address normalized to the fixed Factory; any matching
`BondDeployed` event from another emitter, or multiple qualifying Factory
events, rejects. M44 then validates the decoded non-zero EVM address before
returning canonical lowercase. A missing or non-successful receipt, wrong
identity, timeout, malformed result, or event ambiguity produces
`submission_unknown` without candidate or resend.

## Fixed Mirror candidate resolver

The bridge's only public read base is the literal M42 testnet Mirror base. It
uses injected `fetch` with `GET`, `credentials: "omit"`, `redirect: "error"`,
`cache: "no-store"`, a five-second abort signal, a one-mebibyte body cap, JSON
content type, no caller-selected headers, and no redirect/fallback host. Each
path is constructed only from an already validated canonical hash, timestamp,
or returned canonical transaction id. Every externally returned EVM address is
first parsed as a valid EVM address and only then normalized to lowercase for
comparison with the fixed issuer or Factory; this does not relax any trusted
configuration-input parser.

After receipt/event validation, resolver order is exact:

1. Read `contracts/results/{evmTransactionHash}?nonce=0`. Require a 200 JSON
   own-data record with the exact same canonical EVM hash, `chain_id`
   `"0x128"`, `result === "SUCCESS"`, `status === "0x1"`, a valid normalized
   `from` equal to the fixed issuer, a valid normalized `to` equal to the
   fixed Factory, one canonical timestamp matching
   `^(?:0|[1-9][0-9]{0,9})\\.[0-9]{9}$` in its `timestamp` field, and exactly one Factory-emitted
   `BondDeployed` log. Before M44 decodes it, that log's valid normalized
   emitter must equal the fixed Factory; any matching non-Factory event or
   more than one qualifying event rejects.
2. Read `transactions?account.id=0.0.10430887&timestamp=eq:{timestamp}&transactiontype=ETHEREUMTRANSACTION&limit=100&order=asc`.
   Require an own-data object with exactly one own `transactions` array entry.
   The client does not inspect or follow `links`. That entry must have
   `name === "ETHEREUMTRANSACTION"`, `result === "SUCCESS"`, `nonce === 0`,
   the exact first-result `timestamp` in its `consensus_timestamp`, and one
   returned `transaction_id` accepted by the M44 normalizer. Do not manufacture
   an id from the timestamp, `from`, or account id.
3. Read `contracts/results/{returnedTransactionId}?nonce=0`. Require the same
   hash, network, `result === "SUCCESS"`, `status === "0x1"`, normalized
   issuer, normalized Factory, exact `timestamp`, and exactly one
   Factory-emitted `BondDeployed` log whose decoded address equals the
   receipt-derived canonical address.
4. Normalize only the returned `transaction_id` through the accepted M44
   `normalizeHederaCandidateTransactionId`, then return:

   ```text
   { transactionId: mirror-form id, evmAddress: canonical non-zero address }
   ```

Mirror indexing may lag a mined receipt, so observation uses at most three
fixed read-only cycles over five seconds. A cycle performs the three reads in
order and waits only when the relevant endpoint is unindexed (a 404 for a
ContractResult or an empty transaction array); it never sends again. Every
present malformed, non-200 other than that 404, bad-content-type, byte-cap,
mismatched hash/chain/result/status/from/to/timestamp/event emitter,
missing/ambiguous record, invalid candidate id, or address mismatch is terminal
`submission_unknown`. Exhausting the three cycles is also terminal. It may not
set a candidate, sign or relay `external.attachCandidate`, retry/resubmit,
invoke M43, or make an asset or finality claim.

## UI/session integration

The existing WalletIsland is given the fixed issuer as its approved issuer.
The action is enabled only after stage 2 is locally `done`, no candidate has
been produced, the exact WalletIsland session is present, and the page-session
controller has not latched a post-hash terminal outcome. It is always manual:
no render, effect, timer, reconnect, or stage transition calls the bridge. The
synchronous controller mutex prevents both same-tick and later post-hash
second sends.

The successful candidate is held only in `DeployStageSigning` React state and
fed into the existing stage state machine. It unlocks—not performs—the
existing separately signed `external.attachCandidate` substep. Reload clears
the candidate and every action result. Safe local feedback distinguishes a
wallet rejection from `submission_unknown`; it contains no raw provider error,
transaction payload, private data, key, signed header, or response body.

## Verification contract

- Execution-projection tests prove every closed literal, rehash, deep freeze,
  detachment, no private Backend import, no S16/M47 use, and no caller input.
- Bridge tests use fakes and prove wrong chain/signer/configuration rejects
  before send; valid EIP-55 account normalization; only one correct
  `eth_sendTransaction` shape; receipt validation including Factory emitter
  validation before every fetch; and no branch sends twice.
- Resolver tests prove the exact bounded read cycles/paths/options, strict own
  record parsing while never following `links`, result/status/hash/chain/issuer/Factory/
  timestamp/event-emitter correlations, returned-id normalization,
  ambiguity/timeout/cap failure, and zero candidate/attach on every failure.
- UI tests prove explicit click-only behavior, a synchronous same-tick mutex,
  a post-hash session latch that blocks later clicks after `submission_unknown`,
  session-only candidate capture, no auto-attach/sign, accessible safe
  feedback, and no persistence/configuration/Backend import.
- Existing M44 direct artifact/viem tests continue to prove source ABI use and
  exact calldata; M42, M47, S16, M33, M41, M43, and submission documents stay
  unchanged.

## Explicit exclusions

M49 does not change any canonical configuration field/hash, M33 mapping,
server authority, Convex publication, environment, package/lockfile, SDK,
wallet key, account setup, funding, fee decision, M43 verification, offering
state, asset lifecycle, clearing, HCS, payout, deployment, or submission. A
successful local candidate means only that this browser session observed one
corroborated candidate. It is not proof of finality, a verified asset, or a
completed campaign.
