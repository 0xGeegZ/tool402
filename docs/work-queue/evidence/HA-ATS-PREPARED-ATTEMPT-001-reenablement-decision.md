# HA-ATS-PREPARED-ATTEMPT-001 — Re-enablement decision

## Human decision

On 2026-09-11, the decision owner explicitly authorized Human Ops to re-enable
only the existing literal-matching `commandAuthorities` record for:

```text
canonicalSignerAddress = 0xc89f87052c3e080b4a9b021d4930055031ef378e
chainId                = 296
```

No duplicate record may be created. The record must be revoked after the
bounded Stage 1 flow or at most 30 minutes after re-enablement. Every other
limit in HA-ATS-PREPARED-ATTEMPT-001 remains unchanged.

## Read-only production observation

The production administration console showed exactly one matching record with
the approved authority version, principal, ISSUER role, and owned subject. It
currently displays `enabled: true`. The table exposes its creation time only,
not the time at which `enabled` was last changed.

Consequently, the observation does not establish when the temporary window
began. No signature, relay, transaction, asset, candidate, or other external
operation was attempted from this observation. Human Ops must attest that this
is the re-enablement authorized above before using it for the two Stage 1
signatures; otherwise it must be revoked and a new bounded activation recorded.
