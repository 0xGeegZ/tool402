# UI-S13 outcome feedback tokens and status treatment manifest

## Delivery boundary

The accepted interactive surfaces already distinguish their outcomes in words.
None distinguishes them visually: a refusal, a payment challenge, and a
completed boundary are the same unstyled or muted paragraph, and the local
stylesheet holds no token that could separate them.

UI-S13 adds the missing feedback tokens, one shared status treatment, and one
shared empty/error panel shape, then routes the existing outcome messages
through them. It changes how already-computed local state is presented. It
computes no new state and adds no outcome.

The source material for this adaptation remains outside the repository. This
manifest records the local target boundary only; it stores no source
identifier, URL, checksum, or clone information.

## Selected tokens

Six values join the accepted warm-surface palette, in the existing `:root`
block, with their `--color-*` mappings in the existing `@theme inline` block.
Each feedback tone is a light surface carrying a dark foreground, matching the
accepted palette's existing light scheme:

| Token | Value | Measured against | Ratio |
| --- | --- | --- | --- |
| `--destructive` | `#fdeae4` | surface | — |
| `--destructive-foreground` | `#b03a1d` | on `--destructive` | 5.21:1 |
| `--success` | `#e6f4ec` | surface | — |
| `--success-foreground` | `#1c7a4d` | on `--success` | 4.70:1 |
| `--warning` | `#fdf1d8` | surface | — |
| `--warning-foreground` | `#a05a12` | on `--warning` | 4.73:1 |

Every pair meets WCAG AA for body text at its intended foreground-on-surface
use. The measured ratios above are the contract, not an aspiration; the
implementation must reproduce them.

The source material's solid coral `#e35a3d` is deliberately not adopted as a
text pair: white on it measures 3.62:1 and fails AA. It may be used only as a
non-text border or accent, where it measures 3.36:1 against the page surface
and meets the 3:1 non-text bar.

The local stylesheet declares no dark colour scheme, so no dark values are
selected. Chart, sidebar, popover, and input tokens are not selected: no
accepted surface renders a chart, a sidebar, a popover, or a styled input
needing them.

## Local targets

The slice may amend `apps/web/src/app/globals.css` to add the six tokens and
their mappings, and may add:

- `apps/web/src/components/ui/status.tsx` — the status treatment
- `apps/web/src/components/ui/state-panel.tsx` — the empty and error panel shape
- one focused test for each

It may amend the outcome-rendering lines of exactly these five accepted
components, and no others:

- `apps/web/src/components/riskscan/request/riskscan-request-flow.tsx`
- `apps/web/src/components/riskscan/tool-loop/riskscan-tool-loop.tsx`
- `apps/web/src/components/riskscan/native-quote/riskscan-native-quote-compatibility.tsx`
- `apps/web/src/components/riskscan/preflight/riskscan-quick-preflight.tsx`
- `apps/web/src/components/discovery/riskscan-directory-discovery.tsx`

`apps/web/src/components/riskscan/detail/` renders no outcome and is out of
scope. The stylesheet and each amended component belong to accepted cards, so
each needs an explicit root integration reservation recorded in the ownership
file before the amendment, in the manner the accepted route-wiring amendment
already used.

## Required status behavior

One presentational component takes a tone and the message the component already
renders. The tone vocabulary is closed: `neutral`, `working`, `success`,
`warning`, and `error`.

Every tone maps to a distinction an amended component already makes today. The
request flow's own state kinds fix the mapping:

| Tone | Existing local state |
| --- | --- |
| `neutral` | a component's resting, nothing-reported state |
| `working` | `submitting` |
| `success` | the completed local boundary a component already reports |
| `warning` | `payment_required` — a challenge returned, nothing paid |
| `error` | `unavailable`, `invalid_request`, `transport_failure`, `unexpected_response` |

No component may gain a new outcome, a new branch, or a new outcome message.
Where a component renders one message for several conditions, it keeps one
message and one tone.

The existing `aria-live="polite"` regions are preserved, and the wording of
every outcome message is preserved verbatim. The tone is carried by a short
tone label rendered alongside that message, plus colour and shape. The label is
not an outcome message and does not replace or reword one; it names the tone so
the distinction survives a monochrome display and a colour vision deficiency.
Colour alone never carries the distinction.

## Required panel behavior

The empty and error panel shape is presentational: a title, a description, an
optional action slot, and an optional decorative illustration with an empty
`alt`. It holds no state and performs no action. It exists so the accepted
surfaces and the separately carded boundary routes can present an empty or
failed state consistently; consuming it from those routes is a later card's
decision, not this one's.

## Truthfulness and authority boundary

The `success` tone means the local boundary the component already reports as
complete. It must not be attached to a payment, settlement, receipt, evidence,
finality, or verification claim, none of which this repository can assert from
the browser. A refused or failed local boundary takes `error` or `warning` and
must not be softened into `neutral`.

The slice adds no client state, fetch, storage, configuration read, timer,
environment read, dependency, icon package, animation package, font, route, or
full-tree import.

## Acceptance evidence

- Focused contracts cover the closed tone vocabulary, the tone-to-existing-state
  mapping above, the verbatim-preserved outcome wording, the preserved live
  regions, the non-colour-only distinction, and the absence of any new outcome
  branch in every amended component.
- A contrast check reproduces the measured ratio recorded for each token pair.
- The existing focused suites of all five amended components pass unchanged,
  proving no behavioral drift.
- Desktop and narrow browser checks cover each tone, visible keyboard focus,
  honored reduced-motion preference, and no horizontal overflow.
- Web typecheck/test, production build with Cache Components, root quality,
  queue/reference checks, the enabled local guard, and independent review pass
  before acceptance.
