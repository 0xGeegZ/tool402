# S16-T010 RED review

## Scope

Fresh independent read-only review at pushed `8bac790` of:

- the [S16 control card](../queue/60-done/S16-T010-provider-deploy-wizard.md);
- the local [UI-S16 manifest](../../ui/UI-S16.md); and
- the two focused provider-deploy contracts.

## Observed RED

Under Node 22.21.1, the focused command fails exactly twice, once for each
test's declared absent source path, and skips all nine GREEN assertions. All
six declared S16 source paths remain absent.

## Established contract

- Stage three has the exact local candidate handoff: the separately owned
  action returns `transactionId` and `evmAddress`, then
  `external.attachCandidate` requires those same two fields.
- With no injected configuration projection, stages two and three are
  unavailable and configuration rows/prepare data are absent; no identifier or
  digest is rendered.
- The route contract AST-checks all six future TS/TSX sources. It rejects
  dynamic import, import metadata, require-style import, `eval`, `Function`,
  direct or computed provider globals, direct network/command calls, forbidden
  runtime modules, and the three internal wallet runtime modules. It permits
  presentational wallet-component composition only.

## Verdict

CLEAR — the RED contract is accepted. It authorizes only the six declared S16
source paths for the minimal GREEN cycle. It authorizes no wallet/provider/SDK
operation, signature dialog, command builder, relay, environment read,
durable write, account action, transaction, deployment, or live behavior.
