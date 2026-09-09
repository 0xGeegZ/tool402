# M44-T010 configuration-boundary amendment review

## Finding

The accepted S16 provider-deploy configuration is a deliberately limited
display projection. It does not contain the complete M44 `parameters` object or
`diamondOwnerAccount`. Treating that literal as input to M44's execution parser
would silently turn an incomplete presentation record into an executable
configuration.

## Ruling

M44 keeps its closed `configuration: unknown` input and accepts only the
complete real-issuer Stage B shape described in its specification. The active
RED fixtures carry a complete test-local value. M44 must not import, adapt, or
otherwise use S16's display literal. S16 owns no durable `PREPARED` attempt.

The client action remains disabled until a later separately scoped Stage B
bridge, after its own authority review, provides both a trusted complete
configuration and a durable prepared attempt. This amendment does not reopen
S16 or add any Web runtime configuration source.

## Scope and non-authorizations

This is a documentation and control-plane correction only. It authorizes no
source, dependency pin, SDK import, configuration access, wallet/provider
interaction, signing, transaction, deployment, publication, or live behavior.

## Evidence reviewed

- `docs/ui/UI-S16.md`
- `apps/web/src/components/provider/deploy/ats-create-configuration.ts`
- `docs/specs/m42-ats-create-configuration-retarget.md`
- `packages/backend/src/ats/stage-b-issuer-ats-create-authority.ts`
- `docs/specs/m44-ats-issuer-client-seam.md`
- `docs/work-queue/queue/20-active/M44-T010-ats-issuer-client-seam.md`
