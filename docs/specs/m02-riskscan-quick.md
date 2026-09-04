# M02 RiskScan Quick contract

## Delivery boundary

RiskScan Quick is a pure local assessment of declarations supplied with a bounded RiskScan request. It makes disclosure gaps visible without assigning a score, fetching a subject, verifying a claim, performing a payment action, creating an endpoint, persisting data, or claiming that a tool is safe, live, or externally verified.

## Input

`assessRiskScanQuick` accepts a request-shaped input plus four exact boolean declarations:

- `identity`: whether the caller reports an identity disclosure;
- `pricing`: whether the caller reports a pricing disclosure;
- `limitations`: whether the caller reports a limitations disclosure;
- `evidence`: whether the caller reports an evidence disclosure.

The request fields use the accepted RiskScan request validation: nonblank trimmed `requestRef` (up to 96 characters), `subjectRef` (up to 160), and `context` (up to 280). Each declaration must be a boolean; missing or structurally unsupported declarations are rejected.

## Output

The assessment preserves the validated request fields and returns one of two explicit dispositions:

- `needs_disclosure` when at least one caller-reported declaration is absent. Its reasons list exactly the absent declaration labels in a stable local order.
- `disclosures_reported` when all four declarations are reported. Its reasons state only that the caller reported each declaration; they do not certify any claim.

Every assessment returns at least one limitation. The required baseline limitation says that Quick reflects caller-supplied declarations and does not verify a service, payment, or evidence record. It has no score, price, receipt, payment, settlement, external evidence, or availability claim.

## Public boundary

The core package exports the input, declaration, disposition, result types, and pure assessment function. It may reuse the accepted request validator but must not add I/O, framework, database, network, protocol, or adapter imports.

## Acceptance evidence

- Table-driven tests reject malformed request/declaration input.
- Tests prove stable, exact missing-disclosure reasons and the all-reported disposition.
- Tests prove the limitation boundary and absence of payment, receipt, settlement, or score fields.
- Core typecheck, test, lint, local-reference guard, and independent review pass.

Backend execution, paid HTTP handling, settlement, and UI detail are separate local tasks.
