# M46-T040 specification module review

## Scope

Fresh independent specification review of source commit
`3ab20483452174931bae0575d2331fa42c999dce` against the M46-T040 local
contract and compatibility amendment.

## Review

- `buildToolDirectory` emits the exact default v2 order: RiskScan first and
  EntityCheck second, while retaining the separate M45 projection branch.
- The EntityCheck descriptor uses the exact fixed capability fields and
  obtains only the permitted parsed summary from the existing x402 parser.
  Missing or malformed input yields `configuration_required`.
- The RiskScan decoder retains the strict legacy v1 branch and requires the
  complete ordered v2 pair before returning a cloned RiskScan selection. It
  does not select or execute EntityCheck.
- The range introduces no second Directory endpoint, active-directory metadata
  in the default body, retry, I/O, configuration default, or live claim.

## Verdict

CLEAR — the implementation matches the committed M46-T040 behavioral
authority.
