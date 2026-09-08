# S15 implementation plan — MetaMask wallet island and command relay

Execution plan for [S15-T010](../../work-queue/queue/00-inbox/S15-T010-metamask-wallet-island.md)
against the [UI-S15 manifest](../../ui/UI-S15.md), the
[HA-COMMAND-AUTHORITY-001 decision](../../work-queue/evidence/HA-COMMAND-AUTHORITY-001-decision.md),
the [M22 envelope contract](../../specs/m22-ingress-envelope.md), the
[M23 verifier contract](../../specs/m23-protected-ingress-verifier.md), and
the [M30 normalizer contract](../../specs/m30-authenticated-external-prepare-normalizer.md).
It is delivered from the human-requested worktree lane recorded on the card.

## Module boundaries

`apps/web/src/lib/wallet/metamask-provider.ts` owns provider discovery and the
raw provider reads. It exports `discoverMetaMaskProvider(target, settle?)`,
which registers the `eip6963:announceProvider` listener only for the duration
of one call, dispatches `eip6963:requestProvider`, waits one settle tick,
removes the listener, and returns the closed `ProviderSelection` union
(`selected`, `no_provider`, `multiple_providers`). Candidates are deduplicated
by provider identity and accepted only with `info.rdns === "io.metamask"` and
`provider.isMetaMask === true`; the legacy `target.ethereum` fallback is
consulted only when nothing at all was announced and its `isMetaMask` is
`true`. It also exports `readChainId`, `readSignerAddress` (validated and
lower-cased once), `switchToHederaTestnet` (one `wallet_switchEthereumChain`,
falling back to `wallet_addEthereumChain` only on the unrecognized-chain error
code `4902`), and the frozen `HEDERA_TESTNET_ADD_CHAIN_PARAMETERS` literal.
Nothing runs at module load.

`apps/web/src/lib/wallet/wallet-state.ts` owns the closed seven-kind
`WalletState` union and the gate. `connectWallet({ discover,
approvedIssuerAddress? })` runs discovery, `eth_requestAccounts`, and the
chain gate; `recheckAfterSwitch(provider, approvedIssuerAddress?)` performs the
one user-initiated switch and then re-reads `eth_chainId` through the same
gate, so a resolved switch request is never treated as evidence. `not_issuer`
is reachable only when the caller supplies `approvedIssuerAddress`.

`apps/web/src/lib/wallet/tool402-command.ts` owns the frozen domain, types,
primary type, nonce and timestamp grammars, the Keccak-256 digest over
caller-supplied canonical payload bytes, `createUnsignedCommand`,
`createTypedDataJson`, `signCommand` (`eth_signTypedData_v4` only, signature
grammar enforced, never re-cased), and `createCommandBody`, which embeds the
caller's canonical payload text verbatim beside the nine-field transport
command. The only payload field it reads is `expiresAt`, to enforce the
byte-for-byte equality rule; it owns no payload schema or canonicalizer.

`apps/web/src/lib/wallet/command-relay.ts` owns the closed eight-outcome
`RelayOutcome` union, the server handler `handleCommandRelayPost(request, env,
dependencies?)`, and the browser helper `relayCommandBody(body, fetch?)`. The
handler validates the three environment names, hashes the exact received
bytes, builds the M22 envelope with a fresh 16-byte transport nonce and the
HMAC SHA-256 MAC over the M22 signing input, forwards the same bytes to
`<site>/internal/commands` under a 10 000 ms timeout, `redirect: "error"`,
and a 4096-byte response cap, and maps only the five documented backend
outcomes. Every other condition is `transport_failure` or
`unexpected_response`; nothing is retried, logged, echoed, or stored. Web
Crypto is used on both sides so the module carries no `node:` import.

`apps/web/src/app/api/commands/route.ts` exports `POST` only and passes
`process.env` to the handler, the accepted pattern of the RiskScan route.

`apps/web/src/components/wallet/wallet-connect.tsx` renders one control per
wallet state with a retry control on every refusal and the single switch
control on `wrong_chain`; discovery starts on click, never on render.
`apps/web/src/components/wallet/signature-dialog.tsx` renders the closed
seven-phase dialog: `waiting` re-reads the signer and chain and signs with a
fresh nonce, `checking` relays, and the backend outcome selects `complete`,
`failed`, or `unknown`; a declined signature is `rejected` and nothing was
sent. Refusal wording lives in `failed` and `complete` messages.

## Configuration form

`TOOL402_INGRESS_SECRET` is accepted only as 64 lower-case hexadecimal
characters encoding the 32-byte HMAC key; `TOOL402_INGRESS_KEY_ID` must satisfy
the M22 `keyId` grammar; `TOOL402_CONVEX_SITE_URL` must be an `https:` origin
with no path, query, or fragment. Any other form is `not_configured`, so
HA-CAMPAIGN-CONVEX-001 should record the secret in that hexadecimal form and
M41 should decode the same form.

## Sequence

1. Commit this plan on the lane branch.
2. Commit the four focused tests and the amended dependency assertion in
   `apps/web/tests/static-shell.test.mjs` as one test-only RED commit, and
   observe every new test fail only because the declared modules and the
   `viem` pin are absent.
3. Add the four library modules, then the route, then the two components,
   each as a minimal GREEN change, and observe the focused tests pass.
4. Add the `viem` 2.56.1 pin to `apps/web/package.json` and the root
   `package-lock.json` in its own commit under the recorded reservation.
5. Run Web typecheck, test, and production build, root typecheck, test, lint,
   and `queue:check`, and a clean-install dry run.
6. Independent review in a fresh context, then push the branch for the root's
   review and integration decision.

## Minimality notes

The browser and the relay share one nonce encoder, because both grammars are
16 random bytes rendered as 22 unpadded base64url characters; the values are
always distinct because each call draws fresh bytes.

The relay does not parse or size-limit the request body: the backend applies
its own 65 536-byte cap and answers `REJECTED`, and parsing would break the
digest the manifest requires.

The relay returns `{ outcome }` alone. The backend's optional `publicId` is an
echo of a value the browser already holds, so dropping it removes surface
without losing information.

## Explicitly out of scope

Offerings, attempts, directory versions, payload schemas, canonicalization,
Mirror Node reads, any page or navigation entry, environment reads outside
the route handler, and every wallet transaction. Browser evidence is limited
to what a machine without MetaMask can produce.
