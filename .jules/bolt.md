## 2026-10-25 - Memoize frequently updated filtered lists
**Learning:** In Vertex Forge components that manage complex state arrays like code evolution commits, inline `filter` methods inside the render loop can cause significant lag as they recalculate thousands of elements on every generic re-render.
**Action:** Always wrap heavy list transformations (`filter`, `flatMap`, etc.) inside `useMemo` and carefully track their dependency arrays to ensure rapid component updates and responsiveness.
