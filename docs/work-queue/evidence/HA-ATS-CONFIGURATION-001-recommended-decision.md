# HA-ATS-CONFIGURATION-001 — Recommended human decision packet

> **Status: REQUIRED — not yet approved.** This is a secret-free decision
> packet, not runtime configuration, an enabled authority record, or evidence
> of an ATS operation. It authorizes no SDK call, provider/wallet interaction,
> account action, funding, payment, transaction, deployment, or live behavior.

## Root-prepared public candidates — not authority

The root verified the following public facts on 2026-09-08 to remove routine
research from the human decision. They are **candidates only**: the final
declaration must either accept each candidate verbatim or explicitly replace
it. They do not select an issuer, an asset, a target, an operation descriptor,
or an enabled authority record.

- Candidate package: `@hashgraph/asset-tokenization-sdk@8.0.0`. The root also
  captured the published tarball integrity candidate
  `sha512-V5Tg6IrWhMwxEWzzvv7fZWu4a8zXDj8vAk5OCO9W0dtact32hljstahPIY5dLvlpyNWwNXaepzpvDj77DoccsA==`.
  A human must still explicitly approve this release reference and the
  permitted API surface; a package version alone is not treated as a complete
  compatibility or execution decision.
- Candidate API summary: the relevant public identifiers are
  `InitializationRequest`, `ConfigResponse`, `Network.init`,
  `CreateEquityRequest`/`Equity.create`, and
  `CreateBondRequest`/`Bond.create`. The versioned declarations, rather than
  the release guide's incompatible creation example, are the API authority.
  A human must select exactly one creation family and then approve its exact
  module/export/method/overload, required arguments, ordering, encoding, and
  no-default policy; listing an API name alone is insufficient.
- Candidate local configuration projection: the verified initialization shape
  has `network`, `mirrorNode.baseUrl`, `rpcNode.baseUrl`, and an optional
  `configuration` object that, when present, requires both
  `factoryAddress: string` and `resolverAddress: string`. It is not a frozen
  SDK type or an authorization to initialize the SDK. The published `8.0.0`
  package root invokes `dotenv.config()` when imported, so the immediate local
  unsigned successor must model a Tool402-owned frozen projection without
  importing the package. SDK import/execution remains a later explicit human
  gate.
- Candidate public testnet initialization facts: network `testnet`; Mirror Node
  `https://testnet.mirrornode.hedera.com/api/v1/`; JSON-RPC
  `https://testnet.hashio.io/api`; resolver `0.0.7707874`; factory
  `0.0.7708432`.
- Public deployed-address metadata identifies those testnet contracts as the
  BLR Proxy and Factory Proxy, respectively, and lists their
  EIP-55-checksummed EVM addresses. This packet normalizes those same address
  bytes to lowercase as
  `0xefef4cae9642631cfc6d997d6207ee48fa78fe42` and
  `0x5fa65ca30d1984701f10476664327f97c864a9d3`.

The current local `NoteUnits` vocabulary and 80/20 economics do **not** decide
whether the first ATS asset is a bond, equity, or another instrument. They
also do not select an issuer, name, symbol, supply, maturity, role set, or
other immutable creation parameter. Those remain deliberate human choices;
the root must not fabricate a test fixture into a product authority.

## Why a human decision is required

The next ATS slice would select public but security-sensitive authority: the
exact official SDK version, issuer role, configuration endpoints, immutable
asset parameters, and the target/parameter binding that a later signed command
must match. Those values cannot be inferred from a browser, a signer, an
environment variable, a source example, or an unapproved test fixture.

## Recommended safest D-Day option

Approve one **contract-only `ATS_CREATE` configuration** for Hedera testnet.
The immediate successor may validate and construct deterministic unsigned
configuration data only. It must keep M33's production manifest zero-enabled
and must not import or invoke an ATS SDK, select/connect MetaMask, create an
asset, admit a holder, transfer a token, fund, submit, deploy, or claim live
success. Every other `ATS_*` kind remains fail-closed.

This option establishes a reviewable local contract while preserving a separate
human gate for SDK/provider execution and a separate human gate for any M33
enabled mapping.

## Approved-by-default rules for this packet

- Network is exactly `hedera:testnet`; EVM chain ID is exactly `296`.
- The only proposed operation kind is exactly `ATS_CREATE`.
- The issuer boundary is a human-controlled MetaMask issuer; no server-held
  signer, private key, custody adapter, generic injected provider, or wallet
  fallback is permitted.
- `ATS_CONTROL_LIST`, `ATS_ISSUE`, `ATS_TRANSFER`, and `ATS_COUPON` remain
  outside this decision and must fail closed.
- The immediate successor is local and unsigned only. It must not write an
  enabled M33 manifest entry or invoke an SDK/provider/wallet.
- A later live gate must separately authorize every wallet prompt, ATS SDK
  call, account action, transaction, receipt verification, and deployment.

## Human-supplied immutable configuration

Supply one concrete value for every field below. A blank, `TBD`, alternative,
wildcard, dynamic lookup, or implicit default rejects the packet.

1. **Official SDK identity**
   - exact package name and exact semantic version:
     `[HUMAN SUPPLIED REQUIRED]`
   - immutable source/release reference and compatibility evidence:
     `[HUMAN SUPPLIED REQUIRED]`
   - selected exactly-one creation family (`CreateEquityRequest`/`Equity.create`
     or `CreateBondRequest`/`Bond.create`), exact module/export/method/overload,
     and every required argument type, field ordering, encoding, and forbidden
     default:
     `[HUMAN SUPPLIED REQUIRED]`
   - confirmation that the immediate successor models only the Tool402-owned
     frozen projection and does not import or initialize the package:
     `[HUMAN SUPPLIED REQUIRED]`

2. **Issuer authority**
   - canonical issuer EVM address, `principalPublicId`, role `ISSUER`, and
     expected `authorityVersion`:
     `[HUMAN SUPPLIED REQUIRED]`
   - exact `subjectPublicId`, immutable offering version, and registry revision:
     `[HUMAN SUPPLIED REQUIRED]`
   - explicit ownership predicate and fail-closed behavior for mismatch:
     `[HUMAN SUPPLIED REQUIRED]`

3. **ATS configuration target**
   - canonical factory and resolver identifiers, each with its authoritative
     public source and testnet identity:
     `[HUMAN SUPPLIED REQUIRED]`
   - target kind and exact `expectedTarget` for `ATS_CREATE`:
     `[HUMAN SUPPLIED REQUIRED]`
   - asset kind, name, symbol, decimals, total supply, roles, and every
     immutable creation/configuration parameter:
     `[HUMAN SUPPLIED REQUIRED]`
   - one explicit relationship to the accepted local offering boundaries:
     either the full immutable M20 offering-definition snapshot/digest, its
     nested `terms.version`, and its field-to-asset mapping, or an explicit
     declaration that this testnet-only configuration consumes and implies none
     of those economics:
     `[HUMAN SUPPLIED REQUIRED]`

4. **Command binding**
   - complete closed `operationDescriptor` and `parameters` objects for the
     one `ATS_CREATE` operation:
     `[HUMAN SUPPLIED REQUIRED]`
   - exact RFC8785-JCS/Keccak parameter hash expected by M33:
     `[HUMAN SUPPLIED REQUIRED]`
   - reproducible canonical JCS preimage/hash vector for the complete selected
     descriptor and parameters, including the exact field names and no omitted
     SDK-default field:
     `[HUMAN SUPPLIED REQUIRED]`
   - explicit confirmation that no recipient, amount, holder, list, coupon, or
     operation-instance field remains dynamically selected:
     `[HUMAN SUPPLIED REQUIRED]`

5. **Boundary and future gates**
   - confirmation that the immediate successor remains local/unsigned and
     leaves M33 zero-enabled:
     `APPROVED BY DEFAULT; change only by explicit replacement`
   - explicit authority-provisioning status: the immediate successor creates no
     `commandAuthorities` row, has no M32 durable-admission path, and adds no
     M33 enabled mapping. Any later executable path needs separately: a current
     authorized issuer authority record for M32, a reviewed enabled M33 mapping,
     and a distinct execution gate:
     `[HUMAN SUPPLIED REQUIRED]`
   - separate explicit gate required before SDK/provider execution, MetaMask
     connection, asset creation, compliance admission, transfer, funding,
     transaction, deployment, or live evidence:
     `APPROVED BY DEFAULT; change only by explicit replacement`

## Explicit human declaration

- Decision owner: `[HUMAN SUPPLIED REQUIRED]`
- Decision timestamp: `[HUMAN SUPPLIED REQUIRED]`
- Declaration: `I approve every concrete rule above for exactly one local,
  unsigned ATS_CREATE configuration contract, reject all implicit defaults, and
  do not authorize any provider, wallet, account, funding, payment,
  transaction, deployment, or live action.`

## Root intake checklist

The root may create a successor card only after confirming that every
human-supplied field is concrete, mutually consistent, secret-free, and
fail-closed. The successor must still define its own minimum local
specification, owned paths, RED contract, negative tests, and independent
review plan.
