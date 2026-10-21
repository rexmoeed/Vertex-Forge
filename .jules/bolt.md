## 2024-05-15 - React Render Optimization in Recursive File Tree
**Learning:** In deeply nested React structures like the Sidebar's `renderTree`, checking array inclusion (e.g., `modifiedFiles.some(...)`) on every node causes an O(N * M) performance bottleneck where N is file tree size and M is number of modified files.
**Action:** When rendering a recursive tree or list, always memoize inclusion checks by converting arrays to a `Set` or `Map` using `React.useMemo` beforehand. This turns the rendering check into O(1) lookup, making the whole pass O(N + M).
