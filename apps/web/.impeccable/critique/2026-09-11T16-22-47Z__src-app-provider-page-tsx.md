---
target: "http://localhost:3001/provider"
total_score: 21
max_score: 40
na_heuristics: 
p0_count: 2
p1_count: 2
target_identity: "file:/Users/yannick/git/myProjects/hackathons/tool402/apps/web/src/app/provider/page.tsx"
target_fingerprint: "sha256:931dbfccc235e5925a0ab122a1e322aed420891534c1c0fc50483b844d2340dd"
target_path: /Users/yannick/git/myProjects/hackathons/tool402/apps/web/src/app/provider/page.tsx
timestamp: 2026-09-11T16-22-47Z
slug: src-app-provider-page-tsx
---
Method: dual-agent (A: opus design review · B: sonnet detector + browser)

## Design Health Score

| # | Heuristic | Score | Key Issue |
|---|-----------|-------|-----------|
| 1 | Visibility of System Status | 3 | Ribbon, grid and six regions restate one null status; not_configured / absent / unavailable render identically. |
| 2 | Match System / Real World | 2 | Loaded terms print raw tinybars and bps with no units; two values share one dd separated by a dot. |
| 3 | User Control and Freedom | 3 | Read-only page; three identical "Prepare an offering" links give no sense of destination. |
| 4 | Consistency and Standards | 2 | Eight h2 at two sizes; StatusSummary wrapper is text-lg but Outcome child is text-sm muted, so tiles differ in weight. |
| 5 | Error Prevention | 3 | Empty state asserts "Provider action: Open the local wizard" as if it were a record. |
| 6 | Recognition Rather Than Recall | 2 | Paired values with dot separators force the reader to remember which number is which. |
| 7 | Flexibility and Efficiency | 2 | No copy affordance for id, signer, endpoint; only one Hashscan link. |
| 8 | Aesthetic and Minimalist Design | 1 | Eight regions, three duplicate CTAs, six repeats of "No admitted record exists yet." |
| 9 | Error Recovery | 1 | Backend failure sentences are muted body text, no status role, no retry hint. |
| 10 | Help and Documentation | 2 | No link to /docs/providers although admitted, signed command, directory version go undefined. |
| **Total** | | **21/40** | **Needs work** |

## Design Specificity Verdict

LLM assessment: the vocabulary is authored for Tool402 (admitted record, signed command, terms version, "a preview is not a public offer") and the evidence table with "not recorded" cells is a real truth-over-polish artifact. The composition is template SaaS furniture: hero header with two buttons, pill ribbon, accent next-action panel, 3-up stat grid, feature card, table, three cards. Specificity lives in the strings, not the layout. The empty state inverts the product principle by stating one fact eight times in eight chrome shapes.

Deterministic scan: CLI detect exit 0, zero findings on page.tsx, provider-status.tsx, page-header.tsx. Browser overlay (port 8400, injected, stopped) reported 3 anti-patterns: tiny-text x2 (the 11px site-wide banners in the root layout, outside this route's source), kicker-above-heading x2 ("Current scope" above "Current provider state"; "Local RiskScan offering path" above "RiskScan"), cream-palette x1 (page background, a committed DESIGN.md token, not a finding for this route).

Browser measurements at the only viewport the harness allowed (500 x 635): 3 "Prepare an offering" links, 6 "No admitted record exists yet." text nodes, 8 h2, 11 section landmarks inside main, three 128px state tiles each with 51 to 59px of empty space under the text, 2px horizontal overflow (source unverified, likely site-wide), page height 3104px. Focus-visible check via programmatic focus reported no outline, but the source carries focus-visible:outline classes on every link, so that reading is a measurement artifact of scripted focus and is treated as a false positive. A 375px viewport could not be produced; mobile behaviour is unverified.

## Overall Impression

Honest copy carried by a generic dashboard skeleton. The page a judge actually sees is the empty state, and it is designed as a degraded loaded state rather than as its own composition. The single biggest opportunity is to collapse ribbon, next-action panel, state grid and RiskScan card into one status block with one CTA, and to render the four data regions only when a record exists.

## What's Working

- The evidence table's "not recorded" cells and the Hashscan link gated to READY/OPEN/CLOSED show the mechanism without hype.
- Copy discipline: "A preview is not a public offer", "These labels reflect the current local projection only", "A material change needs a separately signed offering and directory version."
- Accessibility basics are present in source: focus-visible outlines, min-h-10 targets, overflow-x-auto on the table, motion-reduce.

## Priority Issues

- [P0] Empty state repeats "No admitted record exists yet." six times plus two paraphrases across eight regions. A judge's first impression is a page with nothing to evaluate, said eight ways. Fix: one status block plus one empty panel that lists the four region names dimmed with a single shared sentence; render the data regions only when loaded. Blocked by provider-visual-reconciliation pins (exactly 3 Card, four headings, state-grid data-ui, md:grid-cols-3, riskscan card data-ui). Suggested command: /impeccable distill.
- [P0] Three identical "Prepare an offering" buttons within one screen, four counting the nav's "Prepare a tool". Destroys hierarchy and reads as a funnel, not an operator record. Fix: keep the one in the status block; RiskScan card drops its button; header keeps "Explore RiskScan" as a secondary link. Blocked by page-header test pinning two actions incl. /provider/deploy and the visual test pinning a /provider/deploy href inside the RiskScan card. Suggested command: /impeccable distill.
- [P1] Loaded terms print raw tinybars and bps, two values per cell. The money story is the submission's core claim and is unreadable. Fix: one dt/dd per value, formatted with units, split "Unit price" from "Maximum units" and the three share values. No pin blocks this. Suggested command: /impeccable clarify.
- [P1] Backend failure outcomes (unavailable, unexpected_response) look identical to "absent". A judge cannot tell "nothing configured" from "backend down". Fix: warning tokens, role="status", a reload hint. Sentences are pinned verbatim; wrapper and styling are free. Suggested command: /impeccable harden.
- [P2] StatusSummary value styling is dead (text-lg wrapper, text-sm muted child) and the empty state fabricates "Provider action: Open the local wizard". Fix: render the outcome at tile weight; show a dash for provider action when no offering exists. Only the "Provider action" label is pinned. Suggested command: /impeccable polish.

## Persona Red Flags

- Hackathon judge, first visit: scrolls a full page of "no record" and cannot tell whether the provider role is unimplemented or unconfigured; nothing shows what populated looks like.
- Provider operator, power user: offering id, signer address and x402 endpoint are un-copyable and buried below five regions of preamble.
- Screen-reader user: hears the same sentence six times, three of them without a region name because the Card h2 is not wired via aria-labelledby; the evidence table has no caption; the sr-only "State ribbon" heading is noise.

## Minor Observations

- Two kickers sit above h2s ("Current scope", "Local RiskScan offering path"); "Current scope / Current provider state" is two labels for one idea.
- The Suspense fallback "Loading admitted records." is unstyled and has no aria-live.
- Header description "without advancing either one" names "either one" before the two records are introduced.
- Evidence table min-w-[42rem] will scroll horizontally on mobile inside a padded card; page-level overflow at 375px unverified.
- Three state tiles are fixed at 128px with roughly half the tile empty.

## Questions to Consider

- If the empty state is what a judge sees, why is it not the primary composition?
- What does the ribbon tell a reader that the state grid does not, and which of the two should survive?
- Does printing tinybars unformatted serve truth over polish, or hide the truth behind an encoding the reader cannot decode?
