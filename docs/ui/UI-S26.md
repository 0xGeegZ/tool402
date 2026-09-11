# UI-S26 Header wallet control and shared session manifest

## Delivery boundary

UI-S26 moves the accepted UI-S15 MetaMask island into the shared shell header
as a compact control and gives every client component the same wallet session
through one React context, so the provider deploy wizard no longer mounts its
own wallet block. It is presentation and client-state composition only. No
state-machine kind, discovery rule, chain gate, signature, relay, command,
data read, or route changes.

## Local targets

The slice may add or amend only:

- one new `apps/web/src/components/wallet/wallet-session.tsx`;
- one new `apps/web/tests/wallet-session.test.mjs`;
- `apps/web/src/components/wallet/wallet-connect.tsx`, which becomes the
  compact header variant consuming the shared session;
- the header block and the shell wrapper of `apps/web/src/app/layout.tsx`;
- the wallet block of
  `apps/web/src/components/provider/deploy/deploy-stage-signing.tsx`;
- the island mount of `apps/web/src/components/backing/backing-flow.tsx`,
  only if S18-T010 is accepted before this slice activates; and
- the island, header, and landmark assertions of
  `apps/web/tests/deploy-stage-signing.test.mjs`,
  `apps/web/tests/static-shell.test.mjs`, and
  `apps/web/tests/shell-accessibility.test.mjs`, each limited to that
  assertion.

Every amendment above is to an accepted card's owned path and needs its own
root integration reservation. `apps/web/src/components/discovery/local-navigation.tsx`
is not active under S25-T010 while S25 remains in `00-inbox`; any future
navigation-label amendment is confined to S25's separately accepted source
scope. The control sits beside the navigation in the layout header, not inside
it.

## Session contract

`wallet-session.tsx` is a client module exporting `WalletSessionProvider`
and `useWalletSession()`. The provider holds exactly the state the UI-S15
island holds today: one `WalletState` from the accepted seven-kind union and
one selected EIP-1193 provider reference. It exposes
`connect(approvedIssuerAddress?)`, `switchChain()`, and `disconnect()`, whose
bodies move unchanged from the island: discovery through the accepted
`discoverMetaMaskProvider` runs only inside `connect`, never at module load,
on render, or in an effect; `switchChain` reuses `recheckAfterSwitch`;
`disconnect` clears both values. `useWalletSession()` throws outside the
provider. The session lives in the root layout, so it survives client-side
navigation and resets to `disconnected` on a full reload. Nothing is persisted
to storage. A connected session is not an authority; the server re-reads the
durable authority record on every command.

## Header control contract

`WalletIsland` in `wallet-connect.tsx` becomes the compact header variant of
itself and consumes the shared session instead of local state. By state kind
it renders: `disconnected`, an outline `sm` button `Connect MetaMask`;
`connecting`, a disabled `sm` button `Connecting…`; `wrong_chain`, an outline
`sm` button `Switch to Hedera Testnet`; `no_provider` and
`multiple_providers`, an outline `sm` button `Retry`; `not_issuer` and
`connected`, one `secondary` badge showing the address shortened to its first
six and last four characters, with the full address as `title`. No caller in
this slice passes an approved issuer address, so `not_issuer` stays
unreachable, exactly as the accepted UI-S15 rule states; the badge branch
exists only so the closed union is handled. The accepted
UI-S15 sentence for the current kind renders in one visually hidden
`aria-live="polite"` region so the "not an authority" copy stays available to
assistive technology. Both address badges are internal links to `/dashboard`;
they are navigation only, not authentication or authority proof. A connected
but unsigned visitor is intentionally sent to the S38 `/sign-in` surface,
which must explain that one safe authentication signature is the remaining
step before the dashboard opens. The server dashboard guard remains the sole
access decision and redirects unless the separate signed S38 session is valid.
No disconnect control is rendered; MetaMask itself revokes the site.
The control has no icon set, popover, menu, or external link. `app/layout.tsx` wraps the shell in `WalletSessionProvider` and renders
the control immediately after `LocalNavigation` inside the existing header
row.

## Wizard contract

`deploy-stage-signing.tsx` drops its `Wallet` heading, address badge, state
sentence, retry, and disconnect buttons. It reads `useWalletSession()`: while
the kind is `disconnected`, the final deploy/signing form renders one labelled
`Connect MetaMask` section with one `Connect MetaMask` button. Its explicit
user click calls the shared `connect()` action; it does not discover, connect,
or request anything during rendering. The section says `Connect MetaMask on
Hedera Testnet to enable the first signing step.` and every stage control stays
disabled until the shared session becomes `connected`. Other non-connected
kinds retain their disabled controls without an additional form action. When
`connected`, the form does not render the connection section, passes the
session provider and address to the existing `SessionReporter`, and renders
`SignatureDialog` exactly as today. Stage sequencing, signature phases, relay
outcomes, and the truth-first paragraph are otherwise unchanged. The wizard
passes no approved issuer address, as today.

## Explicit exclusions

Do not add an eighth state kind, a second wallet, an auto-connect, a storage
read or write, a discovery call outside `connect`, a chain switch outside a
user click, a disconnect control in the header, a signature outside the
accepted dialog, a balance, transaction, or authority display, an icon
library, or a change to the navigation entries. Do not touch
`wallet-state.ts`, `metamask-provider.ts`, the command bridge, the relay, or
any API route.

## Acceptance evidence

- A durable test-only RED commit precedes source changes and fails because
  `wallet-session.tsx` does not exist, the island still holds local state,
  the layout renders no wallet control, and the signing component still
  mounts its own wallet block.
- `wallet-session.test.mjs` proves the provider and hook exist with the fixed
  API, that `discoverMetaMaskProvider` is referenced only inside `connect`,
  that the layout wraps the shell and renders the control after the
  navigation, and that the header control renders the fixed labels per kind
  with the visually hidden live region.
- The amended accepted tests pass with only their island, header, and
  landmark assertions changed.
- Web typecheck, test, lint, build, root typecheck, test, lint,
  `queue:check`, and the local-reference guard pass.
- Browser checks at desktop and 390px: connect from the header on `/`, reach
  `/provider/deploy` through in-app links without a full reload, and see the
  wizard already connected with no second prompt; the header row wraps
  without overflow; visible keyboard focus on the control.
