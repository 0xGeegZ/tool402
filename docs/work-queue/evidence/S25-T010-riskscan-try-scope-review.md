# S25-T010 RiskScan Try scope review

## Reviewed control head

- `c98edcc` (`docs: scope RiskScan Try header assertion`)

## Result

CLEAR.

The independent review confirmed that the affected existing test has only one
relevant static detail assertion: raw `href="/explore/riskscan/try"` markup.
Against the authorised detail-header working tree, it fails only because the
same CTA is now the fixed PageHeader action object. No active lane collides;
M48 remains disjoint.

## Ruling

Only that assertion may change, to require `Try RiskScan` →
`/explore/riskscan/try`. Every request-flow, form, response, client-boundary,
and no-runtime assertion remains byte-for-byte fixed. The correction grants no
source expansion.
