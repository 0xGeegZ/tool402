# World Selfie Check feedback

This is the integration feedback the Selfie Check prize track asks for. It
covers the documentation, the Developer Portal, the Sandbox app, and the
implementation problems we actually hit. It is written from the dashboard
integration described in [the S47 specification](../specs/s47-world-human-check.md).

## What we built

A "Your identity" card on the signed Tool402 dashboard. MetaMask proves control
of a Hedera Testnet account; a World Selfie Check proves a live human holds it.
The check is presented as exactly what it is: a liveness and same-person signal,
not legal identity and not KYC. It is browser-scoped and it unlocks nothing.

## Developer documentation and integration

The React package made the widget integration straightforward. The server signs
the RP context and the client uses the documented `selfieCheckLegacy` preset.
The server-only signing-key boundary is explicit and easy to honour.

Three documentation gaps cost us real time:

1. **No example response body exists anywhere.** The credentials and
   verification-flow pages carry request-construction snippets only. Neither
   states the literal value of a Selfie Check response's `identifier`, nor
   whether `signal_hash` is returned. The TypeScript types are no better:
   `ResponseItemV3.identifier` is typed `string`, not a literal union, and
   `signal_hash` is optional. We bind the proof to the signed-in wallet
   address, so we must check that hash — and we had to infer both the literal
   `"selfie"` and the presence of `signal_hash` from a doc-comment example and
   from the `CredentialType` union declared elsewhere in the same file. One
   published sample payload would remove the guess entirely.
2. **The signing key's format is documented only by tolerance.** The spec
   pseudocode says "accept signing keys with or without 0x prefix" and both
   reference SDKs strip an optional prefix, but no page states what the Portal
   actually displays. We accept both forms for that reason. An integration that
   accepted only the prefixed form would fail identically to one with no key at
   all, which is a hard error to diagnose.
3. **The error-code lists are not complete, and do not say so.** The v4 verify
   reference documents three top-level codes as examples and enumerates none at
   all for the per-result `code` field. Probing surfaced `invalid_format` and
   `invalid_action`, neither of which appears on any page. Separately,
   `feature_unavailable` is a member of the published `IDKitErrorCodes` enum but
   is absent from the docs page's code list. We handle both it and
   `credential_unavailable`, and treat neither list as closed.

## Developer Portal

Registering the relying party and creating the action were clear. The three
values handed out at app creation — `app_id`, `rp_id` and `signing_key` — are
documented as a single keep-these-three step, which is right, but it is easy to
save the two public ones and lose the secret: the Portal shows the secret once
and our environment ended up with four of the five values and no key. A visible
"signing key: issued, last rotated" row would have made that obvious instead of
surfacing as a uniform 503.

The Portal exposes no self-service confirmation that Selfie Check is enabled
for an app. There is no status row and no status API, and the documentation
directs you to a human point of contact. The only runtime signal is an IDKit
error code, which means an app whose feature flag is off is indistinguishable
from a user who declined — unless the integration deliberately surfaces the
error code, which most example code does not. A Portal indicator that
distinguishes "action created" from "Selfie Check enabled for this app" would
make demo readiness legible.

## Sandbox app and edge cases

The request is Sandbox-only by configuration. Sandbox needs a physical iOS or
Android device on a private distribution track, which makes it the long pole for
a hackathon team: there is no phone-free path, because the simulator route
(`staging`) still requires a signed RP context and is therefore blocked on the
same key.

The edge cases we designed against, and what the user sees in each: the widget
closed with no result, a 403 from the verification endpoint, a 503 on a host
with no configuration at all, and an IDKit error naming a credential that is not
enabled. Each gets its own fixed sentence, and none of them claims a stored
result.

## Implementation challenges

- The `RpSignature` returned by the server helper is camelCase while the
  `RpContext` the widget expects is snake_case, and `rp_id` is not part of
  either. The mapping is four lines and it is not in any example.
- The React package ships no `"use client"` directive in its built output, yet
  imports React hooks and `createPortal`. Under the Next.js App Router the
  consuming file must carry the directive itself. Neither README mentions
  Next.js, the App Router, or SSR.
- Legacy-proof nullifiers are stable per app and action; 4.0 nullifiers are
  one-time-use with `session_id` as the stable link. Any integration that stores
  a nullifier as a durable key will break silently at the 4.0 cutover. We store
  no nullifier at all, which sidesteps it, but the migration page is the only
  place this is stated and it is worth a warning on the concepts page.

## What we do not claim

An end-to-end Sandbox Selfie Check proof is **not** claimed by this document.
The signing key is absent from the environment this integration was built in, so
`POST /api/world/request` answers `503 world_not_configured` and the dashboard
card renders its "Unavailable" state. Selfie Check enablement for our app is
likewise unconfirmed, and there is no way to confirm it from code.

The contract tests prove the configuration boundary, the address binding, the
forwarding behaviour, the cookie integrity, and the copy. They do not prove that
World accepts a real proof. A live run is recorded separately, as a human
action, once the key and the enablement are both in place; until that record
exists, this integration is unproven end to end and says so.
