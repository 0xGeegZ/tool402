# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

- Primary (confirmed): ETHOnline 2026 hackathon judges evaluating the Tool402 submission. Their job is to verify that an agent can pay for a bounded tool via x402 on Hedera testnet, follow the guided demo tour, and understand the campaign / revenue-note story. Provider, backer, and Consumer Agent are demo roles they inspect, not the primary visitors.
- Secondary roles described by the product (README.md): Consumer Agent (discovers a descriptor, checks spend policy, pays, validates the result); Tool service (publishes bounded metadata, issues the 402 challenge, verifies settlement through a facilitator); Provider (prepares campaign commands for review, never executes them); Human operator (sole authority over wallet, funding, live config, deployment, narration, and submission).

## Product Purpose

Tool402 is a marketplace for verifiable, machine-paid tools. Tagline: "Back the tools agents pay to use." A Consumer Agent discovers a bounded capability, meets an x402 `402 Payment Required` challenge, and receives the result only after verified settlement. Success for the current surface is a judge completing the demo journey and seeing the paid-tool loop and the campaign story end to end. The judged path is Hedera testnet; prize tracks targeted are "Hedera Agentic Payments" and "Hedera Tokenization" (docs/submission/README.md).

## Positioning

Confirmed lead claim: tool usage revenue is bounded and verified via x402, and that verified usage can back a tokenized revenue note on Hedera Asset Tokenization Studio (ATS). Tool402 is marketplace plus backing, not only a paid API. Tool402 is explicitly not a custody or investment product and promises no yield or return.

## Operating Context

- Routes: `/` landing; `/demo` guided tour; `/explore` tool directory with `/explore/riskscan` (+ `/try`, `/tool-loop`) and `/explore/entitycheck`; `/dashboard` and `/dashboard/riskscan` guest workbench; `/riskscan/compatibility` and `/riskscan/preflight` boundary checks; `/provider` campaign status; `/provider/deploy` provider deploy wizard; `/docs` with `/faq`, `/providers`, `/api`, `/riskscan`.
- API routes: `/api/tools`, `/api/offerings`, `/api/riskscan`, `/api/entitycheck`, `/api/commands`.
- Provider campaign flow: MetaMask EIP-712 signature, then `POST /api/commands` to an HMAC-protected Convex ingress. Admission outcomes are ACCEPTED, REPLAYED, CONFLICT, REJECTED; none imply on-chain action.
- Stage B (ATS revenue note deployment) is gated behind human authority HA-ATS-STAGE-B-001; the UI control is disabled ("Create revenue note — unavailable").
- Public deployment: https://tool402.vercel.app (nonpayable public smokes only).
- Dev command: `npm run dev --workspace=@tool402/web` from the repo root (`next dev` inside apps/web).
- Work is governed by AGENTS.md and the task queue; the Orchestrator owns main, human work lands via PR.

## Capabilities and Constraints

- Chain: Hedera testnet only for the judged demo. A generic EVM x402 branch exists but no mainnet use is configured, rehearsed, or evidenced.
- Wallet: MetaMask for the provider EIP-712 signing flow.
- Dependencies: `@x402/core`, `@x402/evm`, `@x402/hedera`, `@x402/next` 2.25.0; `@hashgraph/asset-tokenization-contracts` 8.0.0 (Factory artifact, `deployBond` / `BondDeployed` via viem, not wired to execution); `viem` 2.56.1; Next.js with Tailwind v4 configured inline in `globals.css`.
- Tools: RiskScan Quick (first listed tool; explainable, caller-context assessment; not financial, legal, insurance, security, or identity advice). EntityCheck (source-bounded French-entity assessment; not yet in the canonical directory; live sources and payment intentionally absent).
- Terminology: Consumer Agent, Tool Directory, RiskScan, EntityCheck, Stage B, ATS revenue note, facilitator, admission outcome.
- Facilitator: Blocky402 testnet facilitator passes the route check; the pay-to account is still open (undecided).
- Undecided: World ID Selfie Check as a gate for directory publication. It was merged and reverted (PR #51 / #52) and remains planned pending World beta access. Future work must not claim it is live.
- Undecided: final x402 and ATS transaction evidence, demo video, and submission commit (placeholders in docs/submission/README.md).

## Brand Commitments

- Name: Tool402. Page title "Tool402".
- Identity assets are binding, not placeholders: `src/components/tool402/logo.tsx`, `src/app/icon.svg`, `src/app/apple-icon.png`, `public/brand/logo-full.png`, `public/brand/mascot-wave.png`, `public/brand/mascot-flag.png`, `public/brand/hero-trio.png`.
- Voice is binding: terse, factual, hedged, no hype. No yield or return promises. The banner "Hedera testnet · campaign previews are not live offers." (src/app/layout.tsx) and explicit non-advice limits on tools stay.
- Testnet-only truth is binding: every surface keeps stating testnet or preview status until funding, payout, or mainnet evidence exists.
- Fonts currently system stacks via `--font-tool402-sans` and `--font-tool402-mono` in `globals.css`; no webfont is committed. This is a current fact, not a pinned constraint.

## Evidence on Hand

- Real: two tool implementations (RiskScan, EntityCheck), a public Vercel deployment, brand PNGs and mascot art.
- Absent (do not fabricate): product screenshots, demo video, testimonials, customers, benchmarks, pricing, funding, payouts, HCS or mainnet payments, a live Stage B deployment. The submission pack still holds unfilled placeholders for the final x402 transaction, ATS transaction, video URL, and submission commit. The Consumer Agent CLI paid exercise is pending.

## Product Principles

1. Truth over polish: every claim on a surface must be backed by something in the repo or on testnet; previews are labelled as previews.
2. Judge-first journey: the surface must let an evaluator complete the demo path without operator help.
3. Bounded tools, bounded promises: tools state what they do not do as clearly as what they do.
4. Human authority stays visible: signing, funding, and deployment are shown as human-gated, never as automatic.
5. Machine-payable by design: x402 challenge and verified settlement are the product mechanism, shown rather than abstracted away.

## Accessibility & Inclusion

Per docs/specs/m29-shell-accessibility-amendment.md: reduced-motion support, retained focus-visible outlines, no horizontal overflow at 375×812 and 1440×900, labelled header and nav landmarks, one `main` landmark per route. No full accessibility certification is claimed.
