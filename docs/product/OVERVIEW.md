# Tool402 Product Overview v0.1

## Status and delivery boundary

This is the runtime-local product brief for the first hackathon delivery slice. It describes intended behavior and the evidence needed to support it; it does not claim that any service, payment, testnet transaction, deployment, account, or integration is live today. The clean repository and its committed local decisions are the authority for this brief. A later implementation may only claim runtime behavior after the relevant code, verification, review, and live evidence exist.

The immediate product target is deliberately narrow: one agent-facing tool, one paid request journey, and one evidence trail. The point is to prove a coherent machine-payment loop rather than imitate a finished marketplace.

The product scope also includes a real public landing and a future signed-in
application experience. The landing may explain and navigate the local
product surface now. The first application shell is deliberately a guest,
unconfigured route: it creates no identity, session, wallet, account, or
personal data claim. A genuine Sign flow needs its own local session,
recovery, privacy, and provider contract before implementation.

## Problem

Software agents need to decide whether a paid tool is useful before they can safely spend on it. Traditional APIs assume a human developer already has credentials, a subscription, and private context. That model is awkward for an autonomous or semi-autonomous consumer: it hides price and capability, makes a real payment difficult to distinguish from a simulated success state, and leaves little evidence that a result was actually produced after settlement.

Tool402 addresses that gap with a marketplace-shaped experience for verifiable machine-paid tools. The product should make the boundary between discovery, payment, execution, and evidence observable. A consumer must be able to learn what a tool can do, receive an explicit payment requirement, obtain a bounded result after authorized payment, and inspect a receipt-like record without treating any of those stages as a silent success.

## Thesis

A small, truthful payment loop is more valuable at D-Day than a broad catalogue of mocked tools. If a consumer can discover a useful service, encounter a real payment boundary, receive one well-scoped result, and retain verifiable evidence of the journey, the project demonstrates the core thesis: useful agent-to-service exchanges can be priced, settled, and made inspectable without permanent API credentials or subscription accounts.

The thesis does not depend on a speculative dashboard, a custody product, or a large set of partners. It depends on an honest distinction between planned UX states, verified implementation states, and evidence gathered from an actual testnet journey.

## First tool: RiskScan

RiskScan is the first planned tool. It gives a consumer a bounded risk-oriented assessment for a supplied subject and request context. Its job is not to offer financial, legal, insurance, or security guarantees. It should return a compact result that tells the consumer whether the requested assessment is available, what the salient reasons are, what inputs or limitations affected it, and how the consumer can associate the result with its payment and evidence record.

The initial tool must stay intentionally small. It may accept a reference and a narrowly defined assessment request; it should return a structured outcome rather than an open-ended research report. Later local specifications will define the accepted input shape, result fields, failure semantics, pricing, and evidence format. Until those specifications and tests exist, this overview is not a contract for an endpoint.

## Actors

The consumer is an agent or application seeking a paid, bounded assessment. It discovers tool metadata, chooses whether the price and capability are acceptable, and initiates a request.

The tool service exposes the RiskScan capability, presents a payment requirement, runs the assessment only after the required payment state is satisfied, and returns a result with evidence-oriented identifiers or links.

The human operator owns every sensitive external step. The operator may later authorize accounts, funding, wallet interaction, testnet settlement, deployment, narration, and submission. The product must never imply that an agent has authority to perform those actions merely because it can prepare a request.

An observer is a person evaluating the D-Day journey. The observer needs a clear way to distinguish an unavailable request, a payment requirement, a pending or failed payment, a completed result, and the related evidence. The observer should not need to infer success from decorative UI copy.

## Core D-Day loop and scope

The planned journey has six visible stages:

1. A consumer discovers RiskScan and reads a concise capability, price, and limitation summary.
2. The consumer requests the tool without pre-existing credentials and receives a payment challenge rather than a fabricated result.
3. After the human-authorized testnet payment path is available, the consumer satisfies the challenge through the selected x402 settlement route.
4. The service executes the bounded assessment and returns a structured result or an explicit failure state.
5. The consumer receives a receipt-like reference tying the request, payment outcome, and result together.
6. The product exposes the associated testnet evidence in a way that a demo observer can inspect.

Stages three through six are planned delivery targets, not current capabilities. The local eligibility decision requires a live x402-gated service, settlement through the designated facilitator, and a real paid request before those stages can be claimed as complete. The current scope decision is recorded in the [runtime decisions](../work-queue/DECISIONS.md).

## Non-goals

This first slice does not build a general-purpose tool marketplace, an agent wallet, a custody service, a production mainnet product, a subscription system, or a multi-network payment router. It does not promise live external integrations beyond the single planned payment and evidence path. It does not import a full prepared UI, reproduce prior implementation material, or make a partner or prize claim that lacks local evidence.

Rich profiles, social discovery, provider assurance, optional data sources,
additional tools, recurring payments, and polished analytics are deferred.
They may receive their own local cards only when the foundation is accepted
and the claimed capability has a concrete validation path. The public landing
and guest workspace shell are separate, already-approved product
presentation work; neither substitutes for a real signed-in experience.

## High-level system shape

The first implementation is expected to have five clear boundaries. A client or consumer adapter presents discovery and request states. A tool-service boundary owns the RiskScan request and result. A payment adapter translates the explicit payment challenge and settlement outcome into typed application states. An evidence adapter records or retrieves the testnet proof associated with a completed request. A small presentation layer maps these states into observer-readable UI without inventing data.

Each boundary should fail honestly. A missing capability, unavailable evidence record, payment rejection, timeout, or execution error must result in a visible degraded state rather than a successful-looking placeholder. The eventual technical design will choose concrete modules only after the foundation cards establish the workspace, queue validation, and reproducibility gates.

## Success criteria and testnet limitations

Success at D-Day means a reviewer can follow one complete, reproducible, human-authorized testnet journey from discovery through a paid request, bounded result, and inspectable evidence. The repository should explain how to run the slice, show its architecture and payment boundary, and distinguish the verified path from unimplemented ambitions. Automated tests and browser checks will prove local behavior; live testnet evidence is a separate proof and must never be replaced by mocks.

The testnet slice is experimental. It may be unavailable, rate-limited, reset, or economically nonrepresentative. It offers no promise of production reliability, security guarantees, data completeness, or financial outcome. Credentials, private material, and funded state must remain outside the repository. When an external action is needed, the queue will create a specific human action instead of assuming approval.

## Conditional integrations

The current local scope includes a future x402 payment route and a testnet evidence route because they are necessary to demonstrate the D-Day loop. They remain conditional: no account setup, payment, transaction, service deployment, or integration claim is authorized by this brief. Any optional external route remains out of scope until a local task records its purpose, dependencies, ownership, validation, and required human action.

This constraint keeps the product honest. The next technical phase is foundation work, not a license to build unverified product behavior or to widen the integration surface.
