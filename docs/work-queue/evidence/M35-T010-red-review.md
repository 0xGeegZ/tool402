# M35-T010 RED review

## Scope

Independent review of the M35 test-only RED contract at these pushed commits:

- `9207e9715d73655339edc1a3b0c47de1fd3bcff1`
- `16ad000`
- `8a72e0b`
- `8e12374012ce3ee621b61e22f9bdf305cf833592`

The reviewed path is only
`packages/backend/tests/local-unsigned-ats-create-configuration.test.mjs`.
The declared private source did not exist at every reviewed RED revision.

## Observed RED

Under Node 22.21.1, the focused test failed only with
`ERR_MODULE_NOT_FOUND` for
`packages/backend/src/ats/local-unsigned-ats-create-configuration.ts`.

## Findings and corrections

The first review found that the static capability/shape check could omit
non-enumerable own fields, clock/network paths, dependency sections, and a
public package subpath. The root added exact `Reflect.ownKeys` checks, complete
dependency-section checks for Backend and root packages, exact Backend exports,
and a capability allowlist.

The next rereview found that simple source-line matching and a helper-name-only
barrel check could miss static imports or a wildcard reexport. The root switched
to TypeScript static import/export parsing and rejects the private module path
from the public barrel.

The final rereview found that `import.meta` and comment-separated dynamic
imports could evade those top-level checks. The root added recursive TypeScript
AST checks for every dynamic `ImportKeyword` call and `import.meta`
`MetaProperty`. The final rereview at `8e12374012ce3ee621b61e22f9bdf305cf833592`
found no remaining Critical, Important, or Minor finding.

## Established contract

The accepted RED specifies exactly one private helper, the full frozen and
detached configuration projection, `REG_S / NONE` values `1`/`0`, and the
canonical JCS/Keccak hash
`eae8bbe6d5ff6a5d8b1024abb378753ac7aadfb856db19edc22d93b171164a8f`.
It rejects public export, ATS SDK/package use, M33/M32/Convex interaction,
provider/wallet/environment/clock/storage/network capabilities, and all
external behavior.

This review authorizes only the declared private helper source and focused
GREEN verification. It authorizes no SDK initialization, request construction,
provider/wallet interaction, authority provisioning, M33 enablement, M32
mutation, storage, account action, funding, payment, transaction, asset,
deployment, or live evidence.
