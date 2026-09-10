# M44-T020 independent RED review

## Result

**CLEAR** at `85c8265fedf028a56854792e26fd82aae512abc8`.

Under Node 22.21.1, the two focused RED contracts report exactly two expected
failures: the declared `factory-deploy-bond.ts` source is absent. Ten
source-dependent GREEN assertions are skipped and no secondary diagnostic
appears. Whitespace is clear.

The review confirms the contracts cover the full official Factory tuple,
non-zero target/resolver/issuer drift, every missing or surplus complete
configuration field, direct `factoryArtifact.abi` use for encoding and event
decoding, the Node JSON import attribute, HI-007 normalization, and removal of
the historical SDK compatibility graph.

## Ruling

Authorize minimal GREEN only in the ownership-reserved paths: direct Factory
source, action, manifest/lock/static-shell/Next config, and the named
historical SDK source/test/mock removal. No wallet, provider, RPC, simulation,
transaction, deployment, candidate attachment, or live behavior is added.
