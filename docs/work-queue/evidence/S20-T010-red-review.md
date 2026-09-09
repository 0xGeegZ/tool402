# S20-T010 RED review

## Scope

Fresh independent read-only review of:

- the active [S20 control card](../queue/20-active/S20-T010-explore-marketplace-catalog.md);
- the local [UI-S20 marketplace catalog manifest](../../ui/UI-S20.md); and
- the durable test-only contract in `explore-catalog.test.mjs`,
  `landing-explore.test.mjs`, and `riskscan-directory-discovery.test.mjs`.

## Observed RED

Under Node 22.21.1, the focused command has exactly nine passing tests and
three expected failures, with no skip or incidental failure:

1. `explore-catalog.test.mjs` cannot read the absent declared
   `explore-catalog.tsx` source file;
2. the Explore page does not yet mount `ExploreCatalog` in the landing/Explore
   contract; and
3. the same absent mount fails the Directory-island placement contract.

Only the three authorized test paths changed. The catalog source remains
absent, and no page, discovery card, directory island, workbench, navigation,
wallet, fetch, provider, payment, transaction, deployment, or live path was
modified.

## Established contract

- The catalog must be one frozen local RiskScan record with the exact
  UI-S01 description, visible derived `CATALOG.length` count, present-value
  rail groups, and an explicit no-zero-count filter.
- The static catalog has no client state, data fetch, link/control, or
  interactive ARIA surface; the empty tile remains descriptive only.
- The server Explore page mounts the catalog and not the directory island;
  the unchanged guest workbench remains the island's accepted mount.
- The accepted navigation and UI-S01 truthfulness assertions remain covered.

## Verdict

CLEAR — the durable RED contract is accepted. It authorizes only the declared
minimal S20 GREEN source paths:

- `apps/web/src/app/explore/page.tsx`;
- `apps/web/src/components/discovery/explore-catalog.tsx`; and
- `apps/web/src/components/discovery/riskscan-discovery-card.tsx`.

It does not authorize a Directory-island/workbench/navigation change, client
state, fetch, wallet, provider, payment, transaction, deployment, or live
behavior.
