# UI-S45 brand mascot surfaces manifest

## Intent

Make the accepted Tool402 character family recur at four high-value moments:
orientation, provider acquisition, final review, and meaningful route wait.

## Fixed regions

1. `/demo`: one decorative guide trio beside the existing page introduction.
2. `/explore`: one provider CTA after the complete current catalogue grid,
   with one local `/provider/deploy` control.
3. `/provider/deploy`: one decorative review trio rendered only by the final
   `ReviewStep`.
4. Loading: one shared compact mascot cue, visually revealed after 300 ms,
   mounted before each unchanged route-specific skeleton sequence and used by
   the root fallback.

## Visual contract

All four images are repository-owned transparent PNGs derived from the
existing Tool402 clay-character identity. No text or state is rasterized. The
canvas, typography, buttons, borders, copy, and dynamic values remain HTML/CSS.

## Interaction and truth boundary

The Explore CTA is the only new control and targets the existing local deploy
route. The demo and deploy images are decorative. The loader timer controls
visual reveal only and cannot start work, retain state, retry, fetch, or report
completion. Existing wallet, campaign, catalogue, and loading-skeleton
contracts remain authoritative.

## Breakpoints

Demo and Explore pair copy with art on large screens and stack on narrow
screens. Deploy art stays inside the final review card. Loading art remains a
compact inline card and never becomes a full-screen splash.
