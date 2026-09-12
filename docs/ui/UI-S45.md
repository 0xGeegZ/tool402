# UI-S45 brand mascot surfaces manifest

## Intent

Make the accepted Tool402 character family recur at five high-value moments:
orientation, provider acquisition, final review, signed-dashboard empty state,
and meaningful route wait.

## Fixed regions

1. `/demo`: one decorative guide trio beside the existing page introduction.
2. `/explore`: one provider CTA after the complete current catalogue grid,
   with one local `/provider/deploy` control.
3. `/provider/deploy`: one decorative review trio rendered only by the final
   `ReviewStep`.
4. `/dashboard`: one decorative seated mascot inside the existing empty card.
5. Loading: one shared compact mascot cue, visually revealed after 300 ms,
   mounted before each non-Dashboard route-specific skeleton sequence and used
   by the root fallback. `/dashboard` intentionally has no cue and keeps a
   full-width skeleton.

## Visual contract

All five images are repository-owned transparent PNGs derived from the
existing Tool402 clay-character identity. Only the exact Tool402 brand lockup
is rasterized on the two existing document props; no state or action claim is
rasterized. The canvas, typography, buttons, borders, copy, and dynamic values
remain HTML/CSS.

## Interaction and truth boundary

The Explore CTA is the only new control and targets the existing local deploy
route. The demo, deploy, and dashboard-empty images are decorative. The loader
timer controls visual reveal only and cannot start work, retain state, retry,
fetch, or report completion. Existing wallet, campaign, catalogue, and
loading-skeleton contracts remain authoritative.

## Breakpoints

Demo and Explore pair copy with art on large screens and stack on narrow
screens. Deploy art stays inside the final review card. Dashboard empty art
stays compact above its existing copy. Loading art remains a compact inline
card and never becomes a full-screen splash.
