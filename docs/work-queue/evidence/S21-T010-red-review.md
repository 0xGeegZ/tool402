# S21-T010 corrective RED contract review

## Scope

Independent review at clean pushed
`1b1eea8f8a77b9b626c0230dc88fba226f21abd8` of the four authorized S21
test-only changes, the committed card and UI manifest, and the existing-source
correction boundary.

## Verification

Under Node 22.21.1, the focused command completed 68 tests: 64 pass, four
fail, and none skip. The failures are exactly the missing step-two
qualifying-resource field validation, missing linked resource error attributes,
unhandled request-builder rejection in the signing island, and the stage-four
detail differing from `No accepted clearing account is recorded.`.

The regression invokes the actual signing island and accepted request builder:
a valid input opens the dialog, while a rejected construction must leave the
dialog closed, preserve stage state, and expose accessible nontechnical
feedback. The strict Core rejection for blank, untrimmed, and oversized
resources passes. No source, queue, package, M44, or unrelated test path
changed in the RED commit.

## Verdict

CLEAR. Only these minimal local GREEN paths are authorized:

- `apps/web/src/components/provider/deploy/provider-deploy-state.ts`;
- `apps/web/src/components/provider/deploy/provider-deploy-wizard.tsx`; and
- `apps/web/src/components/provider/deploy/deploy-stage-signing.tsx`.

No Core parser, command/relay behavior, wallet/provider/SDK behavior,
configuration, durable write, transaction, deployment, or live authority is
authorized. Desktop and mobile browser evidence remain required before final
acceptance.
