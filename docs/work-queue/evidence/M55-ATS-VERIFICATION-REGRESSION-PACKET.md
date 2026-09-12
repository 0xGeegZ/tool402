# M55 ATS verification — owner test and finding packet

This is a test contract for the M55 receipt-binding owner, not an M55 source
change. Tests must sit at the backend trust boundary: verifier, receipt binding,
candidate attachment, and every READY replay-repair path.

Use independently constructed A and B fixtures with equal names but different
tool identity, subject, expected calldata/hash, and offering.

| Case | Required result |
| --- | --- |
| Uncorroborated candidate | Reader timeout, malformed/unknown material, or a signed assertion alone leaves the offering pending; it cannot become READY or publish. |
| A receipt for B | Submit A's valid exact receipt for B; reject before attach/READY and preserve B unchanged. |
| Wrong tuple | Independently alter sender, chain, Factory, decoded calldata/input hash, tx hash, receipt status, event address, and event count. Each rejects with no binding, READY, or publishable projection. |
| Unknown | Timeout, oversized/malformed response, absent receipt, and unknown transaction preserve recovery context and pending state; never call \`eth_sendTransaction\`, resend, or auto-attach. |
| Correct verified asset required | A has its own verified asset; cross-use it for B or publish B. B cannot publish; A can only publish after its own verified binding and all current owner/authority/preparation rechecks. |

Retain the exclusivity matrix: new-first to legacy, legacy-first to new,
concurrent asset/hash claims, initial attachment, \`SUBMITTED\` retry, and READY
replay-repair. Same-offering exact replay is idempotent; a different offering
never claims the hash or asset.

Fixtures must not be produced by the helper under test. Decode Factory calldata
independently and assert durable records before/after every rejection. Current
M43 returns \`NOT_CONFIGURED\` for ATS_CREATE and never calls \`markAssetReady\`, so
this is a successor contract, not a current-M43 expectation.

Completion evidence: named test files/commands; integrated-head output for all
five cases; review proof that every attachment and READY replay-repair write,
including legacy, uses the same exclusivity guard; and proof tests never send a
wallet transaction.
