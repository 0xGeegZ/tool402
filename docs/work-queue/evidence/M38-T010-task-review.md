# M38-T010 final task review

## Scope

Independent review of the committed pure-Core implementation at
`329b0a8234afb511180e898b477933ec9fae8632`:

- [M38 control card](../queue/60-done/M38-T010-offering-command-payloads.md)
- [M38 local specification](../../specs/m38-offering-command-payloads.md)
- `packages/core/src/offering-create-payload.ts`
- `packages/core/src/directory-publish-payload.ts`
- `packages/core/src/attach-candidate-payload.ts`
- the append-only M38 exports in `packages/core/src/index.ts`

The final source matches the accepted three-payload contract. The parsers are
closed, descriptor-safe, detached, and frozen. They delegate the retained M20,
M26, and M28 boundaries rather than duplicating them. The Directory record is
parsed only from its initial captured snapshot, including the optional URL
presence distinction. Each bytes builder creates fresh canonical JCS UTF-8
bytes without introducing a hash, runtime adapter, or external capability.

## Verification

Under Node 22.21.1:

- focused M38 contracts: 21/21 passed;
- complete Core suite: 136/136 passed;
- Core typecheck and boundary lint passed;
- root typecheck, test, and lint passed;
- clean-install dry run, queue check, whitespace check, local-reference guard,
  and enabled Git guard passed.

## Verdict

CLEAR — no Critical, Important, or Minor finding. This supports only local Core
acceptance; it does not admit a command or authorize wallet, provider, network,
storage, ATS, transaction, deployment, or live behavior.
