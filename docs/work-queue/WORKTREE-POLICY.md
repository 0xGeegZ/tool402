# Runtime worktree policy

After G0, root-owned queue controls remain in the current workspace. Do not create or move work into a Git worktree unless the human explicitly requests isolated worktree use. If that request is made for a dependency-satisfied local module, use:

~~~
worktree: .worktrees/<module>
branch:   work/<module>
~~~

The root records owned paths, resources, implementer, and reviewer. Tasks in one approved module worktree are sequential commits; concurrent work must use disjoint module roots. The root integrates one accepted item at a time.

No consent covers funded/external actions, force-reset, history rewriting, discarding work, or destructive worktree cleanup. Before removal, pruning, or switching an existing worktree, obtain explicit human confirmation and summarize affected local changes.
