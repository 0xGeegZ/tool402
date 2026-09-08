# S14-T010 RED review

## Scope

Independent review at pushed `2865fc619bec5f205438fa4e8609fc1b43be1003` of:

- [S14 control card](../queue/60-done/S14-T010-route-loading-skeletons.md)
- [UI-S14 manifest](../../ui/UI-S14.md)
- [focused S14 contract](../../../apps/web/tests/route-loading-skeletons.test.mjs)

## Observed RED

Under Node 22.21.1, the focused contract fails exactly once because its nine
declared source paths are absent. Its two GREEN assertions skip while all nine
paths remain absent. No secondary failure occurs.

## Established contract

- It fixes the one shared named `Skeleton` export and exact loader imports,
  exports, zero-parameter direct-return function shape, and module-statement
  shape, so no local shadow or top-level execution can replace the primitive.
- It verifies `aria-hidden="true"` and both motion classes from JSX attributes,
  rejects duplicate/unknown/spread attributes and expressions, and permits
  only a fixed static-layout class token set.
- It requires each fixed-order region to be a direct `main` child with exactly
  one direct `Skeleton` child, so regions cannot share a nested placeholder.
- It rejects client directives, dynamic evaluation/import syntax, runtime
  capability identifiers/calls, extra definitions, text, values, and unsafe
  layout tags.

## Verdict

CLEAR — the durable RED contract is accepted. It authorizes only the nine
declared static loader/skeleton source paths. It does not authorize an existing
route edit, client state, data access, configuration, identity/provider/payment
surface, deployment, submission, or browser replacement claim.
