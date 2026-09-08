# S11-T010 RED review

## Scope

Independent review of the durable RED contract at source commit
`acb2ba340d3893957224e376b8e231ae30b46ee3`:

- [S11 control card](../queue/20-active/S11-T010-guided-demo-narration.md)
- [UI-S11 manifest](../../ui/UI-S11.md)
- [focused S11 contract](../../../apps/web/tests/guided-demo-route.test.mjs)

## Observed RED

Under Node 22.21.1, the focused contract fails exactly once because the
declared page and guided-step component are absent. Its four GREEN assertions
skip while both paths remain absent. No secondary failure or test syntax error
occurs.

## Established contract

- It fixes one server page with one `main`, one `h1`, and a named
  `GuidedDemoSteps` composition point.
- It fixes the nine manifest rows in order, one local Next `Link` source form,
  and a normal mapped rendering shape with either one or two callback
  parameters.
- It preserves exactly Home, Explore, Workspace, and the reserved Demo local
  navigation entries, and requires the existing navigation guard to allow only
  those four hrefs.
- It rejects client, network, storage, configuration, analytics, external-link,
  and unsupported authority or outcome copy in the two future route sources.

## Verdict

CLEAR — the durable RED contract is accepted. It authorizes only
`apps/web/src/app/demo/page.tsx`,
`apps/web/src/components/demo/guided-demo-steps.tsx`, and the reserved local
navigation/assertion pair in
`apps/web/src/components/discovery/local-navigation.tsx` and
`apps/web/tests/landing-explore.test.mjs`. It grants no client behavior, data
access, configuration, identity/provider/payment surface, narration recording,
deployment, or submission authority.
