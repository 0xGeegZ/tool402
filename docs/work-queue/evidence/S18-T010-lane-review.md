# S18-T010 lane review

## Scope

Independent review of the delegated lane commit
`18de36f86dc80207d8d45e3a7fd9c5ce4844218d` against canonical
`1aef636b0e6afde69ec3e616bf884adf2444eccd` and HI-012.

## Findings

- The lane changes only the five paths declared by S18-T010: the Back
  RiskScan route, backing flow, backing state, and two focused tests.
- The direct route passes `null`; it has no fetch, environment read, fixture,
  fake treasury, or sample offering. It therefore renders only the truthful
  unavailable state on the current host.
- The flow composes the existing wallet island, signature dialog, relay, and
  session re-check. It creates no parallel provider selection, signing, relay,
  or authority mechanism.
- A transfer is formed only from an accepted command. The target must be an
  explicit lowercase EVM address, all values use integer arithmetic, and
  unknown/no-hash results perform no retry.
- The focused state contract passes 8/8, the route contract passes 4/4, Web
  typecheck passes, and `git diff --check` is clear under Node 22.21.1.

## Verdict

CLEAR. Integrate and accept the declared S18 lane as a local UI boundary only.
HI-012 provisions neither a `BACKER` authority nor an M40 treasury. Before a
future caller supplies a projection, it must be separately accepted and reject
every offering state except `OPEN`.
