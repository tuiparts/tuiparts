---
"@tuiparts/core": patch
---

Share one internal roving-collection engine between RadioGroup and
ToggleGroup. Both Stores keep their public interfaces and selection semantics
while item registration, availability, rendered ordering, tab-stop
reconciliation, and re-entrant mutation queuing now live in a single audited
implementation, and collection refreshes no longer publish no-op snapshots.
