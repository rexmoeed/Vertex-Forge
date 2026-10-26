## 2024-05-15 - React Component Performance
**Learning:** Frequent heavy list transformations (`filter`, `flatMap`) on complex state arrays (like code evolution commits or provider models) can cause significant render lag in this application.
**Action:** Always wrap these transformations in `useMemo` hooks with appropriate dependencies to prevent unnecessary re-evaluations during renders.
