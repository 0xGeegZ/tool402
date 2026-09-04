# M01 Web Workspace Foundation Specification

## Outcome

Create `@tool402/web` as a strict TypeScript Next App Router workspace using the exact Next 16.3.4 and React 19.2.8 baseline. Its first route is a static foundation shell with top-level Cache Components enabled.

## Boundary

The app may contain its manifest, Next configuration, TypeScript configuration, root layout, static page, and focused smoke test. It must not add product routes, a wallet, payment behavior, credentials, provider setup, UI imports, or a deployment configuration.

## Acceptance

1. Before creation, the web workspace build fails because the application boundary is absent.
2. `next.config` enables `cacheComponents: true` at the top level with no broad cache opt-out.
3. The workspace typecheck generates the local Next route-type artifacts before invoking TypeScript.
4. The root layout and static page build, typecheck, and render a truthful foundation shell.
5. No product, payment, account, deployment, or live integration behavior is introduced.
