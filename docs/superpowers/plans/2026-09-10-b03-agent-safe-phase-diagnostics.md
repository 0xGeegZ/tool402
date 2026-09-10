# B03-T020 implementation plan

## Goal

Make the existing Agent payment CLI diagnosable without exposing sensitive data
or requiring another payable exercise.

## Steps

1. Obtain independent readiness and activate only the four declared RED paths.
2. Add failing focused contracts for the closed diagnostic mapping, redaction,
   and one-GET/one-unsigned-request preflight guard.
3. Review RED; authorize only the two source paths if failures are confined to
   their absence.
4. Implement a pure private diagnostic mapper and a narrow CLI-edge preflight
   guard; retain the B03 payment library unchanged.
5. Run focused/full Agent validation, independent task/module review, and
   accept the local boundary. Only then request Human Ops' non-payable
   preflight evidence and prepare a separate one-use replacement packet.

## Boundaries

No source change may read a key, invoke a signer or payment factory, build a
payment payload/header, issue a signed retry, decode settlement, or make a
live request during automated validation.
