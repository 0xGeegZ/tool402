# M45-T010 RED contract review

## Scope

Independent review at pushed `2ee65bb` covered the committed M45 RED
fixtures, the constrained Tool Directory regression amendment, and the exact
local GREEN paths named by the active card and M45 specification.

## Verification

Under Node 22.21.1, the focused Web command produced exactly two intended
failures: the absent `active-directory-version.ts` module and the current
route's absent active-view import. Seven pre-existing Tool Directory checks
passed and seven source-dependent checks skipped; no unrelated failure was
observed.

The review required and then rechecked the fixed two-second abort signal,
stalling and over-cap stream cancellation, case-insensitive JSON content-type
acceptance, descriptor-safe closed projection parsing, frozen detached views,
configured and unconfigured default-response equivalence, and controlled-value
non-disclosure. The re-review is clear.

## Verdict

CLEAR. Only these local GREEN targets are authorized:

- `apps/web/src/lib/active-directory-version.ts`;
- the declared type-only/view amendment to `apps/web/src/lib/tool-directory.ts`;
- the declared opt-in `GET` amendment to `apps/web/src/app/api/tools/route.ts`.

The default Tool Directory body remains unchanged. No Agent reader, payment,
configuration, provider, wallet, SDK, transaction, deployment, or live
behavior is authorized.
