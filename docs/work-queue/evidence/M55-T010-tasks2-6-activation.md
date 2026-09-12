# M55-T010 Tasks 2–6 — root activation and scoped transfers

## Authority

The repository owner explicitly authorized the complete local M55 implementation
on 2026-09-12: Tasks 2–6, their queue/control commits, serial TDD, review and
integration may proceed in the existing PR branch. This authorization excludes
wallet signatures, transactions, Directory publication, authority provisioning,
environment mutation, and every other live action.

`origin/main` is `98cdbe29c59c44cc3145ddbef3615b985dfad45b`; this branch starts
the continuation at `f0505cc0bc828f0deb0a655605040aa01ada6ef2`.

## Exact transfer rule

M55 receives only the selected-provider-tool branch of the listed seams. The
legacy `riskscan_revenue_note_demo` branch and each predecessor's existing
behavior remain owned by that predecessor. Every changed transferred seam gets
a joint M55/predecessor compatibility review before integration.

| Task | Transferred predecessor seam | M55-only purpose |
| --- | --- | --- |
| 2/5 | M51 `offerings.ts`, `offering-command-admission.test.mjs`, `command_dispatch.ts`, `command-dispatch.test.mjs`, `offering-projection.ts`, and the selected-resume adapter/test | Resolve an allocated tool's exact owner/authority/subject/offering context; preserve M51's fixed legacy pending-offering projection. |
| 3/6 | B04 canonical identity, command/execution/configuration paths and their focused tests | Add a discriminated provider-tool projection while retaining the byte-identical legacy preimage and B04's bounded-input controls. |
| 4/6 | M53/M54 browser bridge/test and M54 action/state/signing/stages seams | Validate a selected tool's evidence without altering M53's one-Factory-event rule or M54's explicit read-only recovery rule. |
| 6 | S26 signing composition, S36 stage handoff, and S42 dashboard card/page seams | Carry selected-tool state without changing S26's shared-session control, S36's one callback, or S42's signer-exact legacy read-only card. |

New M55-specific files and non-reserved plan paths are reserved to M55 for the
same serial implementation. `provider_tool_authority.ts`, per-tool ATS/receipt
helpers, directory helpers, the allocation dialog/client and their focused
tests begin as durable RED targets. M55 does not acquire any unrelated B04,
S26, S36, S42, M51, M53, or M54 path.

## Slice sequence

1. Task 2: selected-tool owner/authority binding for signed offering and
   preparation commands.
2. Task 3: per-tool server-derived ATS configuration and browser projection.
3. Task 4: corroborated, exclusive receipt attachment.
4. Task 5: per-service Directory identity and protected/public projection split.
5. Task 6: explicit creation, selected routing/resume, and multi-tool dashboard.

For every slice: create focused RED first, observe its intended failure,
implement minimal GREEN, run focused contracts, then obtain a scoped
compatibility review. Cross-tool replay, attachment, Directory and UI routing
must fail closed. No slice may create a live deployment as a side effect.
