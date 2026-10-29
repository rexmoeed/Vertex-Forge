
## 2023-11-09 - [Performance] Memoize heavy list transformations and extract string creations
**Learning:** In React components like CodeEvolutionView, heavy list transformations (`filter`, `flatMap`) on complex, frequently updated state arrays (like code evolution commits) can cause rendering lag if re-calculated on every render, especially when searching. Doing string creation (like `.toLowerCase()`) inside `.filter()` loops creates unnecessary memory allocations.
**Action:** Always wrap heavy data-filtering logic in `useMemo` in Vertex Forge React components, and always move repetitive operations (like `.toLowerCase()`) outside of loops to minimize redundant object creation.
