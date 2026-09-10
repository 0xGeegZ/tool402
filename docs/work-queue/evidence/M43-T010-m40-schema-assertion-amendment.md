# M43-T010 M40 schema-assertion amendment

## Observation

The complete Backend compatibility assertion in
`packages/backend/tests/offering-durable-schema.test.mjs` preserves the M40
tables while also asserting the accepted M32 subset. After M43's already
authorized `externalPrepareCommandAttempts` schema amendment, that fixture
still expected the former literal `PREPARED` state and no candidate or
reconciliation fields.

The focused assertion fails only on the exact M43 additions:

- the `PREPARED`/`SUBMITTED`/`CONFIRMED`/`OUTCOME_UNKNOWN`/`REJECTED` state
  union; and
- optional `candidateTransactionId`, `candidateEvmAddress`, and
  `nextReconciliationAt` fields.

## Authorized correction

This root-owned, test-only amendment updates that expected M32 subset to the
same already-authorized M43 shape. It does not amend an M40 source module,
table, index, query, mutation, durable behavior, public projection, or
external capability.

## Verification

The pre-amendment focused command failed exactly because the M40 fixture
described the superseded M32-only shape:

```text
env PATH=/Users/guillaumedieudonne/.nvm/versions/node/v22.21.1/bin:$PATH \
node --test packages/backend/tests/offering-durable-schema.test.mjs
```

After the expected-shape correction, the same command and the complete Backend
suite must pass before M43 can be accepted. A fresh independent review must
confirm that this change remains assertion-only.
