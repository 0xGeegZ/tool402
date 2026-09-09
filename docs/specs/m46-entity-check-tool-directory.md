# M46 EntityCheck Tool Directory descriptor contract

## Delivery boundary

This contract adds a second static descriptor to the accepted machine-readable
Tool Directory at `GET /api/tools`: the EntityCheck France tool. It reuses the
accepted directory response shape, the `cache-control: no-store` rule, the
request-time environment read, and the fail-closed configuration summary. It
registers nothing externally, reads no source, initiates no payment, and
proves no live availability.

## Descriptor

A new server-only module `apps/web/src/lib/entity-check-tool-descriptor.ts`
builds one descriptor from an explicit `NodeJS.ProcessEnv`:

```ts
{
  id: "entitycheck.fr",
  name: "EntityCheck France",
  request: { method: "POST", path: "/api/entitycheck", contentType: "application/json" },
  input: {
    type: "object",
    required: ["requestRef", "jurisdiction", "query"],
    properties: {
      requestRef: { type: "string", minLength: 1, maxLength: 96 },
      jurisdiction: { type: "string", enum: ["FR"] },
      query: { type: "string", minLength: 1, maxLength: 160 },
      registrationNumber: { type: "string", pattern: "^[0-9]{9}$" },
    },
    additionalProperties: false,
  },
  result: {
    dispositions: ["found", "ambiguous", "not_found"],
    sanctionsScreen: ["clear", "hit", "not_screened"],
  },
  sources: ["FR_RECHERCHE_ENTREPRISES", "OFAC_SDN"],
  limitations: [/* the exact core baseline limitation */],
  configuration: /* the accepted summary shape, from the ENTITYCHECK_X402 parser */,
}
```

The configuration summary is derived only from the shared x402 configuration
parser under the `ENTITYCHECK_X402` prefix, exactly as the RiskScan descriptor
derives its summary from the `RISKSCAN_X402` prefix. It never serialises a
private environment value.

## Directory amendment

`buildToolDirectory` returns `tools` with the RiskScan descriptor first and the
EntityCheck descriptor second. The `version` literal, route registration, and
every RiskScan descriptor field are unchanged. The M45 active-directory view,
when accepted before this card, applies to the RiskScan descriptor only, as
M45 specifies; this card adds no active view for EntityCheck.

## Acceptance evidence

- Tests prove the exact EntityCheck descriptor, its fail-closed configuration
  summary for missing or malformed `ENTITYCHECK_X402` values, and that no
  private value is serialised.
- The accepted directory tests are amended only where they count descriptors
  or assert the exact tool list, and they prove the RiskScan descriptor is
  unchanged.
- Tests prove the directory still builds without network, clock, or random
  calls.
- Web typecheck, test, lint, production build, local-reference guard, and
  independent review pass.
