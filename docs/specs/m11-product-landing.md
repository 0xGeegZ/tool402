# M11 public product landing contract

## Delivery boundary

This contract replaces the minimal root landing with a complete, static public
product introduction. It explains Tool402, introduces the bounded RiskScan
journey, and gives a visitor clear navigation to already committed local
routes. It is a server-rendered presentation surface using the accepted local
tokens, primitives, logo, and existing mascot asset.

## Required content and route behavior

The root route has exactly one `main` landmark and one `h1`. The hero must
identify Tool402 and state its purpose in plain language. A `how-it-works`
section must describe the three truthful stages: explore a bounded tool,
understand its request boundary, and follow the local RiskScan journey.

The page includes only these product CTAs:

- `Explore tools` to `/explore`;
- `See RiskScan` to `/explore/riskscan`; and
- `Try local flow` to `/explore/riskscan/try`.

Every CTA is an ordinary local navigation link. It does not automatically
send a request, open an external page, or represent an authenticated action.

## Truthfulness and authority boundary

The landing may describe planned product direction and the local bounded
RiskScan experience. It must not show or imply a live service, payment,
settlement, price, test result, account, wallet, provider, user session,
balance, metric, testimonial, partner, deployment, external link, or
guarantee. Decorative imagery is empty-alt and comes only from a local asset
already committed in this repository.

The slice does not modify the global layout, navigation, or the accepted
landing/Explore test. UI-S01 remains the authority for its static Explore
card. This slice supersedes only the root landing portion of UI-S01 through
UI-S06.

## Acceptance evidence

- Focused source contracts prove one main heading, required copy/sections,
  exact local CTA targets, no interactive request behavior, and exclusion of
  fabricated commercial or authenticated states.
- Web typecheck/test, production build with Cache Components, root quality,
  queue/reference/whitespace checks, and enabled local guard pass.
- Desktop and narrow browser checks prove readable hierarchy, working local
  navigation, no horizontal overflow, keyboard-visible focus, and no
  framework or browser errors.
