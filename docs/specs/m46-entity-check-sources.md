# M46 EntityCheck source adapters contract

## Delivery boundary

This contract adds one server-only reader for the two public sources the
EntityCheck core assesses: the French `recherche-entreprises` open API and the
US Treasury OFAC Specially Designated Nationals (SDN) list in CSV form. Both
sources are public and need no credential. The reader converts their responses
into the core candidate and dataset types with the source descriptors the core
echoes. It makes no live call in any test, holds no key, quotes no price,
initiates no payment, and proves no external fact beyond what one bounded read
returned.

## Runtime configuration

`readEntityCheckSourceConfiguration(environment)` requires both nonblank
values or returns `null`:

- `ENTITYCHECK_REGISTRY_BASE_URL`: an HTTPS base URL without userinfo, query,
  or fragment;
- `ENTITYCHECK_SANCTIONS_URL`: an HTTPS URL without userinfo.

No default URL is committed. With `null` configuration the reader returns the
`not_configured` outcome and sends nothing.

## Registry read

One `GET {base}/search?q={query}&per_page=5` with the request's
`registrationNumber` when present, else its `query`, URL-encoded. The read is
bounded by a 5 second timeout and a 1 MiB body cap. Each `results[]` item maps
to one candidate: `siren`, `nom_complet` → `legalName`,
`etat_administratif` `A` → `active` and `C` → `ceased`, `date_creation` →
`incorporationDate`, `siege.adresse` → `registeredAddress` (empty string when
absent), `dirigeants.length` → `officerCount`, `date_mise_a_jour` →
`registryUpdatedAt`. An item with any other `etat_administratif`, a non-nine-
digit `siren`, or a blank `nom_complet` is dropped, and the dropped count is
reported. The registry descriptor is `{ source: "FR_RECHERCHE_ENTREPRISES",
readAt }` with `readAt` from the injected clock.

## Sanctions read

One `GET` of the configured SDN CSV bounded by a 20 second timeout and a
16 MiB body cap. The file has no header row and twelve comma-separated
columns; the reader uses column 1 as `entryId`, column 2 as `name`, column 3
as `entryType`, and column 4 split on `] [` with brackets stripped as
`programs`. The literal `-0-` means empty. The dataset descriptor is
`{ source: "OFAC_SDN", lastModified, contentHash, entries }` where
`lastModified` is the response's `Last-Modified` header (or the clock when
absent) and `contentHash` is the SHA-256 hex digest of the body bytes.

A parsed dataset is cached in module memory by URL for at most 24 hours and
reused for later reads. The cache stores only parsed entries and the
descriptor, never the raw body, and every result cites the descriptor of the
dataset actually used.

## Outcomes

`readEntityCheckSources(request, configuration, dependencies)` returns exactly
one of:

- `{ kind: "read", registryCandidates, droppedCandidates, registrySource,
  sanctionsDataset }`;
- `{ kind: "not_configured" }`;
- `{ kind: "registry_unavailable" }` on timeout, cap, non-200, or
  unparsable registry response; or
- `{ kind: "sanctions_unavailable" }` likewise for the sanctions read when
  no cached dataset exists.

`dependencies` supplies `fetch` and `now`; the module has no default fetch.
Failure outcomes carry no upstream status, body, or error text.

## Public boundary

The web package owns the server-only module. It may depend on the local core
package and Node built-ins only. It must not expose configuration to browser
code, log a URL, body, or header, or make a failed read look like a result.

## Acceptance evidence

- Tests prove `null` configuration for each missing or malformed value and the
  `not_configured` outcome with no fetch call.
- Tests prove the exact registry URL, the SIREN-over-query precedence, the
  field mapping from a recorded fixture, the drop rules with the dropped count,
  and the timeout, cap, and non-200 outcomes.
- Tests prove the CSV column mapping, `-0-` handling, program splitting,
  `Last-Modified` and hash reporting, the 24 hour cache reuse, and that the
  cache holds no raw body.
- Tests prove no default fetch, no environment read outside the parser, and
  no log output.
- Web typecheck, test, lint, local-reference guard, and independent review
  pass.

Paid HTTP handling, directory publication, and one human-authorised live read
are separate local tasks and a separate human action.
