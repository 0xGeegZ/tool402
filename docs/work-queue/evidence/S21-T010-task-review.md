# S21-T010 final task review

## Scope

Independent review of the corrective source commit
`09899fdf269bc78493e39e067fdc57ad867c6564`, against the committed
[S21 control card](../queue/60-done/S21-T010-campaign-command-bridge.md),
[UI-S21 manifest](../../ui/UI-S21.md), corrective decision records, and the
accepted RED contract.

The review covered only the three authorized GREEN paths:

- `apps/web/src/components/provider/deploy/provider-deploy-state.ts`;
- `apps/web/src/components/provider/deploy/provider-deploy-wizard.tsx`; and
- `apps/web/src/components/provider/deploy/deploy-stage-signing.tsx`.

## Review

- Step two now uses the accepted Core offering parser to reject blank,
  untrimmed, and oversized qualifying resources without silently changing the
  submitted value. Its visible error is linked to the input.
- A rejected local request construction leaves the signature dialog closed,
  preserves the stage results and attempt identifier, and exposes
  nontechnical accessible feedback. It neither invokes a provider nor records
  a result.
- Stage four now uses the exact accepted clearing-account unavailable reason.
- Command construction, canonicalization, relay, wallet, ATS configuration,
  directory literals, durable writes, transactions, deployment, and live
  behavior are unchanged. M44 remains outside this correction.

## Verification

Under Node 22.21.1:

- the six focused S15/S16/S21 contracts passed 68/68 with no skip;
- Web and root typechecks passed;
- root lint, queue validation, whitespace, the local-reference guard, and the
  enabled Git guard passed; and
- the equivalent Webpack production build passed. The default Turbopack build
  remains host-blocked before compilation by an OS process/port restriction.

The complete root suite has exactly the two separately blocked M44 source-path
failures for `ats-client.ts` and `create-bond-request.ts`; no S21 failure was
reported.

Local browser checks on `/provider/deploy` confirmed that an invalid step-two
resource keeps the user on step two, marks the input invalid, and exposes the
linked explanatory error at desktop and 390px widths. The valid local fixture
reaches the review screen without a wallet connection or external request, and
its provider stages remain truthful blocked/unavailable local states. At 390px
the unchanged shared header measured 408px document width; that inherited
shell overflow is outside S21's three-file correction and is not represented
as a passing global responsive claim.

## Verdict

CLEAR — the corrective contract and both recorded findings are resolved. S21
remains a local, session-only command-bridge surface and grants no wallet,
provider, SDK, durable, transaction, deployment, or live authority.
