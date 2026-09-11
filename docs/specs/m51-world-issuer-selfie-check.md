# M51 — World issuer Selfie Check

## Purpose

Add a meaningful World Selfie Check (Beta) Sandbox flow to the provider deploy
journey. It is a low-assurance liveness and continuity signal: it is not KYC,
legal identity, financial suitability, or an issuer-authority replacement.

The flow gates the existing `directory.publish` command in the Tool402 web
BFF. The current product has no directory-update command, so this card gates
the only existing publication operation and does not invent an update path.

## Configuration

The server reads these private environment values only:

- `WORLD_APP_ID=app_a9bfc04a4a140e455bad73638b7a7d49`
- `WORLD_RP_ID=rp_79a787d6ca3b25f7`
- `WORLD_RP_SIGNING_KEY` — 32-byte `0x`-prefixed hexadecimal private key
- `WORLD_ACTION=issuer-publish`
- `WORLD_ENVIRONMENT=staging`

`WORLD_RP_SIGNING_KEY` is never returned to the browser, logged, committed, or
used as a general purpose application secret. The request endpoint returns
only the public app id, action, staging environment, and a short-lived RP
context. Missing or malformed configuration fails closed before a request is
created.

## Request and verification contract

`POST /api/world/request` accepts only a JSON object containing one canonical
lowercase EVM `address`. It creates a five-minute RP context for the fixed
`issuer-publish` action and returns the public IDKit request values. The
client asks IDKit for the `selfieCheckLegacy` credential with that same address
as its signal and enables legacy proofs for that credential.

`POST /api/world/verify` accepts the canonical address and the opaque IDKit
result. Before forwarding it to World v4, the route requires a legacy
`selfie` response and verifies that every response signal hash equals the
expected hash of that exact canonical address. A mismatched or malformed
result returns the closed verification failure without calling World. On World
success only, it writes a HttpOnly, Secure, SameSite=Lax cookie scoped to
`/api/commands`, bound to the address and expiring after ten minutes. The
cookie payload is MACed using a key derived from the RP private key with the
fixed `tool402-world-session-v1` context. Neither raw proof nor nullifier is
exposed by Tool402 or retained beyond World verification.

The command relay parses only enough JSON to identify a claimed
`directory.publish` signer. It forwards that command only if the valid cookie
is bound to that exact signer. The existing backend remains responsible for
the EIP-712 signature, command authority, replay, and durable publication
checks. A malformed, expired, wrong-address, or missing World cookie returns a
closed `403 WORLD_VERIFICATION_REQUIRED` response without forwarding the body,
including when the provider ingress configuration is unavailable. All
non-publication relay behaviour remains byte-for-byte compatible.

## UI contract

The client-only provider signing island renders a dedicated World Selfie Check
card after the wallet is connected. It offers one deliberate `Verify with
World` action, opens IDKit only after the public RP context has loaded, shows
pending/success/failure status in an accessible live region, and never
auto-opens, stores proof data, persists client state, or represents the result
as identity/KYC. Stage four remains unavailable until the browser session is
World verified; a reload requires a fresh session check.

## Tests and demo evidence

- Contract tests cover configuration rejection, canonical address validation,
  World response forwarding, no proof mutation, cookie integrity/expiry, and
  the command-relay publication gate with zero upstream calls on rejection.
- UI tests cover initial copy, explicit user initiation, unavailable state,
  successful-state announcement, and the stage-four gate.
- Browser QA covers `/provider/deploy` at desktop and 390px: connect a wallet,
  see the World card, initiate its request, and verify that no horizontal
  overflow or inaccessible status is introduced. A World Sandbox end-to-end
  proof is recorded separately when Selfie Check Sandbox enablement is
  available; it is not implied by source or unit tests.
- `docs/submission/world-selfie-check-feedback.md` records the required
  developer and Sandbox-app feedback, including missing enablement or blocked
  paths truthfully.

## Boundary

This card adds no production action, identity claim, KYC decision, durable
World profile, user account, wallet connection method, transaction, payment,
on-chain proof, deployment, or submission. World Sandbox access and Selfie
Check feature enablement remain external prerequisites.
