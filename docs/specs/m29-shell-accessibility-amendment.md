# M29 shell accessibility amendment contract

## Delivery boundary

This contract is a narrow, style-only amendment to the accepted local shell.
It improves how the existing application frame behaves for people who request
reduced motion, while preserving the already accepted focus treatment and
route-owned landmark structure.

It may modify only `apps/web/src/app/globals.css` and add one focused Web
source-contract test. It must not change route business logic, navigation
targets, component APIs, UI copy, dependencies, package metadata, runtime
configuration, or any Core, Agent, backend, persistence, command, provider,
payment, account, transaction, settlement, clearing, ATS, HCS, payout,
deployment, or live behavior.

## Required behavior

- The normal shell retains smooth scrolling and the existing global
  `:focus-visible` outline treatment.
- Under `prefers-reduced-motion: reduce`, the document disables smooth
  scrolling and reduces animation and transition duration to a single,
  bounded instant. The rule applies equally to generated pseudo-elements.
- The amendment does not hide overflow or use a visual workaround to mask a
  layout defect. At 375 by 812 and 1440 by 900, the existing shared frame must
  have no horizontal overflow, expose its labeled navigation, and retain a
  visible keyboard focus indicator.
- Each current route remains responsible for its single `main` landmark; the
  shared frame remains a labeled header plus labeled navigation. No landmark
  is added or removed by this amendment.

## Verification boundary

The focused static contract must prove the exact motion-preference media
query, the retained focus rule, and the unmodified shared landmark/navigation
seams. It must fail before the stylesheet amendment exists.

Runtime evidence must use the local Next development server and an isolated
browser session to check the desktop and narrow viewports, normal and reduced
motion behavior, keyboard focus, horizontal overflow, browser errors, and an
accessibility audit. Browser observation is evidence only; no screenshot or
browser state is committed.

## Explicit exclusions

This amendment does not claim a full accessibility certification. It does not
add an accessibility dependency, a component runtime, animation, client state,
fetch, storage, analytics, mock data, authentication, session, wallet, signer,
provider, external link, payment flow, receipt, evidence, or live service
surface.
