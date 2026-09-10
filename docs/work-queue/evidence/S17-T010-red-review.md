# S17-T010 RED contract review

## Scope

Independent review at clean pushed
`133901baa3b1cfa066c924fc0c708999e88a7f11` covered only the two declared S17
durable RED fixtures and the three root-reserved frozen navigation assertions.

## Verification

Under Node 22.21.1, the focused combined contract has exactly five intended
S17 failures: the absent provider projection reader and offerings route, plus
the three accepted navigation tests waiting for the `/provider` entry. The
provider-state behavior assertions skip until the declared paths exist. The
review rechecked absent-environment no-fetch behavior, independent 2-second
projection deadlines with a 16,384-byte cap, fixed presentation order/action
mapping/evidence rows, the gated external link, and no request or upstream
logging. `shell-accessibility.test.mjs` is unchanged.

## Verdict

CLEAR. Only these local GREEN targets are authorized:

- `apps/web/src/app/provider/page.tsx`;
- `apps/web/src/lib/offering-projection.ts`;
- `apps/web/src/app/api/offerings/route.ts`;
- `apps/web/src/components/provider/status/provider-status.tsx`;
- `apps/web/src/components/provider/status/provider-status-state.ts`;
- the root-reserved `{ href: "/provider", label: "Provider" }` navigation
  entry.

No client state, timer, command, write, live read, wallet/provider, payment,
transaction, deployment, or live behavior is authorized.
