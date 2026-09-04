# Runtime review policy

Each local card receives an independent task review against its local card, local specification, owned paths, tests, negative cases, and evidence. The root, not the implementer, accepts findings and updates queue state.

At each module boundary, record MODULE_BASE and MODULE_HEAD, run the module code-review convergence loop, fix valid Critical/Important findings with the card TDD contract, and obtain two consecutive fresh clean review generations. Production-code changes reset the clean-generation count.

Static checks never replace browser, live-testnet, sponsor, eligibility, or human-approval evidence. Reviewers do not mutate production code or queue state; they return a report to the root.

A human may expressly cap review iterations for one named local card. The root records that exception in the card and decision ledger; it is not represented as a clean review generation and does not waive any separate human-only authority.
