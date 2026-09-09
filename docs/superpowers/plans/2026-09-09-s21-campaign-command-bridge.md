# S21 implementation plan — campaign command bridge

Execution plan for [S21-T010](../../work-queue/queue/00-inbox/S21-T010-campaign-command-bridge.md)
against the [UI-S21 manifest](../../ui/UI-S21.md), the accepted
[UI-S15](../../ui/UI-S15.md) and [UI-S16](../../ui/UI-S16.md) manifests, the
[M38 payload specification](../../specs/m38-offering-command-payloads.md), and
the [HA-COMMAND-AUTHORITY-002 decision](../../work-queue/evidence/HA-COMMAND-AUTHORITY-002-recommended-decision.md).
It is delivered from the human-requested worktree lane recorded on the card.

## Module boundaries

`apps/web/src/lib/wallet/command-bridge.ts` is pure. It re-exports the closed
four-member command type set the amended S15 builder owns and exports
`buildStageSignatureRequest(input)`, which turns one stage index, the current
session stage states, the wizard's reviewed values, the frozen S16 ATS_CREATE
projection, the stage 2 idempotency key, an M44 candidate, and the directory
record literal into one `SignatureDialogRequest` for that stage. Each payload
is built through the accepted `@tool402/core` parser and canonical-bytes
builder for its type; the `external.prepare` bytes are the JCS text the
accepted normalizer hashes. One clock reading sets payload and command
`expiresAt` to the same string; every request draws a fresh idempotency key
from the accepted S15 nonce generator. The builder throws for a stage whose
predecessor is not `done`, for stage 2 without the projection, for stage 3
without a candidate or the stage 2 key, and for stage 4 without a complete
record literal. `stageStateForSignatureResult(result)` maps a final dialog
result onto the closed ten-kind S16 union: only `complete` with `ACCEPTED`
becomes `done`.

`apps/web/src/components/provider/deploy/directory-record-literal.ts` is the
frozen M28 record for stage 4. It transcribes the accepted
`HA-ISSUER-ACCOUNT-001` issuer account and the fixed RiskScan service
fields, and carries neither a clearing account nor a public x402 endpoint
because no accepted record holds one; `isDirectoryRecordComplete` therefore
reads `false` and stage 4 stays `unavailable` with that reason.

`apps/web/src/components/provider/deploy/deploy-stage-signing.tsx` is the
client island mounted on the wizard review step. It renders the stage list
with the session-derived states, one accepted `WalletIsland`, and, while a
stage is being signed, one accepted `SignatureDialog`. Stage results live in
component state only; a final dialog result replaces that stage's state and
discards the request. Nothing is persisted, retried, or polled.

## Amendments under root reservation

- S15: `TOOL402_COMMAND_TYPES` replaces the single-type check in
  `createUnsignedCommand` and `signAndRelayCommand`; the focused tests name
  the closed set; one sentence of UI-S15 changes.
- S16: `providerDeployStageControl` gains a third argument that enables an
  `actionable` control; `providerDeployStageStates` accepts a session record;
  the stages component renders the enabled control and an activation
  callback; the wizard mounts the island in `ReviewStep`; the two focused tests
  assert exactly that.

## Commit order

1. This plan.
2. Test-only RED: the two declared tests plus the S16 assertion amendments.
3. GREEN: the S15 type-set amendment with its test and manifest sentence.
4. GREEN: bridge, record literal, S16 state and stages amendments.
5. GREEN: signing island and the wizard mount.
