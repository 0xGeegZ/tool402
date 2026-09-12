# S44 provider command center

## Purpose

Turn the already-loaded Provider campaign status page into a readable command center while preserving its server-rendered, read-only S17 projection contract.

## Loaded composition

1. One editorial hero replaces the generic page header and the duplicate lavender status block. It contains the provider breadcrumb, Hedera/`Not live` labels, the state-derived campaign title, a concise status sentence, and the existing RiskScan action.
2. The hero includes a repository-owned generated 3D Tool402 illustration loaded through `next/image`. The bitmap contains no copy or status data; the adjacent slogan remains HTML so it is crisp, responsive, and accessible.
3. A full-width three-stage progress rail is derived solely from the existing offering state and independent directory projection. The third stage stays unavailable in this demonstration; it is never represented as completed.
4. The existing evidence rows render as a lifecycle timeline instead of a horizontally scrolling table. Their references, verification text, raw record identifiers, timestamps, and Hashscan gate remain available without inventing activity.
5. Existing terms become a compact snapshot of four icon-led tiles: unit price, funding target, maximum units, and human-readable maturity. Economics, Capacity, Governance, and Trust details form a single supporting-card row.
6. The complete admitted terms, directory fields, signer, and raw evidence remain available in a secondary technical-record disclosure. The compact default view does not repeat the former long terms and directory sections.

## Non-loaded composition

All existing closed outcomes, wording, warnings, links, and no-record behavior remain intact. The command-center regions render only when an offering projection is loaded.

## Truthful loaded-state mapping

The visual treatment must retain the raw admitted offering state. It uses these fixed labels:

| Offering state | Hero title | Offering rail text | Offering rail treatment |
| --- | --- | --- | --- |
| `DRAFT` | `Campaign in progress` | `Offering admitted · DRAFT` | current |
| `ASSET_PENDING` | `Campaign in progress` | `Offering admitted · ASSET_PENDING` | current |
| `READY` | `Campaign prepared` | `Offering admitted · READY` | complete |
| `OPEN` | `Campaign ready` | `Offering admitted · OPEN` | complete |
| `CLOSED` | `Campaign closed` | `Offering admitted · CLOSED` | complete |

The directory stage is `Directory active` and complete only for a loaded directory projection. For every other directory outcome it says `Directory unavailable` and renders the existing exact outcome wording; it is not complete. The existing `CLOSED` next-action mapping remains the no-control case. `Backer issuance` always says `Unavailable in this demo` and is never a complete state.

`provider-status-state.ts` exports the pure
`providerCampaignPresentation(offeringState, directoryLoaded)` mapping used by
the loaded view. It returns the hero title, an offering stage retaining the raw
state, and directory/issuance stages with their textual treatment. It performs
no I/O and owns no runtime capability.

## Responsive and accessibility rules

The rail wraps into stacked stages at narrow widths. The activity list and snapshot use a single column below `lg`; their contents avoid fixed minimum widths and horizontal clipping. The supporting cards collapse from four columns to two and then one. Decorative artwork is `aria-hidden`; state is always conveyed by text, not colour alone.

The earlier S25 generic-header and S28 distilled-report assertions are
superseded only for `/provider`: the route owns one command-center hero and the
loaded component owns the regions above. Other PageHeader consumers and shared
primitive behavior remain unchanged.

## Exclusions

No projection reader, API, session, wallet, data model, external request, command, signature, payment, chain, deployment, or live-operation behavior is modified.
