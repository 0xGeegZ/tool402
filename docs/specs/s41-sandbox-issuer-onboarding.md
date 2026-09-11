# S39 sandbox issuer onboarding

## Status and outcome

Planning-only local specification. S39 follows accepted S38 authentication and
lets a newly signed-in wallet create an isolated `DRAFT` offering through
`/provider/deploy`. It creates no ATS asset, transaction, directory listing,
payment, or live offering.

The authoritative design is
[Sandbox issuer onboarding design](../superpowers/specs/2026-09-11-sandbox-issuer-onboarding-design.md).

## Fixed behavior

The S38 verification route provisions before setting a dashboard session. The
private Convex mutation derives every sandbox field from the verified canonical
wallet address and only accepts an exact existing record or creates the one
deterministic record. An unavailable/configuration/conflict result yields a
closed unavailable response and no session.

The sandbox authority has `ISSUER` role for compatibility with offering
admission, owns only its deterministic `sandbox_<address>` subject, and has
the explicit sole capability `offering.create`. Every command normalizer and
durable admission enforces that capability. Existing manual authorities omit
the optional capability field and retain their prior behavior; S39 never
rewrites them.

The signed `/provider/deploy` route derives the sandbox subject from the
dashboard session, requires the shared MetaMask account to match, and passes
that subject to the command bridge. Only stage 0 can be actioned. Its accepted
result is `DRAFT`; all later stages are unavailable and defensively rejected
server-side.

## Boundaries

S39 may not use the static `riskscan_revenue_note_demo` subject for any sandbox
command. It may not change ATS configuration, M33 mapping, Stage B behavior,
or the manually provisioned authority. It adds no public authority endpoint,
no client-side trust decision, no wallet transaction, and no configuration
value in source control.

The HMAC-protected Next-to-Convex provisioning endpoint and its environment
configuration require a separate human-owned deployment/release action. A
human-owned browser signature may validate the final user journey; automated
tests use injected fakes only.
