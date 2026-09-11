---
target: /provider/deploy step 5 Review and sign (re-run)
total_score: 26
max_score: 40
na_heuristics: 
p0_count: 1
p1_count: 2
target_identity: "file:/Users/yannick/git/myProjects/hackathons/tool402/apps/web/src/components/provider/deploy/provider-deploy-wizard.tsx"
target_fingerprint: "sha256:8b3012f2705a9278a6323f548286315c6be83ec865680db4e6fc91e794702ead"
target_path: /Users/yannick/git/myProjects/hackathons/tool402/apps/web/src/components/provider/deploy/provider-deploy-wizard.tsx
timestamp: 2026-09-11T18-05-52Z
slug: rovider-deploy-provider-deploy-wizard-tsx-965e7d5e
---
Method: dual-agent (A: design review, opus; B: detector + browser evidence, sonnet). Re-run after PR #80 commit cd7586c; the fixes noted at the end landed in commit 5ed6dc4 after this run.

Target: /provider/deploy, Step 5 of 5 "Review and sign"

## Design Health Score

| # | Heuristic | Score | Key issue |
|---|---|---|---|
| 1 | Visibility of status | 3 | The stepper fills 5/5 while the Status row reads 0 of 4 stages done. |
| 2 | Match to real world | 2 | offering.create, "Stage B · human", "relay reports acceptance" are unglossed. |
| 3 | User control and freedom | 3 | Edit step N per group is good; Continue did not move focus or scroll (fixed in 5ed6dc4). |
| 4 | Consistency and standards | 3 | Two disclosure idioms in one wizard; ghost Back next to an underlined text link. |
| 5 | Error prevention | 3 | "Nothing is recorded" stated three times; blocked stages carry a one-line reason only. |
| 6 | Recognition over recall | 2 | Review groups collapsed by default, showing 4 of about 20 values (fixed in 5ed6dc4). |
| 7 | Flexibility and efficiency | 2 | No expand-all, export, or shortcuts. |
| 8 | Aesthetic and minimalist | 3 | Three near-duplicate reassurance blocks remain (page header, stages intro, "What signing does"). |
| 9 | Error recovery | 3 | Stage descriptions are exact but carry no recovery control. |
| 10 | Help and documentation | 2 | No link to /docs/providers; "Stage B · human" never explained. |
| Total | | 26/40 | Acceptable |

All ten heuristics scored; applicable maximum 40.

## Design Specificity Verdict

Unmistakably the Toy Ledger in material (cream, navy, one indigo action, mono identifiers, tone badges), but the step's composition is a generic review-and-sign stack: specific by inheritance, not by arrangement.

Deterministic scan: the static scan of apps/web/src/components/provider/deploy is clean. The runtime scan reports 11 findings, down from 23: nested-cards x4 (the focused stage card and the two wallet-context cards inside the wizard card), line-length x2 (a long review value and the declined-signature note, both capped at max-w-prose in 5ed6dc4), tiny-text x4 (false positive: the pinned 11px micro role), cream-palette x1 (false positive: the pinned Ledger Cream ground).

Browser measurements: 9 paragraphs, 809 characters, 6 headings, 4 details groups, one indigo action pre-connect (Connect MetaMask), no contrast below 4.5:1 (worst 5.16), 31 focusables all named, no horizontal overflow, no signature handoff pre-connect.

## Priority Issues

- [P0] Review groups collapsed by default, so "Review and sign" showed four values. Fixed in 5ed6dc4: all groups render open with Hide available.
- [P1] Filled 5/5 progress segment against 0 of 4 stages signed. Open: the wizard cannot read stage results (pinned), so the caption stays "Step 5 of 5"; the current-step segment follows the stepper convention.
- [P1] No scroll or focus move on step change. Fixed in 5ed6dc4: the step title takes focus on step change, scrolled clear of the sticky header.
- [P2] Stage vocabulary unexplained and no docs link. Open: the signing island may not contain links (pinned); a gloss belongs in a later copy pass.
- [P2] Summary lost its disclosure role under display:flex. Fixed in 5ed6dc4: summary keeps list-item display with the flex layout on an inner span.

## Persona Red Flags

- Jordan: "Signature handoff unavailable" as a button label reads as an error; Blocked and Stage B rows against a full progress bar can read as broken.
- Sam: disclosure state now announced; the terminal affordance is an underlined text link rather than a button.
- Judge with four minutes: nothing on the step says what is achievable without a wallet.

## Minor Observations

- The header CTA "Prepare a tool" links to the page the visitor is already on.
- Step 5 has no forward control, only Back and the exit link.
- The step 4 "Revenue note context" disclosure is richer than the step 5 groups.

## Questions to Consider

- If three of four stages cannot complete in a judge's session, should the step be shaped as one signable stage with three documented successors?
- At what point does honesty about what the product does not do read as a product that does not work?
