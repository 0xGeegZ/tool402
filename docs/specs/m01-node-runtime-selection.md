# M01 Node Runtime Selection Foundation Specification

## Status and authority

This is the minimum local foundation specification for M01-T011. It governs only deterministic local Node runtime selection for the accepted root workspace. It does not authorize product behavior, dependency changes, external integration, accounts, funding, wallets, payments, testnet activity, deployments, or submission.

M01-T010 is accepted. M01-T090 remains the separate queue-validation gate before broader M01 scaffold lanes may begin.

## Outcome

The repository contains a versioned `.nvmrc` file whose sole content is `v22.21.1` followed by a newline. The root README tells a contributor to run `nvm use` before npm commands. Together, those records select the installed Node 22 release that supplies npm 10.9.4 and prevent a default Node 20 shell from being mistaken for the project toolchain.

## Boundary

This task may create `.nvmrc` and amend the root README setup instruction. It may update its local queue/control records.

It must not change `package.json`, `package-lock.json`, `.npmrc`, validator implementation or tests, application/package directories, dependencies, build tooling, product behavior, or live/runtime integrations. The accepted package engine ranges remain the broader compatibility boundary; `.nvmrc` is the exact local selection mechanism.

## Smoke and validation contract

Before the selector exists, a root `.nvmrc` lookup is absent. After the constrained change:

1. `.nvmrc` contains exactly `v22.21.1` and one terminating newline.
2. `nvm use` selects Node `v22.21.1` without downloading or installing anything.
3. The selected runtime reports npm `10.9.4`.
4. `npm run queue:check` and all root quality commands pass under that selected runtime.
5. Whitespace and the local reference guard pass before commit.

## Failure semantics

An absent, malformed, or drifting selector is an M01-T011 failure. It must be corrected through the local RED/GREEN and independent-review sequence. A selected runtime proves only local toolchain consistency; it does not prove runtime, deployment, eligibility, payment, or submission behavior.
