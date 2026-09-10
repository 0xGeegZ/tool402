# M48-T010 independent RED review

## Scope

Independent review of delegated test-only commit
`3eaa2ce58cee6cf2e5cc6987e6563bb0970b3b4b`, based on clean canonical
`5407fc397832fd8fd3510b41fbf503d6d600425f` and integrated unchanged as
`7106d01`. The diff changes exactly these authorized RED paths:

- `packages/backend/tests/ats-prepare-authority.test.mjs`
- `packages/backend/tests/external-prepare-command-durable-admission.test.mjs`

No source, queue/control-plane, package, configuration, authority row, SDK,
provider, wallet, request, transaction, candidate, or live boundary changed.
`git diff --check` is clear.

## Verified contract

- The direct production M33 gate must admit only the exact M42/M47 real-issuer
  `ATS_CREATE` tuple and accepted digest
  `1880065c5ae64b3fc6279cfdd8c85a6880d43e98ce129ed697c72372204296f9`.
- Every other ATS kind and network, chain, subject, target, or digest drift
  rejects; the existing generic M32 ATS rejection remains intact.
- The atomic M47 path reaches only its replay lookup for the exact bound tuple,
  and all payload/authority-context drift stops before replay or durable work.
- The M33 capability guard rejects named/default, side-effect, dynamic, and
  CommonJS SDK imports while allowing the required inert SDK package identity
  inside the canonical descriptor.

## Focused RED result

Under Node 22.21.1:

```text
35 assertions: 33 pass, 2 intended failures
```

Both failures are `TypeError: invalid ATS prepare authority` at the current
production `assertCurrentAtsPrepareAuthority` boundary. They arise only because
the compiled `currentManifest` is still empty: one direct M33 acceptance and
one exact M47 atomic progression test. No harness, ordering, drift, generic
admission, external-access, or unrelated failure occurred.

## Verdict

**CLEAR — authorize GREEN only for the following six paths:**

- `packages/backend/convex/ats_prepare_authority.ts`
- `packages/backend/tests/ats-prepare-authority.test.mjs`
- `packages/backend/tests/external-prepare-command-durable-admission.test.mjs`
- `packages/backend/tests/stage-b-issuer-ats-create-authority.test.mjs`
- `packages/backend/tests/stage-a-real-issuer-ats-create-authority.test.mjs`
- `packages/backend/tests/ats-receipt-verification.test.mjs`

The source change is one private deeply frozen literal, not an M42 import. The
three historical-test amendments may retire only their stale empty-manifest
assertions; M43 must retain `NOT_CONFIGURED` before Mirror I/O or a durable
outcome write. M37/M42/M43 source, M42 preimage/digest, M32/M47 ordering,
packages, configuration, authority provisioning, and every SDK/provider/wallet/
network/request/transaction/candidate/live action remain prohibited.
