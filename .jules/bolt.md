## 2024-05-18 - [Memoize AIProviderService.filterModels]
**Learning:** Methods that synchronously read from localStorage (like AIProviderService.filterModels) cause severe UI lag if not memoized, as they trigger IO and parsing on every render.
**Action:** Always wrap heavy data transformations and localStorage reads in useMemo.
