## 2025-01-30 - Memoize filterModels to prevent UI lag on renders
**Learning:** Heavy data transformations, list filtering, and methods that synchronously read from localStorage (like AIProviderService.filterModels) should always be wrapped in useMemo to prevent severe UI lag on renders. Do not include React state variables (such as providers) in the dependency array unless they are explicitly referenced inside the callback to avoid react-hooks/exhaustive-deps linting errors.
**Action:** Always wrap filterModels and other expensive calculations in useMemo.
