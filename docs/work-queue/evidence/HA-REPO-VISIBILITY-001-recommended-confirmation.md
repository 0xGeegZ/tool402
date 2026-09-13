# HA-REPO-VISIBILITY-001 — Recommended confirmation packet

## Status and scope

**RECOMMENDED, NOT ACCEPTED.** This is a human-prepared draft packet for the
pending `HA-REPO-VISIBILITY-001` row. It becomes evidence only when the human
operator completes the fill-in block at the end at the commit actually put
forward for judging, and the root records that completion. Nothing here
authorizes a deployment, payment, account, transaction, ATS, publication, or
submission action, and no agent may complete it on the human's behalf.

The pending row asks for two things, because the repository is already public
and no visibility change is required: a recorded human confirmation that the
submitted commit carries no credential, key, funded account value, or private
evidence in any tracked file, and the result of a secret scan over tracked
files at that commit. This packet runs that scan ahead of time at the current
`main` head so the human's remaining work at the submitted commit is a re-run
and a signature rather than an investigation.

- Prepared: 2026-09-12, by the human operator's delegated session, under
  [the HI-013 intake card](../queue/60-done/HI-013-delivered-lane-records.md).
- Scanned commit: `ce080a16`, the `main` head at preparation time. This is
  **not** the submitted commit; the human re-runs the same commands at that
  commit and records the result below.
- Decision owner: the human operator. The root records the local queue state
  only.

## Secret scan at `ce080a16`

Every scan is `git grep` over tracked files at that exact commit. Results are
recorded as pattern, hit count, and `file:line` with a disposition. **No
matched text is reproduced here, in whole or in part, and none was copied into
any tracked file.** Where a hit is a hex literal, only its role is named.

### Scan 1 — credential and token formats

Pattern: `PRIVATE KEY`, AWS access-key-id form, Stripe live/test secret-key
form, GitHub personal-token form, Slack token form, and JWT form, over all
tracked paths except `package-lock.json`.

Command:

```
git grep -nIE 'PRIVATE KEY|AKIA[0-9A-Z]{16}|sk_(live|test)_[0-9a-zA-Z]{24,}|gh[pousr]_[A-Za-z0-9]{36,}|xox[baprs]-[0-9A-Za-z-]+|eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+' <commit> -- ':(exclude)package-lock.json'
```

**0 hits.** Nothing to dispose of.

### Scan 2 — assigned secret-style environment names

Pattern: `SECRET`, `PRIVATE_KEY`, `SIGNING_KEY`, `MNEMONIC`, or `SEED_PHRASE`
immediately followed by `=` and a non-placeholder, non-whitespace character,
over all tracked paths.

Command:

```
git grep -nIE '(SECRET|PRIVATE_KEY|SIGNING_KEY|MNEMONIC|SEED_PHRASE)=[^[:space:]]' <commit>
```

**0 hits.** Every occurrence of these names in tracked files is a name only:
documentation, an example template with an empty or placeholder value, or
prose. No tracked file assigns a value to one.

### Scan 3 — bare 64-character lowercase hex runs

Pattern: a word-bounded 64-character lowercase hex run, over all tracked paths
except `package-lock.json` and lock files.

Command:

```
git grep -nIE '\b[0-9a-f]{64}\b' <commit> -- ':(exclude)package-lock.json' ':(exclude)*.lock'
```

**3 hits**, all in backend test fixtures:

- `packages/backend/tests/authenticated-external-prepare-normalizer.test.mjs:17`
- `packages/backend/tests/authenticated-wallet-command-normalizer.test.mjs:40`
- `packages/backend/tests/external-prepare-command-admission.test.mjs:17`

Disposition: **retained, not secret.** Each hit is a fixed test-fixture ECDSA
signature literal over a synthetic authenticated-command payload, sitting
beside its matching fixture signer address and payload hash in the same file.
A signature is a public artifact of a signing operation; none of these files
contains a private key, and the three literals are inputs to the
normalizer/admission contracts rather than credentials for any account.

Two limits of this scan that a human confirming "no key material" needs:

- The expected disposition this packet was drafted against — zero-valued
  `configId` literals and the secp256k1 curve order in
  `apps/web/src/lib/wallet/tool402-command.ts` — is **not** what the scan
  returned. That file does declare a curve-order constant at
  `apps/web/src/lib/wallet/tool402-command.ts:86`, with the literal itself on
  the next line, `:87`, but the scan's word-bounded form does not match it.
  The expectation was confirmed against the repository
  rather than copied, and the actual result above is what is recorded.
- The word-bounded form also does not reach `0x`-prefixed literals, because
  `0x` leaves no word boundary before the hex run. Re-derived without that
  boundary, `packages/backend/tests` holds 25 lines across nine files carrying
  such `0x`-prefixed 64-hex literals, which are fixture signer addresses and
  payload hashes of the same synthetic commands. They are listed here as a
  known scan blind spot, not as findings; the human should say plainly that
  the confirmation rests on the four commands as written.

### Scan 4 — seed phrase and mnemonic wording

Pattern: `seed phrase` or `mnemonic`, case-insensitive, over all tracked paths.

Command:

```
git grep -nIiE 'seed phrase|mnemonic' <commit>
```

**2 hits**, both in human-action evidence documents:

- `docs/work-queue/evidence/HA-ATS-LIVE-AUTHORITY-001-recommended-decision.md:67`
- `docs/work-queue/evidence/HA-COMMAND-AUTHORITY-001-template.md:13`

Disposition: **retained, not secret.** Both are policy sentences that forbid
placing this material in the repository. Neither contains a phrase, a word
list, or any value.

### Ignore status of local environment files

`git check-ignore` reports `.env.local` and `apps/web/.env.local` as ignored.
Each path must be checked in its own invocation: the compound form exits with
`fatal: --quiet is only valid with a single pathname` and confirms nothing.
Both were verified individually.

## README coverage at `ce080a16`

The track requires a public repository whose README covers setup,
architecture, and payment flow. The section headings are:

| Heading | Line |
| --- | --- |
| Judge summary | 16 |
| Architecture | 41 |
| Security and authority model | 87 |
| Run locally | 102 |
| Expected demo journey | 148 |
| Repository structure | 169 |
| Current limitations | 181 |

Against the six subjects the pending row and this packet care about:

- **Setup** — covered by "Run locally".
- **Architecture** — covered by "Architecture", with the component split
  restated in "Repository structure".
- **Payment flow** — covered. "Judge summary" states the end-to-end flow from
  discovery through the `402` challenge, the spend-policy check, the payment
  proof back to the tool service, and facilitator verification before a
  bounded result; "Architecture" restates it per component.
- **Security model** — covered by "Security and authority model", which states
  in its own words that runtime secrets, private keys, signed payment headers,
  and funded-account values are absent from the repository.
- **Runtime variable names** — covered by the table inside "Run locally",
  which names the RiskScan and EntityCheck x402 variables and the provider
  command-relay variables. It names variables only; it assigns no value.
- **Demo journey** — covered by "Expected demo journey", which instructs
  against inventing or simulating a payment result.

No README change is requested by this packet. The pending row already records
that a README rewrite would be ordinary card work, not a human-only action.

## What this packet does not do

It does not make the repository public, mark `HA-REPO-VISIBILITY-001`
complete, or stand in for the human confirmation. It records no secret,
credential, key, funded-account value, signed payload, or private evidence,
and the scan results above deliberately carry counts, paths, and line numbers
only. It authorizes no deployment, payment, account, transaction, ATS,
publication, or submission action, and it does not unblock
`HA-SUBMISSION-001`, which depends on this row and two others.

## Human fill-in block

The human operator completes this block at the commit actually submitted, then
the root records the completion.

- Submitted commit: `__________________________________________`
- Date and time (UTC): `__________________________________________`
- Human name or handle: `__________________________________________`
- Scan re-run result at the submitted commit — scan 1 hits:
  `__________`; scan 2 hits: `__________`; scan 3 hits: `__________`;
  scan 4 hits: `__________`. Record any hit as `file:line` with a disposition,
  and never as its matched text.
- `git check-ignore` at the submitted commit, each path checked on its own —
  `.env.local`: `__________`; `apps/web/.env.local`: `__________`.
- README headings unchanged from the table above, or the difference:
  `__________________________________________`

Confirmation sentence, to be signed as written or amended to match what was
actually found:

> I confirm that the commit named above is the commit put forward for judging,
> that I re-ran the four scans and the ignore checks recorded in this packet at
> that commit, that every hit is accounted for above with a disposition, and
> that no tracked file at that commit carries a credential, key, funded account
> value, signed payload, or private evidence. I confirm the README at that
> commit covers setup, architecture, and the payment flow. I copied no secret
> material into this repository as evidence.
