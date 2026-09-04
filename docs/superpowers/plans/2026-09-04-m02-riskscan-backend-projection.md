# RiskScan Backend Projection Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Expose a pure serializable backend read model for every accepted RiskScan lifecycle state.

**Architecture:** Add one projection module that type-imports the core lifecycle union and returns a fresh discriminated read model. Re-export it from the backend entry point; no Convex function, persistence, or I/O is introduced.

**Tech Stack:** TypeScript, Node 22 native type stripping, npm workspaces, Node test runner.

**Spec:** [M02 RiskScan backend projection contract](../../specs/m02-riskscan-backend-projection.md)

## Global Constraints

- Use only accepted local lifecycle types; never invent payment, evidence, or result data.
- Keep the package free of public state-changing commands and I/O.
- Test the public backend entry point before implementation and run focused backend checks.

## File Structure

- `packages/backend/src/risk-scan-projection.ts`: pure projection and read-model types.
- `packages/backend/src/index.ts`: public re-export.
- `packages/backend/tests/risk-scan-projection.test.mjs`: public lifecycle projection contract.
- `packages/backend/package.json` and root lockfile: root-owned local core dependency integration.

## Tasks

- [ ] Add the failing public-entry test for state-specific projections and copied completed arrays.
- [ ] Run the backend test to confirm the intended export is absent.
- [ ] Add the smallest pure projection and public re-export.
- [ ] Add the declared local core dependency through root integration.
- [ ] Run backend typecheck, test, lint, whitespace, and local-reference guard.
- [ ] Obtain independent review and integrate only accepted work.
