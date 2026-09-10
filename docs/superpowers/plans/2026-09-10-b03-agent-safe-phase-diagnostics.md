# B03-T020 implementation plan

## Goal

Make the existing Agent payment CLI diagnosable without exposing sensitive data
or requiring another payable exercise.

## Steps

1. Obtain independent readiness and activate only
   `apps/agent/test/riskscan-pay-observability.test.mjs` and the narrow
   `apps/agent/test/riskscan-tool-payment-boundary.test.mjs` amendment for
   durable RED; both source paths remain prohibited.
2. Add failing focused contracts for the closed diagnostic mapping, redaction,
   and one-GET/one-unsigned-request preflight guard.
3. Review RED; if failures are confined to source absence, authorize only
   `apps/agent/src/riskscan-pay-observability.ts` and the narrow CLI-edge
   amendment of `apps/agent/src/riskscan-pay-cli.ts`.
4. Implement a pure private diagnostic mapper and a narrow CLI-edge preflight
   guard; retain the B03 payment library unchanged.
5. Run focused/full Agent validation, independent task/module review, and
   accept the local boundary. Only then request Human Ops' non-payable
   preflight evidence and prepare a separate one-use replacement packet.

## Boundaries

No source change may read a key, invoke a signer or payment factory, build a
payment payload/header, issue a signed retry, decode settlement, or make a
live request during automated validation.
