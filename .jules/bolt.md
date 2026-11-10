## 2024-05-25 - Prevented UI Lag With Search Debouncing
**Learning:** Using `useMemo` on a search filtering function is not enough if the dependency is bound directly to an input state variable (like `catalogQuery`), because it still runs on every single keystroke.
**Action:** When filtering models based on text input, introduce a debounced state variable and depend on that for `useMemo` to effectively prevent blocking the main thread during typing.
