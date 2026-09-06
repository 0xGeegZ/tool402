# UI-S05 Browser RiskScan Directory inspection manifest

## Delivery boundary

UI-S05 adds one small client island to the existing `/explore` page. The
accepted UI-S01 discovery card remains static and unchanged; this separate
slice adds an explicit read-only inspection action beside it. The island uses
the existing Card, Badge, Button, and token system and receives only the
accepted local Agent directory projection.

The action can render idle, inspecting, unavailable, invalid, and selected
descriptor states. A selected descriptor shows RiskScan Quick's bounded input
contract, its two limitations, and only its safe local configuration summary.
The native summary keeps the exact `hedera:testnet` network, canonical asset,
and atomic amount; it never converts value or presents a payment control.

## Local targets

The slice may amend `apps/web/src/app/explore/page.tsx`, add client components
under `apps/web/src/components/discovery/`, add focused Web tests, and amend
the existing landing/Explore test only to preserve the static UI-S01 card
alongside the new island. The root may expose the one already-accepted Agent
directory module through its package map.

This manifest narrowly supersedes UI-S01's original no-client-request
constraint only for this new isolated directory-inspection subtree. UI-S01's
static route/card and every other original boundary remain unchanged.

## Truthfulness and authority boundary

The island constructs only the current origin and delegates once to the
public Agent directory boundary after an explicit action. It does not directly
construct an endpoint, headers, a request body, or payment material. It does
not display a raw descriptor, request details, recipient, facilitator,
credential, payment header/payload, wallet, account, signer, provider, result,
receipt, evidence, completed state, or external link.

`configuration_required` and `locally_configured` are directory metadata only.
They do not prove availability, network support, a facilitator, a payment,
settlement, finality, or a live service. No configuration, account, funding,
signing, payment, transaction, deployment, or live assertion is authorized.

## Acceptance evidence

- Focused contracts cover the static Explore/client-island split, bounded
  selected projection, exact limitations/native metadata, duplicate lock,
  truthful unavailable/invalid states, and exclusion boundary.
- Desktop and narrow browser checks make one actual local directory `GET`, no
  RiskScan `POST`, and show the configuration-required selected state with no
  framework or browser errors.
- Web/root quality, build, queue, guard, independent review, and two clean
  module-review generations pass.
