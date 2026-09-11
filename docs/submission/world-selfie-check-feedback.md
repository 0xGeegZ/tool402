# World Selfie Check feedback

## Developer documentation and integration

The IDKit React package made the request-widget integration straightforward:
the server signs the RP context and the client uses the documented
`selfieCheckLegacy` preset. The server-only signing-key boundary and the
verification endpoint are appropriately explicit.

The Sandbox enablement requirement is easy to miss when creating an action.
The portal allows the relying party and action to be created, but the
end-to-end Selfie Check flow still depends on World enabling the feature for
the Sandbox application. A direct portal indicator that distinguishes
"action created" from "credential enabled for Sandbox" would make demo
readiness clearer.

## Developer Portal

Relying-party registration and creating the `issuer-publish` action were
clear once the signer key was generated. The RP signer address was visible
after registration. The portal did not expose a self-service confirmation
that Selfie Check Sandbox proofs are enabled for this app.

## Sandbox app

The Tool402 request is intentionally staging-only. Browser QA confirmed the
normal provider-deploy route and its review/sign boundary render without a
runtime error. An end-to-end Selfie Check proof has not been claimed: it needs
the external Sandbox Selfie Check enablement and a connected compatible wallet
session. This is an integration-test limitation, not a production-readiness
claim.
