# M51-T010 activation review

## Authority

At M51 readiness head `88108b98fb9ef01b46146afcf2b13573c960c20e`, the
dependencies and candidate ownership remain intact. The user explicitly asked
for the Provider UI to recover durable Convex state after refresh.

## RED-only scope

M51 is `20-active` only for durable RED in:

- `packages/backend/tests/offering-command-admission.test.mjs`; and
- `apps/web/tests/provider-campaign-resume.test.mjs` (new).

All production source remains prohibited pending review of the resulting RED
contract. RED uses no real Convex deployment, provider, wallet, signature,
relay, authority mutation, transaction, or network request.
