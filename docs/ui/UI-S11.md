# UI-S11 guided demo narration manifest

## Delivery boundary

UI-S11 adds one static guest narration route that walks a presenter or an
evaluator through the routes this repository has already accepted, in the order
they are meant to be shown. It is a route map with expected-observation copy.
It adds no new product behavior, no new domain state, and no new client
capability.

The source material for this adaptation remains outside the repository. This
manifest records the local target boundary only; it stores no source
identifier, URL, checksum, or clone information.

## Local targets

The slice adds only these exact paths:

- `apps/web/src/app/demo/page.tsx`;
- `apps/web/src/components/demo/guided-demo-steps.tsx`; and
- `apps/web/tests/guided-demo-route.test.mjs`.

It may make only one constrained integration amendment: add the exact local
navigation entry `{ href: "/demo", label: "Demo" }` in
`apps/web/src/components/discovery/local-navigation.tsx` and update only its
corresponding assertion in `apps/web/tests/landing-explore.test.mjs`. It does
not change any existing navigation entry, route copy, layout, or test scope.

It reuses the existing local Card, Badge, and semantic Link primitives and the
accepted global tokens. It adds no dependency, no icon package, no animation
package, and no font.

## Narrated route set

The narrated steps may name only routes accepted in this repository at the same
commit:

- `/` product landing
- `/explore` discovery
- `/explore/riskscan` RiskScan detail
- `/explore/riskscan/try` bounded Try request
- `/explore/riskscan/tool-loop` browser ToolLoop
- `/dashboard` guest workspace shell
- `/dashboard/riskscan` guest RiskScan workbench
- `/dashboard/riskscan/compatibility` native quote compatibility
- `/dashboard/riskscan/preflight` Quick disclosure preflight

Each step states what a viewer will actually observe on that route. A step must
not promise an observation the target route does not already produce.

The component must use this exact ordered local copy:

| Order | Target | Step title | Expected observation |
| --- | --- | --- | --- |
| 1 | `/` | Product overview | Read the product overview and continue to Explore. |
| 2 | `/explore` | Explore assessments | Find the RiskScan entry and its local discovery surface. |
| 3 | `/explore/riskscan` | Read RiskScan | Review the Quick input, result, and configuration boundaries. |
| 4 | `/explore/riskscan/try` | Try the local request | Inspect the bounded Quick request surface. |
| 5 | `/explore/riskscan/tool-loop` | Follow ToolLoop | Inspect the local ToolLoop request boundary. |
| 6 | `/dashboard` | Open the workspace | See the guest workspace shell. |
| 7 | `/dashboard/riskscan` | Review the workbench | Follow the guest RiskScan workbench sequence. |
| 8 | `/dashboard/riskscan/compatibility` | Check compatibility | Inspect the guest native quote compatibility surface. |
| 9 | `/dashboard/riskscan/preflight` | Review disclosures | Inspect the guest Quick disclosure preflight. |

## Truthfulness and authority boundary

The route is server-rendered with one `main` landmark and one `h1`. It contains
no client component, fetch, timer, storage read, environment read, analytics,
or external link.

It must not narrate, imply, or link a backing, funding, offering, position,
portfolio, allocation, clearing, snapshot, payout, or ATS surface; those remain
unsurfaced under the recorded HI-001 CUT. It must not narrate a sign-in,
sign-up, onboarding, verification, provider, or reviewer surface; a real
Sign/session flow still requires its own local provider, recovery, privacy, and
authority contract. It must not narrate an evidence, activity, or issue read
surface; recorded settlement evidence is process-local and has no accepted read
or privacy contract. It must not present live availability, uptime, network
status, price, balance, receipt, transaction, or deployment claims, and it must
not describe a simulated or illustrative state as a real one.

The page is presentation scaffolding for a human demonstration. It grants no
configuration, identity, payment, deployment, or submission authority, and it
is not evidence that any narrated step has been performed.

## Acceptance evidence

- A focused source contract covers static route semantics, the single `main`
  and `h1` shape, the exact ordered narrated copy and link targets, the exact
  single local navigation amendment, the absence of any client component or
  network behavior, and the exclusion boundary above.
- A focused assertion proves every narrated href resolves to a route accepted
  in this repository at the same commit.
- Desktop and narrow browser checks cover rendering, local navigation, visible
  keyboard focus, honored reduced-motion preference, no horizontal overflow,
  and clean framework and browser diagnostics.
- Web typecheck/test, production build with Cache Components, root quality,
  queue/reference checks, the enabled local guard, and independent review pass
  before acceptance.
