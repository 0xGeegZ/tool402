# S17-T010 responsive browser evidence

## Local route check

At source commit `e7a015565a0579b26c1af439410823e533712043`, an isolated local
browser opened `http://localhost:3000/provider` at a 390px viewport.

- The route rendered the five local navigation links and the Provider campaign
  status landmarks.
- With no configured record source, every projection-dependent region rendered
  the explicit `not configured.` outcome.
- The measured values were exactly `viewport: 390`,
  `documentScrollWidth: 390`, `bodyScrollWidth: 390`, and
  `headerScrollWidth: 390`.
- A keyboard Tab moved focus to the `Home` link at `/`.
- No wallet, provider, payment, request submission, transaction, deployment,
  or live action was invoked.

## Runtime cross-check

The local Next diagnostics returned an empty compilation-issue list and empty
configuration/session error lists after the responsive correction.

## Verdict

CLEAR — the shared navigation no longer produces horizontal overflow at the
required narrow viewport, while the route remains a truthful read-only local
surface.
