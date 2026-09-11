# B04 Security scan remediation

## Delivery boundary

B04 corrects two independently reproduced local security findings without
changing payment configuration, wallet authority, provider authority,
transaction behaviour, deployment, or any live integration.

## Stage-B canonical identity

The visible Stage-B configuration digest, the six-field command projection,
the complete execution projection, and the browser/provider guard must use one
public, immutable canonical digest value:

```text
1880065c5ae64b3fc6279cfdd8c85a6880d43e98ce129ed697c72372204296f9
```

The digest is public metadata, not a credential or an authorization. The
display remains presentation-only: it must not become an input to signing or
execution. The existing M42 preimage and the constructed transaction remain
unchanged.

## Bounded protected JSON input

RiskScan and EntityCheck protected evaluators must read request bytes from the
stream with a shared maximum of 65,536 bytes before decoding JSON. A body whose
encoded byte length exceeds that maximum returns `413` before application
parsing, source reads, or settlement. Invalid JSON at or below the limit keeps
the existing `400` behaviour. Unsigned requests keep the existing `402`
challenge behaviour because parsing remains inside the authorised evaluator.

## Verification contract

Tests must first demonstrate the visible/executed digest mismatch and the
missing `413` response. Green verification must prove digest parity, an exact
limit accepted by the shared reader, over-limit `413` responses, no EntityCheck
source read or settlement on over-limit input, and preservation of the focused
Stage-B and protected-route suites. All fixtures remain local and injected.
