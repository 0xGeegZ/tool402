# M57 Demo Evidence Capture Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Export safe Consumer Agent evidence once and display the imported local summary in `/demo` without changing payment behavior.

**Architecture:** A small Agent-only serializer receives an already-returned `paid` outcome and immutable non-secret configuration snapshots. A Web-only evidence model validates that JSON as untrusted input, derives honest display states, stores a constrained copy in localStorage, and supplies the existing control room. No server reader or x402 sink reader is added.

**Tech Stack:** TypeScript, Node built-in filesystem/crypto, React/Next.js, Node test runner.

**Spec:** `docs/specs/m57-demo-evidence-capture.md`

## Global Constraints

- Preserve the existing single Directory request, one unsigned request, and one signed retry payment boundary.
- Do not modify M56/backing, M55/ATS, World, backend durable records, or the process-local settlement sink.
- Persist/export only the allowlisted schema; no secret, request context, assessment, raw response, header, or signature data.
- Never treat imported success or verified flags as verification authority.

---

### Task 1: Agent evidence serializer and opt-in output

**Files:**
- Create: `apps/agent/src/riskscan-payment-evidence.ts`
- Modify: `apps/agent/src/riskscan-pay-cli.ts`
- Test: `apps/agent/test/riskscan-payment-evidence.test.mjs`

- [ ] Write failing tests for a `paid` outcome packet, preflight exclusion, and a failed writer that observes exactly one payment invocation.
- [ ] Run `npm run test --workspace @tool402/agent -- riscan-payment-evidence.test.mjs` and observe the missing-module failure.
- [ ] Add a pure allowlisted serializer and an injected CLI output seam; write only after the normal paid trace, emit a closed capture-failed diagnostic on output failure, and do not retry payment.
- [ ] Re-run the focused Agent test and Agent typecheck.

### Task 2: Strict Web evidence model and rendering

**Files:**
- Create: `apps/web/src/components/demo/demo-evidence.ts`
- Modify: `apps/web/src/components/demo/demo-control-room.ts`
- Modify: `apps/web/src/components/demo/recording-control-room.tsx`
- Test: `apps/web/tests/demo-evidence.test.mjs`
- Test: `apps/web/tests/demo-control-room.test.mjs`

- [ ] Write failing tests for malformed/untrusted input, deduplication, local retake restoration, pending state, and HashScan links.
- [ ] Run the focused Web test and observe its missing-module failure.
- [ ] Implement strict snapshotting, local-only persistence, import/export helpers, and derived rendering without a network loop.
- [ ] Re-run focused Web tests and Web typecheck.

### Task 3: Synchronize the guide and verify

**Files:**
- Modify: `docs/release/**` only where the existing B03 command appears
- Test: existing focused Agent/Web tests

- [ ] Update the safe command to include the optional export example while retaining the no-export behavior.
- [ ] Run focused suites, root typecheck/lint/test/build, queue/reference guards, and inspect the final diff.
- [ ] Obtain an independent exact-head review and perform an injected desktop/390px `/demo` rehearsal.
