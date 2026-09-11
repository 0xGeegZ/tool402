# B04 security scan remediation plan

1. Establish the local B04 authority and add tests that reproduce both
   findings without any external call.
2. Introduce one public canonical Stage-B identity leaf and make each local
   display, command, execution, and guard consumer read it.
3. Introduce one bounded streamed JSON reader for both protected evaluators,
   preserving their existing malformed and unsigned request ordering.
4. Run focused and workspace verification, review the resulting diff, and
   obtain one fresh bypass/regression review before integration.
