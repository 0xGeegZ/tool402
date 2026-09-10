# B03-T020 independent activation review

## Scope

Independent current-head activation review at clean canonical
`f1de1ef69ab79c519d3b139f07f12f0bf009c73a` of B03-T020's ready authority,
card, safe diagnostics specification, explicit plan paths, accepted
dependencies, ownership reservation, active lanes, focused baseline, queue,
and enabled local-reference guard.

## Findings

- M05-T020, M05-T030, M06-T010, M12-T020, and B02-T010 remain accepted.
- The plan now names exactly the two candidate RED paths: the absent
  `apps/agent/test/riskscan-pay-observability.test.mjs` and the narrow existing
  `apps/agent/test/riskscan-tool-payment-boundary.test.mjs` amendment.
- The Node 22.21.1 focused existing payment-boundary baseline passes 7/7;
  queue validation and the enabled local-reference guard are clear.
- M47 Backend/Web source lanes, S22, and S24 do not own either B03 path. No
  B03 source path or external action was taken.

## Verdict

CLEAR — activate B03-T020 only for a durable RED contract at the two named
Agent test paths. Every source, key/signer/provider, request, retry,
settlement, preflight execution, replacement attempt, deployment, and live
path remains prohibited pending fresh independent RED acceptance.
