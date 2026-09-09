# HA-ATS-RUNTIME-BINDING-001 decision

## Status

Accepted bounded local safety authority. It authorizes no wallet, account,
SDK, network, asset, transaction, deployment, publication, or live action.

## Human acceptance

The human accepted the recommended decision through the completed
[HI-003 intake](../queue/60-done/HI-003-packet-acceptance.md). The exact
approved local rule is: for `ATS_CREATE` only, a future separately scoped
runtime amendment may reject a command unless M32's already-normalized
canonical signer exactly equals the owner address in the fixed server-side
configuration, after the existing authority revalidation and before durable
state.

The manifest remains disabled. The rule must use a fixed server-side
configuration; it may not select configuration from submitted payload data.

## Exclusions

This decision creates no source authority by itself. It does not authorize an
authority record, manifest enablement, a public endpoint, environment access,
wallet/provider interaction, SDK use, account action, funding, transaction,
asset, deployment, publication, or live test. A future card must reconcile the
accepted runtime rule with the then-current immutable configuration before its
own ready, activation, RED, and source cycle.
