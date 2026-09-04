# Runtime worktree policy

After G0, standing non-destructive consent permits the root to create a clean worktree only for a dependency-satisfied local module:

~~~
worktree: .worktrees/<module>
branch:   work/<module>
~~~

The root records owned paths, resources, implementer, and reviewer. Tasks in one module worktree are sequential commits; concurrent work must use disjoint module roots. The root integrates one accepted item at a time.

No consent covers funded/external actions, force-reset, history rewriting, discarding work, or destructive worktree cleanup. Before removal, pruning, or switching an existing worktree, obtain explicit human confirmation and summarize affected local changes.
