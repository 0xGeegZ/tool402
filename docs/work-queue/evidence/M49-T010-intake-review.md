# M49-T010 independent intake review

## Scope reviewed

At clean canonical `a5cfdce9189b41f5a19b8f129fc6caa769dce87c`, review covered
HI-009; M42 real-issuer configuration; M44 Factory + viem and event
canonicalization seams; M47 browser command projection; M48 local M33 mapping;
M41/M43 candidate consumers; HI-004 issuer-account evidence; HI-007 candidate
wire form; S15/S16/S21 wallet and deploy-stage boundaries; active S22/S24
lanes; S26 inbox ownership; catalog, State, decisions, and ownership records.

## Findings

- HI-009 explicitly requests this successor after M48; M48 is now accepted.
  M42's complete real preimage and digest remain unchanged.
- M44 has the sole accepted Factory artifact/viem builder, encoder, decoded
  event canonicalizer, and candidate transaction-id normalizer. It accepts a
  complete configuration but does not create a browser execution input.
- M47's six-field browser command projection is deliberately insufficient for
  Factory calldata. S16's synthetic display projection is incomplete and must
  never become Factory input.
- HI-004 provides a fixed public issuer-account record needed to query a
  transaction list without deriving a transaction id from a timestamp.
- An EIP-1193 send/receipt returns an EVM hash, while the existing candidate
  boundary requires a Mirror-form transaction id. The M49 contract closes that
  gap with three fixed, bounded, injected-fetch reads: result by hash, exact
  issuer-account transaction list at the returned timestamp, then result by
  the returned transaction id. It fails closed on every ambiguity.
- S22/S24 are disjoint. S26 is inbox-only but reserves the signing island;
  M49 takes CORE_P0 precedence and S26 must later rebase. M44/M47/S21 are
  accepted, so M49 uses explicit root integration reservations.
- The final independent control/plan reviews require a page-session
  synchronous send mutex plus post-hash terminal latch, valid-EIP-55
  normalization before issuer comparison, Factory-emitter validation before
  every M44 event decode, and a strict bounded Mirror observation contract.
  The card/specification/plan now require three read-only cycles over five
  seconds, safe transaction-list own data without following pagination links, and exact
  result/status/timestamp/event correlation. These additions preserve the
  no-provider/no-network local-test boundary.

## Verdict

The successor is coherent as a new `00-inbox` card and has no new M42
configuration/hash or human authority decision. A fresh independent readiness
review remains required before it can move to `10-ready`; a separate activation
may then authorize durable test-only RED only. HA-ATS-STAGE-B-001 remains
pending and blocks every real wallet, Mirror, transaction, candidate attachment,
verification, or lifecycle action.
