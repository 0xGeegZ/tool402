# S45 demo control room

## Delivery boundary

S45 turns the existing demo route and tour query presentation into the practical
recording guide. It uses only existing routes and public or read-only truth
already available to the browser. It pre-fills only the existing ToolLoop sample
and Provider fixture; it never submits, signs, acknowledges, sends, fetches
evidence, stores a secret, or creates a success state.

## Recording model

The guide has stable step IDs carried in the query string with the tour flag.
Each step has an internal route, an optional wallet role, short DO, SAY, and
SHOW instructions, and a next step. The bar must use the step ID, not only the
pathname, because provider stages share routes. Restart returns to the first
guide step and affects no product state. Hiding presenter notes is local
presentation state only.

The demo route contains readiness statuses with no inferred green state, a
compact recording itinerary and Start rehearsal control, and a final evidence
recap that displays a link only when a real validated identifier is supplied by
an existing product projection.

The B03 command card contains exactly the public-safe command template and
expected terminal lines from HA-B03-AGENT-PAYMENT-001. It must not contain
payer values, a header, or a payload. With no verified settlement reference,
it says NOT AVAILABLE and does not render a HashScan action.

## Explorer links

One pure utility accepts only canonical lower-case EVM transaction hashes and
EVM addresses and creates the current HashScan testnet transaction or contract
URL. Invalid, unknown, or missing identifiers return null; no component
concatenates a URL itself. A link opens a new tab with noopener noreferrer and
has a specific accessible name. This card does not add a link to the M56
submitted-hash state; that path remains M56-owned until its owner exposes a
safe public evidence seam.

## Truth and ownership constraints

- M55 is not integrated, so the guide offers the existing Provider campaign
  route and labels a new-tool path unavailable rather than duplicating M55.
- ATS remains pending until its independently verified asset interface exists;
  the guide never converts a candidate or MetaMask hash into verification.
- World has no current integrated route and is OPTIONAL / NOT AVAILABLE.
- Backing remains a route instruction with submitted — allocation pending;
  it has no demo-generated transfer result or explorer link.
- Wallet instructions are labels only. The shared wallet island remains the
  sole discovery, connect, and switch authority.

## Owned paths

S45 owns this specification, its queue/root records, the existing demo page,
guided-step, tour-bar, and tour-navigation sources, new demo-only client
controls and pure HashScan-link utility, the existing guided/tour tests, and
new focused demo-control-room and HashScan-link tests. It may update the
release rehearsal runbook to exactly match the guide.

It excludes every Provider, wallet, M55, M56/backing, ATS verification, World,
Agent, API, backend, environment, deployment, and transaction source. A later
owner may expose an exact safe evidence projection under its own authority.

## Acceptance

Focused tests prove stable step IDs, query preservation, no business-state
mutation, no secret-bearing B03 text, safe command copying, false-proof
suppression, validated external links, and matching runbook sequence. Browser
rehearsal proves desktop and 390px navigation, ToolLoop prefill, visible
presenter notes, restart/exit behavior, no overflow, and no console error.
