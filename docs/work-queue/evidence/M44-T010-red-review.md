# M44-T010 RED contract review

## Scope

Independent review at `c5d2bf3` covered only
`apps/web/tests/create-bond-request.test.mjs` and
`apps/web/tests/ats-client.test.mjs`.

## Observed RED

Under Node 22.21.1, the focused test command reports exactly two intended
absence failures: `apps/web/src/lib/ats/create-bond-request.ts` and
`apps/web/src/lib/ats/ats-client.ts`. Nineteen remaining assertions skip until
those modules exist. Whitespace validation is clear.

## Established contract

- The detached request builder accepts the exact frozen thirty-field input,
  preserves every approved sentinel, and returns a detached immutable value.
- The injected client validates its configuration, wallet, signer, and prepared
  attempt before an injected SDK seam may be reached; repeated or concurrent
  calls cannot submit more than once per prepared attempt.
- The client-island boundary permits exactly the official SDK import and no
  ambient provider, private configuration, display-literal reuse, or direct
  SDK load outside that island.

## Verdict

CLEAR. This accepts the RED contract and authorizes only the day-one official
SDK bundle gate: the exact official dependency pin and lockfile, the matching
static-shell assertion, and the minimum client-island import needed to test
the bundle. A bundle failure stops the card and is recorded. It does not
authorize a trusted configuration bridge, durable attempt, wallet/provider
interaction, transaction, deployment, or live behavior.
