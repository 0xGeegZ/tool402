# M57 demo evidence capture

## Purpose

M57 removes manual transcription from the Consumer Agent portion of the demo.
After one real `paid` CLI result, the CLI may write one sanitized, versioned
JSON evidence packet. `/demo` can import that packet with an explicit file
selection and retain only its allowlisted summary in browser storage for a
retake. This is client-reported evidence, not server authority or on-chain
verification.

## Boundaries

- The CLI export is opt-in (`--evidence-output PATH`) and is attempted only
  after the existing payment function has returned `kind: "paid"`.
- When export is requested, the CLI validates the one output argument, a
  locally-derived source SHA, the fixed recording-run identifier, and obvious
  output-file/parent-directory errors before it reads payer configuration or
  starts payment. Unknown or duplicate export arguments fail at that same
  boundary. Existing evidence files are never overwritten; their only
  safe recovery is inspect/import, not another paid invocation.
- Preflight never reads a signer or payer key and never writes successful
  payment evidence. Export failure is a separate closed diagnostic after the
  known settlement reference; it never invokes the payment flow again.
- The packet has a fixed `schemaVersion`, `kind`, recording-run reference,
  service and quote identity, exact paid amount, settlement reference, result
  digest, client-observation flags, and captured timestamp. It contains no
  request context, assessment text, key, cookie, header, signed payload, raw
  response, or environment object.
- `/demo` validates exact field names, prototypes, types, lengths, canonical
  Hedera testnet identifiers, and a 16 KiB file limit before retaining a
  packet. Imported assertions never yield `Verified on Hedera`; a client
  receipt yields `Settlement reported` and `Result received` only.
- Hedera transaction identifiers use the shared Core parser. It preserves
  account, seconds, and nanoseconds text exactly, including the SDK's
  nine-digit zero-padded nanoseconds form; it accepts neither arbitrary IDs nor
  unhandled scheduled/child variants.
- Browser storage is convenience only. If it cannot be read or written, the
  current tab retains the allowlisted in-memory packet, labels it memory-only,
  and keeps its export action available without claiming reload persistence.
- The browser performs no arbitrary imported URL fetch. It makes no permanent
  poller. A future read-only verifier may upgrade a previously retained
  canonical settlement reference through an explicit bounded refresh seam.
- The existing process-local `riskscan-settlement-evidence` sink remains
  private and is neither read nor exposed by this slice. The existing x402
  observer remains non-interfering.

## Demo summary

The same derived evidence model supplies readiness, the Consumer Agent guided
step, final recap, and an external HashScan button. A valid reference is
labelled `Submitted — verification pending` until a trusted verifier reports
otherwise. Missing or malformed identifiers render no link. The button uses
the existing testnet HashScan helper and opens `target="_blank"` with
`rel="noopener noreferrer"`.

M57 does not infer ATS deployment/lifecycle, backing transfer, Provider M55,
or World proof. Those rows remain unavailable or pending until their owners
publish a safe, correctly bound projection. In particular, the active M56
backing flow is not modified.

## Validation

- Agent tests cover successful export, no preflight signer/export path, and
  export failure without a second paid request.
- Web tests cover strict import rejection, imported verification-flag
  suppression, duplicate ingestion, reload recovery, pending verification,
  no secret fields, and rendered safe HashScan actions.
- Run focused Agent/Web suites, their typechecks, root queue/reference guards,
  root lint/test/build, an independent review, and a desktop/390px browser
  rehearsal with injected evidence only.
