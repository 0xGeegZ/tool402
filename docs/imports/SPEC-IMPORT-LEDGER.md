# Local specification import ledger

This ledger records only local contracts and neutral source aliases. Exact
source identities remain outside ordinary repository documents.

| Local contract | Source alias | Selected local authority | Status |
|---|---|---|---|
| `docs/specs/m10-exact-value-boundary.md` | PREP-SPECS-001 | Canonical integer value and identifier boundary, adapted to the local pure core package | Contract reviewed and ready for local implementation |
| `docs/specs/m12-riskscan-native-quote-eligibility.md` | Runtime-local | Caller-defined native quote compatibility using accepted local value and native-summary boundaries | Local implementation accepted |
| `docs/specs/m12-tool-loop-agent-native-quote-evaluation.md` | Runtime-local | One required-injected Agent directory composition into accepted local native quote compatibility | Local implementation accepted |
| `docs/specs/m16-offering-terms-and-revenue-math.md` | PREP-SPECS-001 | Versioned offering terms, exact unit allocation, capped 80/20 clearing math, and explicit maturity input adapted to the local pure Core boundary | Local implementation accepted |
| `docs/specs/m17-requirements-bound-offering-quote.md` | PREP-SPECS-001 | Canonical full-requirements digest, expiry, and exact allocation binding adapted to the local pure Core boundary | Local implementation accepted |
| `docs/specs/m18-offering-purchase-lifecycle.md` | PREP-SPECS-001 | Requirements-bound pure purchase workflow adapted to the accepted local terms and canonical quote boundaries | Local implementation accepted |
| `docs/specs/m19-paid-task-lifecycle.md` | PREP-SPECS-001 | Task-local canonical requirements binding, explicit expiry, and closed paid-task outcome states adapted to the accepted pure Core boundary | Local implementation accepted |
| `docs/specs/m20-offering-definition-schema.md` | PREP-SPECS-001 | Closed descriptor-safe offering-definition ingress that binds declared maturity and opaque resource metadata to accepted local economics terms | Local implementation accepted |
| `docs/specs/m21-clearing-split-lifecycle.md` | PREP-SPECS-001 | Issued-result-bound pure clearing-split recovery lifecycle with no allocation, durable attempt, or external action | Local implementation accepted |
| `docs/specs/m22-ingress-envelope.md` | PREP-SPECS-001 | Closed descriptor-safe ingress envelope, fixed canonical signing input, and correlation-only replay identity with no HMAC, key, clock, or persistence behavior | Local implementation accepted |
| `docs/specs/m23-protected-ingress-verifier.md` | PREP-SPECS-001 | Minimal injected-key native Web Crypto verification of accepted closed ingress and raw bytes before a later durable replay claim | Local implementation accepted |
| `docs/specs/m24-protected-replay-claim.md` | Runtime-local | One injected replay-identity claim handoff from the accepted M23 same-process capability, without storage implementation or command behavior | Local implementation accepted |
| `docs/specs/m25-claimed-protected-body.md` | PREP-SPECS-001 | Private raw-byte binding across accepted cryptographic ingress verification and replay-claim handoff, before any command parsing | Local implementation accepted |
| `docs/specs/m26-external-prepare-payload.md` | PREP-SPECS-001 | Closed external-prepare payload vocabulary for later authenticated-command and durable-attempt boundaries, adapted to the local pure Core package | Local implementation accepted |
| `docs/specs/m28-agent-directory-record-candidate-schema.md` | PREP-SPECS-001 | Narrow closed Directory-record candidate parser for untrusted advertised metadata; receipt candidates, invariant generators, publication, and payment authority remain separate | Local implementation accepted |
| `docs/specs/m29-shell-accessibility-amendment.md` | PREP-SPECS-001 | Reduced-motion, focus, landmark, and non-overflow shell constraints adapted as a narrow local UI-S00 amendment | Local implementation accepted |
| `docs/specs/m30-authenticated-external-prepare-normalizer.md` | Runtime-local | Human-approved secret-free EIP-712 command authority narrowed to claimed-body normalization, M26 payload binding, injected signer authority, and no durable or external behavior | Local implementation accepted |
| `docs/specs/m31-external-prepare-command-admission.md` | Runtime-local | M30-authenticated same-process atomic-admission handoff with no durable storage, generic attempt, ATS authority, or external behavior | Local implementation accepted |
| `docs/specs/m32-durable-external-prepare-admission.md` | Runtime-local | Separate internal Convex data plane for independently rebound M26/JCS payload, durable time and replay identity, current-authority recheck, fresh-nonce replay/idempotency admission, one generic prepared attempt, and exact recovery; ATS target/hash remain opaque signed context | Local implementation accepted |
| `docs/specs/b01-convex-module-naming-compatibility.md` | Runtime-local | Narrow module-filename and current-local-path compatibility amendment for accepted internal backend functions | Contract intake and independent design review required before RED |
| `docs/specs/m33-ats-prepare-authority-gate.md` | Runtime-local | Zero-enabled compiled server-only ATS manifest that rejects all current ATS external-prepare candidates before M32 durable replay/idempotency access | Local implementation accepted |
| `docs/specs/m35-local-unsigned-ats-create-configuration.md` | Runtime-local | One accepted secret-free local unsigned ATS_CREATE configuration projection with an exact descriptor, parameters, and canonical hash; no SDK, M33 enablement, durable admission, or external behavior | Local implementation active; test-only RED authorized |
