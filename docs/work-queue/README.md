# Runtime queue

This queue is the sole runtime authority. Move only dependency-satisfied local cards/slices into 10-ready; the root owns all movement. New runtime tasks begin in 00-inbox.

The committed state directories are 00-inbox, 10-ready, 20-active, 30-task-review, 40-module-review, 50-blocked, 60-done, and 90-cancelled. The local TASK-CATALOG.md lists only cards actually committed in this repository.
