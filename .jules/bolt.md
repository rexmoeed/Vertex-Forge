
## 2024-05-18 - Memoizing Filter Computations Reading From LocalStorage
**Learning:** In Vertex Forge, methods like `AIProviderService.filterModels` synchronously read all items from `localStorage` under the hood (`loadProviders()`). Calling these directly in render bodies (especially with frequently changing inputs like search queries) causes severe UI lag since `localStorage` operations block the main thread.
**Action:** Always wrap heavy data transformations that involve disk/localStorage reads or deep filtering of lists in `useMemo`, ensuring dependencies are correctly listed so it only runs when inputs actually change.
