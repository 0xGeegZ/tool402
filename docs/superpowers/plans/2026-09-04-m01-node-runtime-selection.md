# M01 Node Runtime Selection Implementation Plan

> **Implementation note:** Execute this plan as M01-T011. Work in the existing checkout; the local workspace policy does not authorize a separate worktree.

## Goal

Make the accepted Node 22/npm 10 root toolchain directly selectable by local developers and automation without changing application, package, dependency, or product scope.

## Boundaries

- Own only `.nvmrc`, the root README setup text, and root-integrator queue records.
- Leave `package.json`, validator code/tests, dependencies, and all product paths unchanged.
- Use the installed Node `v22.21.1`; do not download or install a runtime.

## Steps

1. Capture the RED condition: no root `.nvmrc` exists and the default shell may report a different Node release.
2. Add `.nvmrc` with exactly `v22.21.1` and one newline; add the concise `nvm use` instruction to the root README.
3. Source the local nvm installation, run `nvm use`, and assert Node `v22.21.1` plus npm `10.9.4`.
4. Run `npm run queue:check`, the root quality commands, whitespace checks, and the local reference guard with the selected runtime.
5. Obtain an independent task review, then let the root move the accepted card to `60-done`.
