# S28-T010 readiness review

- Reviewed exact head: `7314962c1a25d5584e46705d6f50193d99c73375`.
- Verdict: ready for a separate test-only RED activation, not source work.
- UI-S28, the inbox card, ledger, State, catalog, D-S28-010-001, and the
  ownership record resolve to exactly the Provider page, its status component,
  and one new visual-reconciliation test.
- S17 is accepted. Its projection reader/state and existing reader test are
  expressly excluded, while `/provider/deploy` and `/explore/riskscan` are
  existing local routes. No active lane owns the three candidate paths.
- Under Node 22.21.1, the S17 provider-status baseline passes 10/10.
- The Provider card must describe only the local RiskScan offering path. It
  must not imply that an offering is admitted, active, published, or live when
  the projection is absent or not configured.
