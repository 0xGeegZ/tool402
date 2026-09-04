# UI-S01 Landing and Explore Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add honest landing and Explore discovery routes on the accepted Tool402 UI shell.

**Architecture:** Keep both routes server-rendered and compose only existing local primitives with small landing/discovery components and one decorative local asset. Navigation links between committed local routes only; neither route receives an adapter or action state.

**Tech Stack:** Next.js 16.3.4, React 19.2.8, Tailwind CSS 4.3.3, Node test runner.

**Spec:** [UI-S01 landing and Explore manifest](../../ui/UI-S01.md)

## Global Constraints

- Preserve Cache Components and the established UI-S00 tokens/primitives.
- No price, wallet, payment, provider, account, metric, evidence, external link, detail route, paid state, mock result, or live-availability claim.
- Use TDD for static route/component expectations and browser-check both viewport classes.

## File Structure

- `apps/web/src/app/layout.tsx`: labeled local navigation in the application shell.
- `apps/web/src/app/page.tsx` and `apps/web/src/app/explore/page.tsx`: route composition.
- `apps/web/src/components/landing/**`: landing hero composition.
- `apps/web/src/components/discovery/**`: navigation and read-only RiskScan discovery card.
- `apps/web/public/brand/mascot-wave.png`: selected decorative local asset.
- `apps/web/tests/landing-explore.test.mjs`: focused structural and truthfulness expectations.

## Tasks

- [ ] Add failing static expectations for both routes, navigation, and the read-only discovery boundary.
- [ ] Run the focused web test to confirm the routes/components are absent.
- [ ] Add the minimal server-rendered components, routes, navigation, and selected asset.
- [ ] Run web test, typecheck, production build, and browser checks at desktop and narrow widths.
- [ ] Obtain independent review and integrate only accepted work.
