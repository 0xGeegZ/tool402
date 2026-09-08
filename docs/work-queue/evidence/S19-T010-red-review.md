# S19-T010 RED review

## Scope

Independent review of the durable RED contract at source commit
`e628ab21c4bece821b128d5baea4a6b6e4338a70`:

- [S19 control card](../queue/60-done/S19-T010-tool-loop-demo-prefill.md);
- [UI-S19 manifest](../../ui/UI-S19.md); and
- [focused prefill contract](../../../apps/web/tests/tool-loop-demo-prefill.test.mjs).

## Observed RED

Under Node 22.21.1, the focused contract fails exactly once because
`getToolLoopDemoDefaults` is absent. No other source or dependency change is
present, and no secondary test failure occurs.

## Established contract

- only `demo=tool-loop` is a recognized query-state selector;
- absent or unsupported values produce fresh, detached, frozen blank defaults;
- the one selected fixture uses the fixed local values and remains editable;
- the notice is conditional and polite without prescribing visual markup;
- the Guided Demo link carries the exact selector; and
- no alternate URL read, query key, or pre-submit request may enter the form.

## Verdict

CLEAR — the RED contract is accepted. It authorizes only the exact UI-S19
source, package, lockfile, and test targets for the minimal GREEN cycle. No
request, payment, provider, or external behavior is authorized.
