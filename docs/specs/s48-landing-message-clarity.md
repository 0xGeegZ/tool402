# S48 landing message clarity

## Goal

Make the public landing explain, in plain English, what Tool402 is, who uses
it, how an agent uses a tool, what is controlled before payment, and what a
visitor can do today.

## Audience and primary action

The primary reader is a developer configuring an AI agent. A tool creator is
a secondary reader. The primary action is **Explore tools**, which links to
the existing `/explore` directory. **How it works** is the secondary action
and links to the existing `#how-it-works` section. The `/demo` recording guide
is a clearly labelled footer-only **Presenter guide**. The provider entry
remains separate and links only to the existing `/provider/deploy` preparation
journey.

## Message contract

1. The hero describes Tool402 as a marketplace for tools AI agents can pay to
   use. Its supporting copy identifies the developer, agent, tool, payment,
   and result in plain language, and explains x402 once as the payment request
   an agent can inspect. It retains a concise Hedera-testnet preview signal.
2. The three-step section describes the agent flow: find a tool; compare an
   requested price with configured spending rules; send payment proof and
   receive a result after service-side payment verification. It must not
   suggest that clicking the landing runs this flow.
3. The tool cards state the concrete task, inputs or sources, output, and
   limit. RiskScan must not be called an independent security audit or external
   verification. EntityCheck must not be called a compliance certification;
   it remains a source-bounded preview that needs its configured sources.
4. The benefits section answers why a developer uses Tool402: inspect the
   tool before use, see the requested payment before a result, and apply the
   agent's configured spending rules. It must not imply a budget dashboard or
   an interface-managed global cap.
5. The provider section describes preparation of an offering without implying
   that preparing it publishes a live tool. Footer copy and metadata use the
   same marketplace and testnet framing.

## Source boundary

- `apps/web/src/components/landing/landing-hero.tsx`
- `apps/web/src/components/landing/landing-sections.tsx`
- `apps/web/src/components/landing/landing-footer.tsx`
- `apps/web/src/app/layout.tsx` — `metadata` object only; exclude the S26
  header and shell-wrapper regions.
- `apps/web/tests/product-landing.test.mjs`
- `apps/web/tests/public-landing-reconciliation.test.mjs`

## Exclusions

No visual redesign, style change, route change, new CTA destination, client
state, API, configuration read, data fetch, analytics, wallet/provider action,
payment/transaction behaviour, publication, deployment, or live-evidence
claim is in scope.

## Verification

The focused landing contracts first fail on the approved message and CTA
hierarchy. After the minimal copy implementation, run those contracts, Web
typecheck and lint, queue/reference checks, and a local Next.js browser check
of `/` at desktop and narrow width. The browser check confirms the visible
headline, the primary and secondary CTA destinations, the agent-flow wording,
the tool-state distinction, testnet framing, and no rendering errors.
