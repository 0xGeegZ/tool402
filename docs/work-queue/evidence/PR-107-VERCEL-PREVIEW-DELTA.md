# #100 / #107 Vercel Preview delta

## Observed deployment records

| Commit | GitHub deployment | Environment | Vercel status | Public result |
| --- | --- | --- | --- | --- |
| #100 \`f0505cc0bc828f0deb0a655605040aa01ada6ef2\` | \`6411275602\` | \`Preview\` | success | \`tool402-15a9ak4nc-indyweb.vercel.app\` |
| #107 \`6eb9d29b11e519e9d4d8f53cbddc60a0138a2b96\` | \`6411320761\` | \`Preview\` | failure | \`tool402-gaqai6sqg-indyweb.vercel.app\` |

Both records were created by \`vercel[bot]\`, are non-production \`Preview\`
deployments, use task \`deploy\`, and have an empty GitHub deployment payload.
Both Vercel target URLs are under \`indyweb/tool402\`, so visible evidence
supports the same Vercel project namespace. The repository contains neither a
\`vercel.json\` nor tracked \`.vercel/project.json\`; both commits retain the same
root build script. GitHub's deployment record does not expose Vercel Preview
environment values or Convex deployment target.

## Diagnosis

The failing record says only “Deployment has failed” and directs an authorized
operator to inspect \`dpl_5MbEG8ujd33WoiYCiEG74jDmPPkZ --logs\`. It does not name
Convex or an authorization error. Therefore a Convex permission failure is not
established, and widening any permission would be unjustified.

The subsequent \`7e1d408a5968a5d2843daf0b5e5b42ecaf1df8c1\` retrigger has a
successful Vercel Preview check. This demonstrates that the original failure
did not persist across the retrigger, but it does not reveal its cause or prove
runtime/Convex equivalence.

## Minimal Human Ops log comparison

An authorized Vercel project member should compare only these fields for the
two deployment IDs, without copying secrets:

1. project ID/name, git commit, production flag, build command, Node version,
   root directory, and install command;
2. names and scopes (not values) of Preview variables used by the web app,
   including Convex deployment/URL and server x402 variables;
3. the first failing build/runtime log line for \`dpl_5MbEG8ujd33WoiYCiEG74jDmPPkZ\`;
4. the corresponding successful stage for the retrigger; and
5. whether the deployed web build points at the intended Convex deployment by
   a harmless authenticated/read-only runtime check.

Stop the comparison if it would disclose an environment value. Select a fix
from the first real delta; never grant broader Convex rights speculatively.
