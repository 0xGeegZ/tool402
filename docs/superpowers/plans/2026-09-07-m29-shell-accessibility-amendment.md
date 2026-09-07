# M29 Shell Accessibility Amendment Implementation Plan

> **For agentic workers:** use `superpowers:test-driven-development` and
> `next-dev-loop` for this small Next.js change. Keep the local reference guard
> enabled before every non-empty commit.

**Goal:** Preserve the existing truthful shared shell while respecting reduced
motion and verifying its real browser behavior at narrow and desktop widths.

**Architecture:** Add a single global motion-preference media rule to the
accepted shell stylesheet. Keep all route composition, navigation targets, and
focus styling intact. A focused source contract supplies the RED/GREEN proof;
the running Next app and isolated browser provide runtime proof.

**Tech stack:** Next 16.3 Cache Components, React 19, Tailwind CSS 4, Node
22.21.1 built-in test runner, and the existing local browser verification
tooling. No dependency or configuration change.

**Spec:** `docs/specs/m29-shell-accessibility-amendment.md`

## Global constraints

- Modify only `apps/web/src/app/globals.css` and the new focused shell
  accessibility test after RED is committed.
- Do not mask overflow with a global `overflow-x: hidden` rule.
- Do not alter any route, UI copy, navigation target, package, configuration,
  client boundary, or external behavior.
- Treat reduced motion as a browser preference, not a user profile or stored
  setting.

### Task 1: Test-only RED shell contract

**Files:**

- Create: `apps/web/tests/shell-accessibility.test.mjs`

- [ ] Assert the stylesheet contains the existing global focus-visible rule
  with an outline and offset.
- [ ] Assert a `prefers-reduced-motion: reduce` media rule applies to `html`
  and pseudo-elements, disables smooth scrolling, and bounds animation and
  transition duration.
- [ ] Assert the shared layout still has its labeled header and that local
  navigation remains labeled; this is a regression seam, not a route change.
- [ ] Run the focused test. It must fail because the media rule is absent.
- [ ] Commit only the test with `test: Add Shell Accessibility RED Contract`.

### Task 2: Minimal stylesheet amendment

**Files:**

- Modify: `apps/web/src/app/globals.css`
- Test: `apps/web/tests/shell-accessibility.test.mjs`

- [ ] Add only the required `prefers-reduced-motion: reduce` CSS rule.
- [ ] Run the focused test and the Web workspace test suite.
- [ ] Use the running local Next app to verify compilation, errors, route
  metadata, 375 by 812 and 1440 by 900 layout, keyboard focus, no horizontal
  overflow, normal/reduced motion, and accessibility results.
- [ ] Commit only the stylesheet and focused test with
  `feat: Respect Reduced Motion in Shell`.

### Task 3: Module verification and review

- [ ] Run Web typecheck, Web tests, production build, root typecheck/test/lint,
  clean-install dry run, queue check, staged reference guard, and whitespace
  check.
- [ ] Obtain independent task review, then two fresh module-review generations.
- [ ] The root records acceptance only after all evidence is clean, then pushes
  the accepted queue transition.
