# S11-T010 navigation test amendment

## Diagnosis

The complete Web suite reliably fails after the committed S11 source change:
`apps/web/tests/workspace-shell.test.mjs` still models the shared local
navigation as exactly Home, Explore, and Workspace. The new, explicitly
reserved Demo entry is therefore correct source behavior but not yet reflected
in that existing shared-navigation assertion.

The focused S11 contract also fixed its href literals without proving that the
nine local targets have route files at the same commit, which is required by
UI-S11.

## Scoped ruling

S11 may amend only these existing tests in addition to its already declared
source contract:

- `apps/web/tests/guided-demo-route.test.mjs`, to prove every fixed target has
  its declared local route file; and
- `apps/web/tests/workspace-shell.test.mjs`, to preserve the exact shared
  local navigation set as Home, Explore, Workspace, and Demo.

The first amendment strengthens the route contract. The second replaces a
stale three-entry assertion with the exact four-entry navigation boundary. No
route behavior, copy, layout, shared source, or runtime capability is
authorized by this ruling.

## Evidence

Under Node 22.21.1, `npm run test --workspace @tool402/web` reproduced the
failure: 104 tests passed and the one failing Workspace navigation test
reported the unexpected Demo entry. The focused S11/navigation tests passed,
isolating the failure to the stale shared assertion rather than the route
implementation.
