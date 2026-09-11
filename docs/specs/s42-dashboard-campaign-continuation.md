# S42 dashboard campaign continuation

## Status

Planning-only specification. It creates no runtime authority. The repository
owner authorized the local S42-T010 inbox card on 2026-09-11; source work must
still follow the card's readiness, test-only RED, and GREEN gates.

## Outcome

An authenticated dashboard shows the current durable RiskScan provider
campaign to its own signer after re-sign-in. The dashboard obtains the sealed
session server-side and reads the existing RiskScan public projection
server-side. It creates a view only when both canonical lower-case EVM
addresses are identical.

The rendering is intentionally fail-closed. If the session is invalid, the
existing dashboard layout redirects to `/sign-in`. If the projection is not
configured, absent, unavailable, malformed, or belongs to another signer, the
dashboard renders its existing workspace without a campaign card.

## Data contract

The only queried public id is `riskscan_revenue_note_demo`. The existing
projection parser supplies an `OfferingRecord` only after it has validated the
complete response, including the canonical signer address. The campaign
adapter accepts only that loaded record and the canonical session address, and
returns this presentation data:

| Field | Source | Rendering rule |
| --- | --- | --- |
| title | `record.narrative.title` | text only |
| state | `record.state` | text status only |
| continuation href | fixed local `/provider/deploy` | internal link only |

It exposes neither signer address nor internal Convex/ATS identifiers.

## Security and authority boundary

The dashboard gate remains the only route authorization boundary. The campaign
adapter is a second, display-only ownership check; it must never substitute
for the signed dashboard session. There is no client fetch, query parameter,
browser storage, polling, retry, wallet request, signature, command, relay,
transaction, deployment, or external write.

The Provider deploy page retains its own shared-wallet and durable-resume
checks. Following the internal link does not assert issuer authority or resume
an action automatically.

## Verification

The focused contract must demonstrate, with literal records, that a matching
canonical session signer returns the campaign view while a signer mismatch,
non-loaded outcome, malformed address, and absent record return `null`. A
mutation that removes the equality comparison must make the mismatch case
fail.
