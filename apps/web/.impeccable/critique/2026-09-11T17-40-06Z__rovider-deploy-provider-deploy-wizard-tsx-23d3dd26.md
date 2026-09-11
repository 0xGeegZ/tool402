---
target: /provider/deploy step 5 Review and sign
total_score: 26
max_score: 40
na_heuristics: 
p0_count: 2
p1_count: 2
target_identity: "file:/Users/yannick/git/myProjects/hackathons/tool402/apps/web/src/components/provider/deploy/provider-deploy-wizard.tsx"
target_fingerprint: "sha256:c294128c4a8b836b7cd11a3685cd88ef4cfdf3d95702381af936bf58a9a5e7f4"
target_path: /Users/yannick/git/myProjects/hackathons/tool402/apps/web/src/components/provider/deploy/provider-deploy-wizard.tsx
timestamp: 2026-09-11T17-40-06Z
slug: rovider-deploy-provider-deploy-wizard-tsx-23d3dd26
---
Method: dual-agent (A: design review, opus; B: detector + browser evidence, sonnet)

Target: /provider/deploy, Step 5 of 5 "Review and sign" (apps/web/src/components/provider/deploy/provider-deploy-wizard.tsx, deploy-stage-signing.tsx, provider-deploy-stages.tsx, ats-create-action.tsx)

## Design Health Score

| # | Heuristic | Score | Key issue |
|---|---|---|---|
| 1 | Visibility of system status | 3 | Stepper and stage badges are good; no single line says nothing is actionable until the wallet connects. |
| 2 | Match system / real world | 3 | "Signature handoff unavailable", "external.prepare · ATS_CREATE", "relayed ACCEPTED is a backend admission" are system-model language on a judge-facing surface. |
| 3 | User control and freedom | 3 | Stepper back-navigation works; Back is a low-contrast ghost button in the far corner. |
| 4 | Consistency and standards | 2 | Three titles for one task; stage cards print the same sentence twice verbatim. |
| 5 | Error prevention | 4 | Nothing can fire by accident. |
| 6 | Recognition over recall | 2 | The review card shows 5 of about 11 captured fields; terms, funding and risks live two steps back. |
| 7 | Flexibility / efficiency | 2 | No edit link from review rows; no single primary action once connected. |
| 8 | Aesthetic / minimalist | 1 | 32 paragraphs, 1819 characters, 11 headings, 7 buttons (5 disabled) in one card; the flow strip repeats the four stage cards. |
| 9 | Error recovery | 3 | Outcome vocabulary is honest; "The server gave no reason" offers no next step. |
| 10 | Help and documentation | 3 | "What signing does" panel is excellent but goes hidden the moment the wallet connects. |
| Total | | 26/40 | Acceptable |

All ten heuristics scored; applicable maximum 40; no n/a.

## Design Specificity Verdict

LLM assessment: authored above the fold, generic below. Cream ground, hairlines, mono identifiers and the hedged voice are unmistakably the Toy Ledger. Below the review card the step collapses into four stacked status cards, each with a disabled button, which any deploy dashboard could show. The voice degrades into repetition.

Deterministic scan: the static scan of apps/web/src/components/provider/deploy is clean (0 findings). The live in-page scan reported 23 findings: nested-cards x12 (real: dl and section.rounded-field inside the review card, four div.rounded-field bg-card inside stage cards, three section.rounded-control bg-card), cramped-padding x6 (header nav pills, outside step scope), tiny-text x4 (false positive: DESIGN.md pins the 11px micro role), cream-palette x1 (false positive: Ledger Cream is the pinned ground).

Browser measurements on step 5: Signature Indigo fill on three elements (nav "Prepare a tool", progress bar, "Connect MetaMask"); once connected there is no indigo action in the step. Five aria-live="polite" regions, two pairs with duplicated text. 30 focusable elements, all named. No contrast failures. No horizontal overflow at desktop width. The 500px resize did not take effect in the Chrome tool, so mobile was not measured mechanically.

## Overall Impression

A calm review card followed by a disclaimer wall. The last step ends on four Blocked cards, an exit link and "Nothing was recorded." There is no completion moment. The biggest opportunity is to collapse everything that is not actionable, give the step one indigo action, and show every captured field.

## What's Working

- The review definition list: muted labels, ink values, mono where needed.
- The "What signing does" panel: two sentences answering the only first-timer question.
- The stage status vocabulary (Needs signature, Awaiting signature, Replayed, Conflict, Outcome unknown) honours the Tone Has a Word rule.

## Priority Issues

- [P0] No primary action after the wallet connects. The only indigo fill in the step is "Connect MetaMask"; after connecting, stage controls are outline variants when disabled and the handoff panel sits below four cards. Fix: render only the actionable stage card in full and collapse the rest to one-line rows; promote provider-signature-handoff to a sticky footer bar holding the single indigo button; demote Back to a text link. Command: /impeccable layout
- [P0] The review shows 5 of about 11 fields. Pricing rationale, target customers, use of funds, risks and the Terms v1 block vanish at the attestation moment; two identical price rows fill 40% of the card. Fix: three collapsed details groups (Interface, Pricing and customers, Funding terms), each with an "Edit step N" link calling returnToStep. Command: /impeccable harden
- [P1] Four titles for one step: H1, CardTitle "Review and sign", CardDescription "Complete the prepared fields for this step" (false on step 5), "Review / Check the prepared details", "Session-only signing / Sign the deployment stages", "Local workflow / Deployment stages"; 11 headings measured. Fix: delete the ReviewStep eyebrow and H2, let the CardTitle carry the step, make the CardDescription step-aware. Command: /impeccable distill
- [P1] Duplicated sentence in every stage card: stageStatusDescription renders as CardDescription and again as the detail paragraph, plus two aria-live regions per card. Fix: render the detail paragraph only when stage.detail exists. Command: /impeccable clarify
- [P2] The last-step footer is an exit: flex-col-reverse puts the full-width "Back to the provider workspace" above the ghost Back on mobile. Fix: move the exit link to the page header as a text link; the footer holds Back and the signing primary. Command: /impeccable layout

## Persona Red Flags

- Jordan (first-timer judge): four disabled buttons, "Signature handoff unavailable" twice, and the three-negation sentence read as "broken"; Stage 1 is permanently unavailable with no explanation that this is expected.
- Sam (keyboard and screen reader): the flow strip duplicates the cards without aria-hidden; stepper buttons are disabled but styled opacity-100; five polite live regions with duplicated pairs.
- Casey (phone): the min-w-[680px] strip scrolls horizontally inside the page; the Stage 2 hash wraps to two mono lines; the signing action is about eight screens below the review.
- ETHOnline judge with four minutes: sees five fields, four Blocked cards, no completion state and no "what happens if I sign" line.

## Minor Observations

- Step 2 hint "Name the local resource" collides with the next label "Capability summary".
- "Stage 1 of 4" inside "Step 5 of 5" puts two numbering systems on one screen.
- "STAGE B · HUMAN" in the strip versus "Stage B · human" in the badge.
- "Session-only status" badge and "Deployment stages" H2 are baseline-misaligned.
- The step 4 Continue is gated on a checkbox whose visible label text was not captured mechanically; verify the label association.
- The validation aria-live slot can never fire on step 5.

## Questions to Consider

- Every stage is blocked and the first is permanently unavailable. Is this a wizard step or a read-only receipt that should say so in its title?
- Four "what signing does not do" sentences precede any action. What does the judge lose if they become "Connect MetaMask to sign stage 1"?
- The Toy Ledger says status always has a tone word. Why is the outcome of the whole wizard the one thing with no state, no tone and no completion?
