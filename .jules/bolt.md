## 2024-05-16 - Splitter Component Optimization
**Learning:** The Splitter component in `src/components/layout/Splitter.tsx` is an interactive UI element used multiple times in the main layout (`App.tsx` and `EditorArea.tsx`). It causes unnecessary re-renders in its parent components or itself when layout state changes.
**Action:** Wrap the `Splitter` component in `React.memo()`. This prevents the `Splitter` from re-rendering unless its props actually change.
