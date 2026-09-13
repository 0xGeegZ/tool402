# B03 Consumer Agent payment evidence

This is the judge-facing index for the one completed B03 testnet payment. It
does not contain a private key, environment value, signed payment header, or
payment payload.

## Recorded payment

- Agent source: `d779103b313021be8f66b4203f75699a8728287a`.
- Public service: `https://tool402.vercel.app`.
- Settlement: `0.0.7162784@1789302725.356257382`.
- Result: received and validated by the Consumer Agent.
- Hedera testnet Mirror Node: `CRYPTOTRANSFER` with `SUCCESS` at consensus
  timestamp `1789302730.295627233`; it records the matching `100000` tinybar
  transfer.

## Demo artifact

The sanitized CLI export is retained outside Git for import into `/demo`:
`tool402-agent-evidence.json`, SHA-256
`35fd86d16febc9a3e2aa24d5a0c171f10822b29e0fb8783f92c0c37315fc7f8b`.

Import that exact file once through **Import Agent evidence**. Do not run the
paid command again for a retake. The screen should show client-reported
settlement/result evidence; the public-ledger transaction corroborates the
transfer but does not itself prove the HTTP response.

## Control record

The complete secret-free control record is
[HA-B03-AGENT-PAYMENT-001 execution record](../work-queue/evidence/HA-B03-AGENT-PAYMENT-001-execution-record.md).
It records the authorization boundary, preflight, artifact digest, and the
strict no-retry rule.
