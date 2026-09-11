# UI-S37 Header wallet HBAR balance manifest

## Delivery boundary

UI-S37 adds the connected account's native HBAR balance on Hedera Testnet to
the accepted MetaMask control, so a person sees whether the connected account
can pay for anything before reaching a signing or funding step. It reads one
value through the already-selected EIP-1193 provider and renders it as text.
It is presentation plus one read-only RPC call. No state-machine kind,
discovery rule, chain gate, signature, relay, command, token balance, or route
changes.

The control this slice amends is the UI-S15 island in `wallet-connect.tsx`.
If S26-T010 (header wallet control and shared session) is accepted first, the
same amendment applies to the compact header variant and the balance value
lives beside the session in `wallet-session.tsx`; the manifest names both so
the root can reserve whichever is current at activation.

## Local targets

The slice may add or amend only:

- one new `apps/web/src/lib/wallet/wallet-balance.ts`;
- one new `apps/web/tests/wallet-balance.test.mjs`;
- the `connected` and `not_issuer` badge branch of
  `apps/web/src/components/wallet/wallet-connect.tsx`, and the session-change
  re-read it already performs; and
- only if S26-T010 is accepted before this slice activates, the session value
  and the re-read in `apps/web/src/components/wallet/wallet-session.tsx`
  instead of local island state.

Every amendment above is to an accepted card's owned path and needs its own
root integration reservation. No accepted test asserts the badge markup today,
so no accepted test is amended; if S26-T010's `wallet-session.test.mjs` is
accepted first, only its badge-label assertion may change.

## Balance contract

`wallet-balance.ts` is a pure module with two exports and no React import.

- `readHbarBalance(provider, address)` calls
  `provider.request({ method: "eth_getBalance", params: [address, "latest"] })`
  and returns the hex weibar string the Hedera JSON-RPC relay answers with. It
  throws only when the response is not a `0x`-prefixed hex string; a rejected
  request propagates as-is. It performs no other call.
- `formatHbar(weibarHex)` converts the 18-decimal weibar quantity to a
  decimal HBAR string with exactly two fractional digits, truncated not
  rounded, followed by a space and `HBAR`: `0x0` renders `0.00 HBAR`,
  `0xde0b6b3a7640000` renders `1.00 HBAR`. Values are handled with `BigInt`,
  never floating point.

The owning component reads the balance exactly when a session read settles in
the `connected` or `not_issuer` kind: after `connect`, after `switchChain`,
and after each M50 session-change re-read. It never polls, sets no timer, and
issues no read while the kind is anything else. A rejected or malformed read
sets the balance to `null` and changes no state kind.

## Control contract

While the kind is `connected` or `not_issuer`, the existing `secondary` badge
renders the address text followed by ` · ` and either the formatted balance or
the literal `balance unavailable` when the value is `null`. Before the first
read resolves it renders the address alone. The badge `title` gains
`HBAR on Hedera Testnet` after the full address. The accepted state sentence
for the kind is unchanged; the balance is not spoken as a separate live
message. Balance is a display hint: it is not an authority, a quote, or a
settlement fact, and the server never reads it.

## Explicit exclusions

Do not add a token, USDC, or HTS balance, a mirror-node or REST fetch, a
`viem` public client, a polling interval, a currency conversion, a refresh
control, a low-balance warning state, an eighth wallet state kind, a mainnet
chain id, a storage read or write, or a new dependency. Do not touch
`wallet-state.ts`, `metamask-provider.ts`, the command bridge, the relay, the
signature dialog, or any API route.

## Acceptance evidence

- A durable test-only RED commit precedes source changes and fails because
  `wallet-balance.ts` does not exist and the badge renders the address alone.
- `wallet-balance.test.mjs` proves `readHbarBalance` issues exactly one
  `eth_getBalance` call with `[address, "latest"]` and rejects a non-hex
  answer; proves `formatHbar` on `0x0`, one HBAR, a sub-tinybar remainder
  that truncates, and a value above one thousand HBAR; and proves by source
  scan that the owning component calls `readHbarBalance` only after a settled
  `connected` or `not_issuer` read, sets no interval or timeout, and renders
  the ` · ` separator and `balance unavailable` fallback.
- Web typecheck, test, lint, build, root typecheck, test, lint,
  `queue:check`, and the local-reference guard pass.
- Browser check at desktop and 390px: connect MetaMask on Hedera Testnet with
  a funded testnet account and see the badge show `<address> · <n.nn HBAR>`;
  switch account in MetaMask and see the balance follow the new address
  without a click; the badge wraps without overflow.
