## 2024-05-23 - Memoizing global service calls in React components
**Learning:** In Vertex Forge React components, heavy data transformations, list filtering, and methods that synchronously read from localStorage (like AIProviderService.filterModels) should always be wrapped in useMemo to prevent severe UI lag on renders.
**Action:** Wrap AIProviderService.filterModels in useMemo in AIProviderHubView, since it currently executes synchronously on every keystroke and render, reading from localStorage and filtering models.
