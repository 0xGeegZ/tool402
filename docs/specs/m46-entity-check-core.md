# M46 EntityCheck core contract

## Delivery boundary

EntityCheck core is a pure local assessment over already-fetched public
records: one French company registry search result set and one sanctions
dataset. It decides whether a counterparty query resolves to exactly one
registered company and whether that company's legal name appears on the
supplied sanctions list. It fetches nothing, verifies no ownership, solvency,
or compliance fact, assigns no score, quotes no price, persists nothing, and
claims no live availability.

## Input

`parseEntityCheckRequest` accepts an object with:

- `requestRef`: nonblank trimmed string, 1–96 characters, caller correlation;
- `jurisdiction`: the exact literal `FR`;
- `query`: nonblank trimmed string, 1–160 characters, a company name or a
  SIREN; and
- `registrationNumber`: optional; when present, exactly nine ASCII digits
  (a SIREN).

Blank, oversized, structurally unsupported, or non-`FR` input is rejected
before an assessment starts.

`assessEntityCheck` accepts a validated request plus:

- `registryCandidates`: an array of `EntityRegistryCandidate`, each with
  `siren` (nine digits), `legalName` (nonblank), `administrativeStatus`
  (`active` or `ceased`), `incorporationDate` (`YYYY-MM-DD`),
  `registeredAddress` (string, may be empty), `officerCount` (integer ≥ 0),
  and `registryUpdatedAt` (ISO timestamp);
- `registrySource`: `{ source: "FR_RECHERCHE_ENTREPRISES", readAt }`;
- `sanctionsDataset`: `{ source: "OFAC_SDN", lastModified, contentHash,
  entries }` where each entry has `entryId` (nonblank), `name` (nonblank),
  `entryType` (string), and `programs` (string array).

Malformed candidates, entries, or source descriptors are rejected as a whole;
the function never partially assesses.

## Output

The assessment preserves `requestRef`, `jurisdiction`, `query`, and
`registrationNumber`, echoes both source descriptors without `entries`, and
returns one disposition:

- `found`: exactly one candidate, or one candidate whose `siren` equals the
  supplied `registrationNumber`. The result carries that candidate's fields.
- `ambiguous`: two or more candidates and no `registrationNumber` match. The
  result carries the candidate count and the first five `siren` and
  `legalName` pairs in supplied order, and the limitation
  `Supply the SIREN as registrationNumber to disambiguate.`
- `not_found`: zero candidates.

The sanctions screen runs only for `found` and returns one of:

- `clear`: no entry name matches the candidate's legal name; or
- `hit`: at least one entry matches, with the matched `entryId`, `name`,
  `entryType`, and `programs` for every match in dataset order.

`ambiguous` and `not_found` results carry the screen value `not_screened`.

Name matching is exact after normalisation: Unicode NFKD, combining marks
removed, uppercased, punctuation replaced by spaces, whitespace collapsed and
trimmed. No fuzzy, token, or phonetic matching exists in this contract.

Every result carries the baseline limitation:
`EntityCheck reflects two public sources at the time they were read and does
not verify ownership, solvency, or compliance; a clear screen is not a
compliance opinion.` A result has no score, price, receipt, payment,
settlement, evidence-record, or availability field.

## Public boundary

The core package exports the request input, candidate, dataset, disposition,
screen, and result types, `parseEntityCheckRequest`, `normaliseEntityName`,
and the pure `assessEntityCheck`. It must not add I/O, framework, database,
network, protocol, or adapter imports and must not import the RiskScan
modules.

## Acceptance evidence

- Table-driven tests reject malformed request, candidate, entry, and source
  input and preserve a valid request.
- Tests prove `found` by single candidate and by SIREN match, `ambiguous`
  with the exact limitation and the five-pair cap, and `not_found`.
- Tests prove `clear`, `hit` with every matching entry in order,
  `not_screened` for the two non-found dispositions, and the exact
  normalisation rules including diacritics and punctuation.
- Tests prove the baseline limitation and the absence of score, price,
  receipt, payment, settlement, evidence-record, and availability fields.
- Core typecheck, test, lint, local-reference guard, and independent review
  pass.

Source reading, paid HTTP handling, directory publication, and UI are separate
local tasks.
