# M55-T010 — Provider demo attempt restart

## State

- Tier: CORE_P0
- Queue state: 00-inbox
- Dependencies: none.
- Owner: the root owns queue/control records, the implementation plan,
  readiness, activation, RED/GREEN review, integration, commits, and pushes.
- Human actions: no live attempt, signature, transaction, candidate,
  publication, deployment, or other provider action is authorized by intake.

## Purpose

Provide the Provider deployment wizard with an explicit, truthful recovery
path for a failed demo take. The action starts a separate attempt; it is never
a Clear, Reset, Cancel, Delete, or rollback control.

## Local authority

The minimum local contract is
[M55 provider demo attempt restart](../../../specs/m55-provider-demo-attempt-restart.md).

The precise Backend, Convex, Web, API, and test paths must be declared only
after the allocator authorization choice and a fresh M51-release review. This
card deliberately reserves no source path at intake.

## Candidate ready requirements

- M51 is accepted and releases its `offerings`, offering projection, resume,
  and deploy-signing reservations.
- A committed implementation plan fixes the authenticated allocator, selected
  attempt route shape, command-binding changes, and Directory listing policy.
- The card, specification, catalog, ownership, State, and decision records
  resolve together before any test or source change.
- The declared paths are disjoint from every active lane.

## Boundary

This intake adds no source, schema, query, mutation, endpoint, browser state,
wallet request, signature, relay, transaction, candidate, publication,
deployment, or live behavior. It does not authorize a browser-only durable
write or any unauthenticated attempt allocator.
