# M46-T040 canonical Directory v2 migration amendment

## Finding

The original M46-T040 intake proposed a second descriptor in the default v1
body. That conflicts with M05/M45's one-tool producer contract and with the
RiskScan Agent decoder, which rejects a non-v1 or non-one-tool body. Adding a
second endpoint would avoid the immediate break but leave two competing public
Directory representations.

## Ruling

The root records D-M46-040-001: retain exactly one canonical public
`GET /api/tools` route and atomically migrate its default body to a closed
`v2` pair: unchanged RiskScan first and EntityCheck second. The Agent decoder
migrates with it and retains only a strict legacy-v1 input branch. M45's
separate active-directory view is unchanged; no `/api/tools/v2` route or other
duplicate Directory representation is permitted.

This narrowly supersedes only M05/M45's no-query one-tool-v1 default-body
requirement. The route, `connection()` runtime boundary, JSON/no-store headers,
and M45 opt-in-view semantics remain intact.

## Reserved implementation boundary

Only these future paths are eligible after an independent ready review and a
separate RED activation:

- `apps/web/src/lib/entity-check-tool-descriptor.ts`
- `apps/web/src/lib/tool-directory.ts`
- `apps/agent/src/riskscan-tool-directory.ts`
- `apps/web/tests/entity-check-tool-descriptor.test.mjs`
- `apps/web/tests/tool-directory-api.test.mjs`
- `apps/agent/test/riskscan-tool-directory.test.mjs`
- `apps/agent/test/riskscan-tool-flow.test.mjs`
- `apps/agent/test/riskscan-tool-native-quote-evaluation.test.mjs`
- `apps/agent/test/riskscan-tool-native-quote-evaluation-package.test.mjs`
- `apps/agent/test/riskscan-tool-payment.test.mjs`
- `apps/agent/test/riskscan-tool-payment-boundary.test.mjs`
- `apps/web/tests/riskscan-directory-discovery.test.mjs`
- `apps/web/tests/riskscan-native-quote-compatibility.test.mjs`
- `apps/web/tests/riskscan-tool-loop.test.mjs`

The canonical builder must produce the fixed v2 pair and the decoder must
strictly validate both entries before selecting only RiskScan. Every listed
fixture migrates to v2 in the same delivery. The active-directory view, route
source, all other UI/Agent source, a manifest, and a lockfile remain untouched.
A later dedicated consumer card must define EntityCheck selection.

The single M45 test assertion amendment is also explicit: the builder's exact
two-import vector becomes the exact three-import vector containing the existing
type-only active-directory import, `buildEntityCheckToolDescriptor`, and the
existing RiskScan configuration import, in that order. Its route,
active-directory-view, and no-I/O assertions remain unchanged.

## Boundary

This is a local versioning correction only. It authorizes no configuration,
source read, payment, provider, wallet, account, transaction, deployment, or
live action. M44-T010 remains separately owned and untouched.
