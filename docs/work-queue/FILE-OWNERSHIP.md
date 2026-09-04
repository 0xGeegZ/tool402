# Runtime file and resource ownership

CP-S00 reserves docs/work-queue, AI_USAGE.md, generated files, and lockfiles to the root integrator. Local task cards declare owned paths and resource locks before entering 10-ready.

Two active implementation cards must have disjoint owned paths and resource boundaries. Shared-file work is an explicit root integration reservation. Wallets, credentials, funded accounts, partner configuration, and deployments remain human-controlled resources; no card or agent infers authority over them.
