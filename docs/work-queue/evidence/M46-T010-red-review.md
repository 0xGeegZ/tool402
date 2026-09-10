# M46-T010 RED contract review

## Scope

Independent review at pushed `f8a42e7` covered only the committed M46 Core
runtime and type fixtures, their active card, and the committed EntityCheck
specification.

## Verification

Under Node 22.21.1, the focused runtime command has exactly one intended
failure: `packages/core/src/entity-check.ts` is absent. The fifteen
source-dependent assertions skip. Core typecheck passes while source is
absent.

The contract rejects hostile records and every dense-array item before reading
accessors, including a later array index. It preserves mapped public-source
strings above 512 characters, including a matched sanctions name returned in
the result. Its gated virtual TypeScript fixture directly imports each named
type-only public export after GREEN and checks it against the value signatures
and closed disposition and screen unions.

The follow-up test correction at `f893759` explicitly serves that virtual
fixture through the TypeScript compiler host. It preserves the same
source-absence-only RED outcome and adds no source behavior.

At pushed `ff27d7e`, a further focused fixture correction replaced a
near-equivalent sanctions name with a candidate name that is exactly equal
after the specified normalisation. It does not permit suffix-token equivalence
or symbol stripping and adds no source behavior.

## Verdict

CLEAR. Only these local GREEN targets are authorized:

- `packages/core/src/entity-check.ts`;
- the declared export-only EntityCheck amendment to `packages/core/src/index.ts`.

No source adapter, API, Directory, UI, package, configuration, payment,
wallet, provider, transaction, deployment, or live behavior is authorized.
