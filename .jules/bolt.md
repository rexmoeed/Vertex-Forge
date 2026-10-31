
## 2026-10-31 - [Memoizing Code Evolution Filter]
**Learning:** Found a performance bottleneck in `CodeEvolutionView` where filtering a potentially large list of commits caused expensive string operations and re-evaluations during every React render, largely because `.toLowerCase()` on the search string was being executed up to three times *per item*.
**Action:** Always extract invariant properties (like `searchFilter.toLowerCase()`) outside of array map/filter loops to avoid repeated string creation, and wrap complex list derivations in `useMemo` to prevent unnecessary operations across renders.
