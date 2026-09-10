# HA-ATS-SDK-BROWSER-COMPAT-002 — Turbopack compatibility decision

## Status and authority

**ACCEPTED — bounded local browser compatibility.** At `2026-09-10T07:57:41Z`,
the human directed the root to retain Next 16's default Turbopack production
path and fix the diagnosed client graph rather than treating Webpack as the
solution. This decision applies only to M44-T010's non-executing bundle gate.

## Observed diagnostic

The fresh `next build` on `@tool402/web` reached the official SDK static import
and stopped only in its Node-only transitive graph:

- `winston`, `winston-daily-rotate-file`, and `file-stream-rotator` require
  `fs`;
- `@terminal3/verify_vc` reaches `@mattrglobal/node-bbs-signatures`, whose
  native `index.node` cannot be resolved by the client graph.

No SDK method, configuration value, wallet, provider, transaction, or browser
route was executed during that build.

## Upstream basis and ruling

The official ATS web Vite configuration at upstream revision
`6a5e8acad16729a4adf8d4d490f05eabb5353b22` aliases `dotenv`, `winston`,
`winston-daily-rotate-file`, and `winston-transport` to its browser adapters.
Its `dotenv` adapter returns an empty object from `config`; its Winston adapter
provides logger, format, and transport surfaces for browser compatibility.

The root may reproduce exactly those four aliases as browser-only
`turbopack.resolveAlias` entries and add the two local adapters required for
them. It may not add a general Node polyfill, fork, patch, or alias the SDK,
read an application environment value, or execute an SDK action. The separate
native BBS diagnostic is recorded and receives its own narrower decision below.

## Native BBS resolution amendment

The four upstream aliases removed every logger and `fs` diagnostic. The only
remaining failure is Turbopack's static resolution of the optional Node native
BBS binding. The human directed the root to finish the Turbopack path. The
browser conditional alias may therefore point only from
`@mattrglobal/node-bbs-signatures` to
`@mattrglobal/bbs-signatures/lib/wasm_module.js`: the same BBS package's
provided WebAssembly fallback. It adds no local BBS implementation, mock,
polyfill, or execution. This amendment is recorded as
`HA-ATS-SDK-BROWSER-COMPAT-003` and `D-M44-010-008`.

## Server graph amendment

Review found that resolving the BBS alias globally would also replace the
server graph's native module, while the authorized WASM fallback is
browser-only. When the alias is conditional as required, the Next server graph
must preserve its native resolution without Turbopack statically resolving the
binding. The human directed the root to complete this Turbopack path. It may
therefore list only `@mattrglobal/node-bbs-signatures` in Next
`serverExternalPackages`, alongside the existing browser-only WASM alias. This
does not create local BBS code, mock or polyfill, change the official SDK, read
configuration, or execute any BBS/SDK action. This amendment is recorded as
`D-M44-010-009`.

The reviewed upstream revision and its exact compatibility surface are recorded
above; this local decision intentionally carries no external document reference.
