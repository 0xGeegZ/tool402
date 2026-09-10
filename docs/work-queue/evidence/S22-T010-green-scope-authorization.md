# S22-T010 landing implementation scope authorization

The independent exact-head RED review accepted the rebased commit
`fdf2d1c464ae373b7800a14562747efd993f6590` over canonical
`8a26bec6f0b46315374c6cb9f77fffffc14f927f`. Its Node 22.21.1 focused run
reported nine passes and only four intended source-absence failures for the
platform thesis, four local CTAs, and fourth labeled section.

The active GREEN scope is exactly:

- `apps/web/src/app/page.tsx`;
- `apps/web/src/components/landing/landing-hero.tsx`;
- `apps/web/src/components/landing/landing-sections.tsx`;
- `apps/web/src/components/landing/landing-footer.tsx`;
- `apps/web/tests/product-landing.test.mjs`;
- `apps/web/tests/landing-explore.test.mjs`; and
- `apps/web/tests/public-landing-reconciliation.test.mjs`.

The existing local mascot asset may be reused. No new asset is selected. All
paths outside this list remain prohibited, including global layout,
navigation, CSS, non-root routes, provider/ATS, configuration, packages,
README, submission, deployment, and video. The Stage B gate remains a hard
truth filter and a prerequisite to public deployment and demo recording.
