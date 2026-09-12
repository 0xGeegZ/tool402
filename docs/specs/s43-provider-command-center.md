# S43 provider command center

## Purpose

Turn the already-loaded Provider campaign status page into a readable command center while preserving its server-rendered, read-only S17 projection contract.

## Loaded composition

1. The page header identifies the route as `Campaign status` and keeps the existing description and two local actions: deploy first, RiskScan second.
2. A status-derived hero identifies the current provider campaign without calling it live. It presents only the existing offering and directory states, plus an explicit `Not live` label.
3. A three-stage progress rail is derived solely from the existing offering state and independent directory projection. The third stage stays unavailable in this demonstration; it is never represented as completed.
4. The existing evidence rows render as a chronological activity list. Their references, verification text, and Hashscan gate remain unchanged.
5. Existing terms become a compact snapshot: unit price, funding target, maximum units, and maturity. The remaining terms remain visible in the Economics, Capacity, and Governance cards.
6. Existing directory and signer fields become one Trust details card. No address or endpoint is hidden or transformed into a new value.

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

## Responsive and accessibility rules

The rail wraps into stacked stages at narrow widths. The activity list and snapshot use a single column below `sm`; cards retain labelled headings and the existing headings stay in document order. Decorative artwork is `aria-hidden`; state is always conveyed by text, not colour alone.

## Exclusions

No projection reader, API, session, wallet, data model, external request, command, signature, payment, chain, deployment, or live-operation behavior is modified.
