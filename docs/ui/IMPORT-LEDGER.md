# Local UI slice ledger

This ledger records only selected slices and local targets. Exact source identifiers and archive material remain outside tracked files.

| Slice | Local status | Local target boundary | Explicit exclusions |
|---|---|---|---|
| UI-S00 | Manifest and adaptation accepted | Global tokens, local primitives, logo assets, and truthful application frame | Mock data/adapters, auth, providers, payment, analytics, hosted fonts, external claims, detail routes, and full-tree import |
| UI-S01 | Manifest and adaptation accepted | Landing route, Explore route, local navigation, one read-only discovery card, and one decorative asset | Mock data/adapters, auth, providers, price, payment, accounts, metrics, evidence, external links, request actions, detail routes, paid states, and full-tree import |
| UI-S02 | Manifest and adaptation accepted | RiskScan detail route, one local Explore-to-detail link, and focused static route/component tests | Forms, submission, client fetch, runtime configuration reads, price, wallet, payment states, providers, accounts, metrics, receipts, evidence, external links, mock results, live claims, and full-tree import |
| UI-S03 | Manifest and adaptation accepted | Try RiskScan route, typed browser response mapping, bounded form submission, and local detail-to-Try navigation | Runtime configuration reads, wallet/signer/payment-header authoring, payment payload display, direct facilitator access, provider/account surfaces, price, receipt, evidence, fabricated result/payment/completion state, external links, analytics, persistence, and full-tree import |
