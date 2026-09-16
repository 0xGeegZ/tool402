# M59 authorization review

## Reviewed controls

| Boundary | Result |
| --- | --- |
| Membership | Active self-service membership is required; suspended or revoked records are not reactivated. |
| Tool creation | The backend verifies the membership and enforces a persisted-owner quota before inserting a tool. |
| ATS owner | Selected-tool ATS configuration, browser request `from`, and receipt corroboration use the durable tool owner rather than the legacy issuer. |
| Funding terms | The browser submits only offering id and units. Convex validates OPEN state, bounds units, calculates tinybars with `BigInt`, rejects self-transfer, and freezes recipient/hash/expiry before signing. |
| Funding admission | A self-service `HEDERA_FUNDING` command is admitted only when its payload exactly matches one frozen record for the same signer. |
| Payment evidence | Reservation precedes transfer; one hash remains bound to one attempt; payment status is read by offering scope for provider projects. |
| Public discovery | The catalogue exposes only OPEN selected provider offerings with a persisted owner-recipient policy. Drafts and arbitrary recipients are excluded. |
| Legacy compatibility | RiskScan continues to use its configured server treasury; new provider projects do not silently route to it. |

## Residual deployment gates

- This review covers the current branch's code and automated tests only. It
  does not prove deployed Convex configuration, authenticated browser flow,
  wallet behavior, Testnet settlement, or receipt-provider availability.
- Human operators retain authority for environment configuration, deployment,
  schema rollout, wallet actions, Testnet HBAR, and any demo narration.
