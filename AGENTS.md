# Autonomous Agent Guidelines (AGENTS.md)

Welcome to **Vertex Forge**, a production-grade autonomous AI software engineering studio built with React 19, TypeScript, Vite, Express, and Vitest.

This document guides autonomous AI agents (such as **Google Jules**, Cursor Agent, and background coding assistants) on how to understand, build, test, and contribute to this repository.

---

## 1. Quick Reference Commands

All agents must use the following commands to install dependencies, verify types, and run the test suite:

| Action | Command | Notes |
|:---|:---|:---|
| **Install Dependencies** | `npm install` | Always install before building or running tests. |
| **Typecheck & Lint** | `npm run lint` | Runs `tsc --noEmit`. Must exit with **code 0** (0 errors). |
| **Run Unit & Integration Tests** | `npm test` | Runs `vitest run`. All 16 suites / 285+ tests must pass. |
| **Production Build** | `npm run build` | Builds client distribution with Vite into `dist/`. |
| **Start Dev Server** | `npm run dev` | Boots Express backend + Vite dev server on port 3000. |

---

## 2. Architecture & Directory Layout

- **`src/components/layout/`**: Core IDE workbench panels:
  - `TopMenuBar.tsx`: Unified top menu bar with command categories (`File`, `Edit`, `Selection`, `View`, `Go`, `Run`, `Terminal`, `Agent / AI`, `Help`), workspace pill, and omnibar search.
  - `Sidebar.tsx`: Primary activity sidebar (Explorer, Search, Git, Tests, Extensions, Problems).
  - `EditorArea.tsx`: Multi-tab code editor, syntax hints, ghost autocomplete, inline AI bar, and breakpoint gutter.
  - `BottomPanel.tsx`: Dockable terminal, vitest runner, diagnostics, and background job monitor.
  - `AIOrchestratorPanel.tsx`: Right-side AI agent chat, reasoning traces, and multi-agent swarm activity.
- **`src/context/`**: State management:
  - `IDEContext.tsx`: Core IDE workspace state, file system operations, project profiles, git status, and test runners.
  - `LayoutContext.tsx`: Panel dimensions, presets, visibility, and panel focus management.
  - `ThemeContext.tsx`: Theme tokens (Obsidian, Light, Cyberpunk, Titanium, etc.).
- **`src/services/`**: Core backend logic and client services:
  - `virtualFs.ts`: In-memory and disk-synced Virtual File System.
  - `credentialVaultService.ts`: Secure local credentials and key management.
  - `testEngine.ts`: Automated test discovery and self-repair loop.
  - `gitService.ts` / `gitWorkflow.ts`: Git branching, staging, diffing, and commits.
  - `aiProviderService.ts`: Multi-provider LLM gateway (Gemini, Claude, OpenAI, DeepSeek, Local Ollama).
- **`src/services/__tests__/`**: 16 comprehensive Vitest test suites (285+ tests).
- **`server.ts`**: Express backend server for terminal execution, local process management, and API proxying.

---

## 3. Strict Engineering & Contribution Rules

1. **Test Verification is Mandatory**:
   - Any new feature or bug fix must include corresponding tests in `src/services/__tests__/`.
   - Before submitting changes or creating a Pull Request, always run:
     ```bash
     npm run lint
     npm test
     ```
   - Both commands must succeed with exit code 0.

2. **Brand & Identity Integrity**:
   - The studio name is strictly **Vertex Forge** (or `VertexForge` / `vertex-forge`).
   - Never introduce references to legacy project names.

3. **Storage & Local State**:
   - Local storage keys must use the `vertex_` or `vertexforge_` prefix (e.g. `vertexforge_autosave`, `vertex_forge_layout_config_v2`).

4. **Layout Context Types**:
   - Valid targets for `layout.focusPanel` are:
     `'editor' | 'primarySidebar' | 'secondarySidebar' | 'terminal' | 'preview' | 'ai'`
   - Do not pass non-existent identifiers like `'bottomPanel'`.

5. **Security & Secrets**:
   - Never commit sensitive real API keys or personal access tokens.
   - Use mock tokens or synthetic secrets for test fixtures.
