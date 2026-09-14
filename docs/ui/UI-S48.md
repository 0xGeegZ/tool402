# UI-S48 landing message clarity manifest

## Purpose

UI-S48 is a presentation-only copy refresh for the existing public root route.
It retains the accepted landing composition, visual assets, spacing, and CTA
destinations while replacing documentation-like language with a clear product
journey for developers building AI agents.

## Local target

- Hero: one marketplace promise, one concise explanatory paragraph, clear
  Hedera-testnet signal, **See the demo** primary action, and **Explore tools**
  secondary action.
- Agent flow: find a tool, check its quoted price against configured rules,
  then pay and receive the verified result.
- Tool cards: concrete RiskScan and EntityCheck descriptions, labelled so a
  visitor can distinguish a directory tool from a source-backed preview.
- Benefits: understand the tool, see payment requirements first, and keep
  configured spending rules in control.
- Provider panel, footer, title, and meta description: the same truthful
  marketplace/testnet message.

## Explicit exclusions

No new visual treatment, asset, route, navigation item, CTA target, client
state, data, price, payment surface, wallet/provider control, budget UI,
analytics, external link, deployment, or live claim. The `layout.tsx` header
and shell wrapper remain under S26 and are excluded; only its metadata object
is a S48 integration seam.
