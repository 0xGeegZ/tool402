# HA-ATS-RETARGET-001 — Independent integrity review

## Verdict

**CLEAR for M42 readiness only.**

The eleven-field preimages were independently recomputed locally under Node
22.21.1 with the accepted Core canonicalizer and pinned Backend `viem`. The
recomputation begins from the accepted M35 and M37 projections and changes
exactly five conceptual values: the registry revision, expected target, factory
Hedera identifier, resolver Hedera identifier at both of its required
locations, and resolver EVM address. It retains the real issuer's
signer-to-owner equality.

```text
synthetic issuer = 39a4d53db2aa60dd40b50c97738f53a888fdadcb350e1e85984fbd4dd76abc9a
real issuer      = 1880065c5ae64b3fc6279cfdd8c85a6880d43e98ce129ed697c72372204296f9
```

Both results exactly match the human-confirmed values. The accepted M35/M37
sources and focused tests remain byte-unchanged; their two focused suites pass
9/9. M33 remains zero-enabled and M32 remains unchanged. The reviewed
documentation-only retarget introduces no SDK, provider, wallet, environment,
network, authority-row, M32/M33, or external capability.

## Boundary check

M42 and S16 may now receive their own independent readiness reviews. This
record does not authorize a queue move, RED test, source file, authority
provisioning, SDK or provider behavior, transaction, deployment, or live claim
by itself.
