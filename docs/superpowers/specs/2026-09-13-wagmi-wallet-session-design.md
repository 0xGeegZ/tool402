# Tool402 Wagmi Wallet Session Migration Design

**Goal:** Replace the in-house MetaMask connection/session transport with
Wagmi v3 and Viem while preserving Tool402 server authentication and financial
business safeguards.

**Architecture:** A single SSR-enabled Wagmi configuration and stable browser
provider tree becomes the connection authority. UI and workflow adapters read
that authority; the dashboard session stays server-issued and the command,
ATS, backing and evidence protocols remain intact.

**Detailed contract:** [W01 implementation-local specification](../../specs/w01-wagmi-wallet-session.md).

## Design decisions

1. Use neutral client persistence with an explicit resolving state. This keeps
   public App Router routes static and prevents hydration's initial empty state
   from invalidating a valid signed dashboard cookie.
2. Limit the connector to injected MetaMask and use Wagmi's discovery rather
   than retaining the custom EIP-6963 listener/timer. MetaMask selection is
   explicit; extension metadata is never treated as cryptographic identity.
3. Treat dashboard session sync as a narrow server-session safety coordinator,
   not as a second wallet store. It performs at most one logout per resolved
   invalid context and fails closed if that logout cannot be confirmed.
4. Preserve pure protocol code. Command builders keep their deterministic
   data contract and accept a typed-data signing seam; transaction workflows
   keep their reservation/idempotency/evidence logic and use a context-checked
   Wagmi action for transport only.

## Delivery sequence

1. Record W01 as an inbox card and review this design/specification.
2. Move only a dependency-satisfied W01 card to ready, create focused RED
   tests, and obtain the required review before package or source changes.
3. Introduce the provider/configuration and migrate connection UI, dashboard
   authentication, command signing, ATS/backing transfer transport in bounded
   RED/GREEN commits.
4. Delete the old discovery/store/listener modules and their form-only tests;
   retain business guards and deterministic compatibility fixtures.
5. Rebase on refreshed `origin/dev` (including any merged #118 work), run
   all required validation/browser checks, conduct independent review, and
   open a draft PR without merging or deploying.
