## 2024-05-24 - Memoizing complex list transformations in Vertex Forge
**Learning:** In Vertex Forge React components, heavy list transformations (`filter`, `flatMap`) on complex, frequently updated state arrays (like code evolution commits or provider models) cause noticeable render lag when they run on every render.
**Action:** Always wrap these operations in `useMemo` with minimal dependency arrays to ensure they only re-run when the specific input criteria changes. Move repetitive operations (like `.toLowerCase()`) outside of loops to minimize redundant object creation.
