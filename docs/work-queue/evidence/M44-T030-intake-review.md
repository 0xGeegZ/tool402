# M44-T030 intake review

## Observed defect

The accepted helper decodes `BondDeployed` using the official Factory artifact,
then passes `decoded.args.bondAddress` to its lower-case-only
`readCanonicalAddress` parser. That parser correctly protects trusted M42 and
caller-supplied configuration inputs, but it rejects a valid ABI-decoded
EIP-55/mixed-case event address before the helper can normalize it to Tool402's
canonical lowercase output.

The human-provided independent strike-team audit reproduced that exact defect
against viem 2.56.1 and the official Factory artifact. It does not propose an
architecture change.

## Scope conclusion

M44-T030 is the smallest corrective successor: it retains the selected
official artifact + viem seam and reserves only the focused Factory test for
its initial durable RED cycle. A later RED review may authorize only the
helper and that same test for the validation-before-lowercase correction.

No human or live authority is required for this local pure decode work.
