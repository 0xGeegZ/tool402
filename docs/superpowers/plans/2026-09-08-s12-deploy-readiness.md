# S12 implementation plan — Deploy-readiness assets and boundary routes

Execution plan for [S12-T010](../../work-queue/queue/60-done/S12-T010-deploy-readiness.md)
against the [UI-S12 deploy-readiness manifest](../../ui/UI-S12.md).

## Goal

Replace framework-default public error surfaces with bounded, truthful static
routes and make the existing icon assets resolve through the Next App Router
metadata convention. The work remains presentation-only and makes no claim
about deployment state.

## Sequence

1. Keep this plan and the exact ownership amendment committed and independently
   re-reviewed before returning S12-T010 to `10-ready`.
2. Add `apps/web/tests/deploy-readiness.test.mjs` first and observe its RED
   failure because the five route/metadata paths and two boundary components do
   not exist. Commit it before any source file or icon move.
3. Move, not copy, `apps/web/public/brand/icon.svg` to
   `apps/web/src/app/icon.svg` and `apps/web/public/brand/apple-icon.png` to
   `apps/web/src/app/apple-icon.png`; prove the public originals are absent.
   Keep `apps/web/public/brand/mascot-flag.png` in place.
4. Add `apps/web/src/components/boundary/not-found-boundary.tsx` and the
   server `apps/web/src/app/not-found.tsx`: exactly one `h1`, plain missing-page
   copy, one decorative mascot with `alt=""`, and exactly `/` and `/explore`
   links.
5. Add the client `apps/web/src/components/boundary/error-boundary.tsx` and
   `apps/web/src/app/error.tsx`: only child-route errors beneath the root
   layout. The App Router entrypoint begins with `"use client"`, receives the
   framework `error` and `reset` props, never renders/passes `error`, and puts
   `reset` on the retry control. Use plain interruption copy and exactly one
   `/` link. Render no error message, stack, digest, or diagnostic call.
   Do not add a global error boundary, nested boundary, or crash-test route.
6. Add `apps/web/src/app/robots.ts` that permits crawling for `*` and returns
   no sitemap because no local contract selects an origin.
7. Prove GREEN with source/metadata contracts; then run Web typecheck, tests,
   production Cache Components build, root quality, queue/reference/whitespace
   checks, enabled guard, and browser desktop/narrow/accessibility checks.
   Obtain independent task and module reviews before acceptance.

## Required executable cases

- The RED test asserts the desired final state: all final runtime paths present
  and the two public icon inputs absent. It fails before the move because final
  paths are missing and the public inputs remain.
- It verifies the server-only not-found shape, exact href set `['/',
  '/explore']`, mascot public URL, and empty alt.
- It verifies the `"use client"` App Router error entrypoint's received
  `error`/`reset` props, a retry control that invokes `reset`, and href set
  `['/']`, and rejects any rendering or diagnostic passing of an error message,
  stack, or digest.
- It verifies the robots allow rule and absence of a sitemap, plus no
  environment, origin, fetch, storage, timer, or forbidden-domain copy in
  every owned source.

## Explicit exclusions

`global-error.tsx`, nested error boundaries, test-only crash routes, sitemap,
layout/navigation/shared-UI changes, runtime configuration, live status,
identity/provider/payment surfaces, deployment, and submission.
