# S25-T010 RiskScan Try assertion scope correction

## Trigger

At the authorised S25 GREEN working tree, the complete Node 22.21.1 Web suite
reports one failure in `apps/web/tests/riskscan-try.test.mjs`. Its only broken
assertion reads the RiskScan-detail Try CTA as raw `href=` markup. The detail
header now owns the same local route as an explicit `PageHeader` action object.

## Candidate correction

Amend only that assertion to require the fixed pair:

- `Try RiskScan` → `/explore/riskscan/try`

All request-flow, form, response, client-boundary, and no-runtime assertions
remain byte-for-byte unchanged. The RiskScan detail source path is already in
the authorised fourteen-path GREEN scope; this record grants no new source
authority.

## Required control

`apps/web/tests/riskscan-try.test.mjs` remains prohibited until a fresh
independent scope review accepts this candidate. No implementation, queue
state transition, or external behavior is implied by this record.
