# M47-T010 configuration reconciliation

## Result

**No canonical preimage or hash change is required.**

The accepted M42 real-issuer Stage-B configuration and M44-T020 pure Factory
consumer use the same immutable real configuration. The canonical eleven-field
preimage and its accepted real digest remain unchanged:

```text
1880065c5ae64b3fc6279cfdd8c85a6880d43e98ce129ed697c72372204296f9
```

M42's SDK identity/integrity values remain historical provenance in the
accepted configuration record. M44's direct Factory artifact + viem selection
is a separate consumer implementation seam, so it does not change a preimage
field or require a new human configuration decision.

## Observed local drift

The S16 display-only projection carries the accepted synthetic digest. S21
currently selects that projection when forming a stage-2 `external.prepare`
payload. M44 accepts only the complete real-issuer configuration. M33 is
currently zero-enabled, so no ATS command reaches durable state today; however,
the synthetic payload would reject if the future Stage-B real mapping were
enabled.

## Ruling

M47-T010 is the smallest local source-only correction: keep the S16 literal
unchanged for display, bind the server to the immutable real M42 configuration
before M33/durable state, and make stage 2 construct its public M26 payload
from the real projection only. No source change is authorized by this evidence
alone; the card requires its normal readiness, activation, RED, GREEN, and
independent reviews.

## Unchanged boundaries

- M33 production manifest remains zero-enabled.
- HA-ATS-STAGE-B-001 remains pending for every provider, signing, transaction,
  candidate, verification, and testnet action.
- README.md and docs/submission/README.md are not part of this correction.
