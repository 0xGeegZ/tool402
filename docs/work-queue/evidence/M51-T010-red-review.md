# M51-T010 RED review

## Reviewed commit

`3aca764fb845d52912fee359323fdc6a72a4b71e` changes only the two activated
test paths.

## Result

The focused Backend contract has exactly one intended absence failure: a safe
pending offering projection does not yet include the linked prepared attempt
reference. The focused Web contract has exactly one intended absence failure:
the pure durable-resume helper is absent. No source, deployment, Convex
runtime, provider, wallet, signature, relay, authority, transaction, candidate,
or live action changed.

## GREEN scope

The minimal GREEN surface is now:

- `packages/backend/convex/offerings.ts`;
- `packages/backend/tests/offering-command-admission.test.mjs`;
- `apps/web/src/lib/offering-projection.ts`;
- `apps/web/src/lib/provider-campaign-resume.ts` (new);
- `apps/web/src/components/provider/deploy/deploy-stage-signing.tsx`; and
- `apps/web/tests/provider-campaign-resume.test.mjs`; and
- `apps/web/tests/deploy-stage-signing.test.mjs` (only its local import
  harness for the newly declared helper).

Every other path and every live boundary remains prohibited.
