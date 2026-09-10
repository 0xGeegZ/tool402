# M41-T010 ingress and atomic-handoff module review

## Scope

Fresh independent module review at clean pushed
`20983649632f4812d9ee045637eb183b3158cc38` of M41's ingress/authentication
composition, transport replay identity, production ingress-key validation,
M32 atomic ATS_CREATE selection, and M40 projection parsing against the local
M41 card and specification.

## Review

- The five-header ingress envelope is rebuilt over raw bounded bytes before
  command normalization or durable dispatch.
- Invalid ingress configuration, malformed key identifiers, replayed transport
  identities, and unsafe projection records fail closed without exposing
  protected values.
- ATS_CREATE reaches only the atomic M32 handoff; no HTTP path selects an
  offering document or performs a dispatch-side transition.
- Offering and Directory projections retain closed grammars, including own
  special keys and decorated arrays, and return only their declared outcomes.
- No configuration publication, provider, wallet, SDK, transaction, or live
  capability is introduced.

## Verification

Under Node 22.21.1, focused M41/M32/M40 integration checks passed 75/75 and
the complete Backend suite passed 242/242.

## Verdict

CLEAR — no Critical, Important, or Minor finding. This is the first required
fresh M41 module-review generation.
