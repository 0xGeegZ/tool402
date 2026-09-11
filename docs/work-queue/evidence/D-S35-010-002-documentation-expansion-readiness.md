# D-S35-010-002 — Public documentation expansion ready

Fresh independent readiness at exact head
`4c5770c8a5cefc9fa1a1c31cbe8fac7b9e9fd62d` against canonical
`9281374d4d7c3420ea5fe0e00c5456ed1895d36e` confirms S31/S34 are accepted
and released; all S35 control records resolve; the four new Docs source paths
and new documentation-expansion test are absent; the Docs home, footer, and
public-documentation test are present; no active ownership collision exists;
and the Node 22.21.1 current-doc baseline passes 5/5 with queue check clear.

The source-backed HTTP boundaries and absence of a public MCP route support
only static local documentation: API reference label, default descriptor
boundary, conditionally configured POST/unavailable boundary, and
testnet/caller-supplied/402-not-payment/Provider-non-deployment FAQ facts.

## Ruling

Move S35-T010 to 10-ready. No source or test path is reserved; a separate
activation may reserve only `documentation-expansion.test.mjs` and
`public-documentation.test.mjs` for durable RED.
