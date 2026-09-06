# Next delivery slices design

## Decision

The next delivery batch has three independent CORE_P0 slices:

1. an exact-value boundary in the pure core package;
2. a fuller public product landing; and
3. a truthful application workspace shell at `/dashboard`.

The user has confirmed that both the public landing and the application after
an eventual Sign step are product scope. That confirmation authorizes the
local design and implementation of these slices. It does not authorize a
wallet, account, signing, funded payment, transaction, provider setup,
deployment, or claim that an authenticated session exists.

## Selected shape

The value boundary is a small pure module. It accepts canonical decimal
strings, returns branded `bigint` values or canonical identifier strings, and
never accepts JavaScript numbers. Later economic, network, or settlement work
can consume this boundary without silently losing precision.

The landing stays server-rendered and uses the already committed local design
tokens, primitives, logo, and mascot. It explains Tool402 and the bounded
RiskScan path, then links only to routes that already exist locally. It avoids
invented testimonials, metrics, availability, results, prices, or payment
status.

The application shell is a separate static `/dashboard` route. It is a guest
and unconfigured workspace: it gives a useful route map without fabricating a
user, session, account, balance, provider, wallet, position, notification, or
activity. A later card must specify the actual session, recovery, privacy, and
provider boundary before a real Sign flow is added.

## Boundaries and sequencing

The three slices have disjoint implementation paths. The root retains queue,
ledger, decision, catalog, ownership, and integration records. M10 can run
beside both M11 slices. The two M11 slices do not modify the same files:
landing owns the root-page and landing component subtree; workspace owns the
dashboard route, workspace subtree, navigation amendment, and its corresponding
legacy navigation-test amendment.

Each slice first commits its local contract and plan. Its implementer then
writes a focused failing test, observes the expected failure, and implements
the smallest behavior. Independent task review precedes queue acceptance.
Browser checks are required for the two web slices at desktop and narrow
widths.

## Non-goals

This batch adds no authentication, wallet connection, payment client, price,
funding path, transaction, settlement, persistence, analytics, external link,
provider surface, deployment, or live proof. It does not replace the accepted
RiskScan vertical; it makes that local work easier to discover and prepares a
safe foundation for later signed-in product work.
