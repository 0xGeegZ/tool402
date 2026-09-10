# S24-T010 implementation plan

## Goal

Make the guest dashboard understandable and visually coherent using only
truthful current local journeys and unavailable-state guidance.

## Boundaries

Do not add account, wallet, provider, balance, payment, transaction, receipt,
evidence, funding, return, live data, client runtime behavior, external links,
or fabricated claims.

## Order

1. Establish focused RED tests for dashboard hierarchy, exact local CTA routes,
   and guest/unavailable-state truthfulness.
2. Obtain independent RED review before any source is changed.
3. Implement only the later-approved dashboard source paths.
4. Run focused and complete Web checks plus responsive, keyboard, landmark, and
   visual verification before independent review.
