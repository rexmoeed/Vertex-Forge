<div align="center">

# ⚡ Vertex Forge
### The Cursor-Class AI-First Integrated Development Environment & Autonomous Engineering Studio

[![TypeScript](https://img.shields.io/badge/TypeScript-5.5+-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-19.0-61DAFB?logo=react&logoColor=black)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-6.0+-646CFF?logo=vite&logoColor=white)](https://vitejs.dev/)
[![Electron](https://img.shields.io/badge/Electron-34+-47848F?logo=electron&logoColor=white)](https://www.electronjs.org/)
[![Tests](https://img.shields.io/badge/Tests-590%2F590%20Passing-brightgreen?logo=vitest&logoColor=white)](https://vitest.dev/)
[![Coverage](https://img.shields.io/badge/Coverage-74%25%20Functions-brightgreen?logo=vitest&logoColor=white)](https://vitest.dev/)
[![Type Check](https://img.shields.io/badge/tsc-0%20Errors-brightgreen)](https://www.typescriptlang.org/)
[![Parallel Swarms](https://img.shields.io/badge/Parallel%20Swarms-4%20Engines-cyan)](https://github.com/rexmoeed/Vertex-Forge)
[![Engineering Skills](https://img.shields.io/badge/Engineering%20Skills-33%20Active-purple)](https://github.com/rexmoeed/Vertex-Forge)
[![Local LLMs](https://img.shields.io/badge/Local%20AI-Ollama%20%7C%20DeepSeek-orange)](https://github.com/rexmoeed/Vertex-Forge)
[![Google Jules](https://img.shields.io/badge/Google%20Jules-Cloud%20PR%20Agent-blue?logo=google&logoColor=white)](https://jules.google.com)

*A state-of-the-art, fully autonomous, zero-mock developer workstation uniting real filesystem manipulation, interactive WebSocket PTY terminals, multi-provider BYOK AI orchestration, parallel hierarchical agent swarms, 33 specialized engineering skills, visual mission cockpits, inline ghost-text predictions, vision-to-code synthesis, offline local LLM hubs, Devin-style shadow sandboxes, and enterprise governance gates.*

---

[Key Highlights](#-key-architectural-highlights) • 
[Visual Swarm Cockpit](#-visual-swarm-cockpit--parallel-execution) • 
[Flagship AI Capabilities](#-flagship-ai-capabilities) • 
[Feature Matrix](#-comprehensive-feature-matrix) • 
[Slash Commands (33 Skills)](#-interactive-slash-commands--skills) • 
[Windows Installers](#-desktop-packaging--windows-installers) • 
[Getting Started](#-getting-started) • 
[Shortcuts](#-keyboard-shortcuts)

</div>

---

## 🌟 Key Architectural Highlights

- **Google Jules Cloud Mission Dispatcher**: Dedicated interactive UI modal (`JulesCloudMissionModal.tsx`) providing automated GitHub repository selection, plan formulation review, and background Pull Request creation with real-time cloud activity streams.
- **Zero-Config Local AI Auto-Detection**: One-click concurrent probe across `localhost:11434` (Ollama) and `localhost:1234` (LM Studio) auto-detecting installed models (Llama 3.3, Qwen 2.5 Coder, DeepSeek) for 100% private, offline coding.
- **Native Desktop Terminal Execution (Electron Bridge)**: Real host shell execution on Windows PowerShell and CMD with live bidirectional directory tracking, child process spawning, and ANSI error diagnosis.
- **Universal Side-by-Side Visual Diff Viewer**: Persistent 1-click diff comparison against Git HEAD in the editor header, supporting split-line inspection, hunk navigation, and AI code review.
- **Visual Swarm Cockpit & Live Graph**: Interactive real-time node topology drawer showing live specialist agents, active RWLock file reservations, pulse monitors, and one-click launchpads.
- **Hierarchical Multi-Agent Parallel Swarms**: Decomposes complex software requirements into ordered Directed Acyclic Graph (DAG) task trees executed concurrently across 10 specialized Team Leads with Reader-Writer Lock (`RWLock`) file reservation to eliminate merge deadlocks.
- **Cursor-Grade Inline Ghost-Text Autocomplete**: Monaco Editor inline completions provider supporting Tab-to-Accept, AST heuristics for rapid language pattern predictions, and multi-line speculative completion.
- **Screenshot & Mockup to Component (Vision-to-Code)**: Converts UI screenshots, wireframes, and design mockups into responsive React 19 + TypeScript components with extracted design tokens (colors, typography, radii).
- **100% Offline Local LLMs (Ollama & LM Studio)**: Zero-latency, completely private local AI engine powered by DeepSeek-Coder-V2, Qwen 2.5 Coder, and Llama 3.3 with strict offline Privacy Mode.
- **Devin-Style Shadow Sandbox & Atomic Verification**: Isolates pending mutations in an in-memory virtual staging environment, validates AST syntax, verifies relative import integrity, runs security gates, and performs atomic commits with instant rollback.
- **Zero-Native Dialog Experience**: Chrome-native popups (`showOpenFilePicker`, `showDirectoryPicker`, `window.alert`, `window.confirm`, `window.prompt`) have been permanently replaced by a custom-themed in-app workspace browser with drive navigation, path breadcrumbs, bookmark history, and folder creation.
- **Windows Installable & Portable Packages**: Pre-packaged as a Windows Setup Installer (`Vertex Forge Setup 1.0.0.exe`) and portable single-file executable with cryptographic verification.
- **Google Jules Cloud Agent & Autonomous PRs**: Native integration with Google Jules (`jules.googleapis.com`) allowing developers to trigger asynchronous cloud tasks in sandboxed VMs, approve execution plans, track real-time agent activities, and merge automated GitHub Pull Requests directly from the IDE.
- **BYOK Multi-Provider Hub**: Direct first-class support for **Google Jules**, **Google Gemini (3.8 Flash / 2.5 Pro)**, **Anthropic (Claude 3.7 / 3.5 Sonnet)**, **OpenAI (GPT-4o / o1 / o3-mini)**, **DeepSeek**, **OpenRouter (460+ models)**, and **Local Endpoints (Ollama, LM Studio, vLLM)**.
- **Universal Text Containment & UI Resilience**: Bulletproof layout architecture enforcing flexbox boundary preservation (`min-width: 0`), automated prose word-breaking, and overflow containment across all sidebars, chat bubbles, Omnibar, and modals on any viewport.
- **Real WebSocket PTY Terminals**: Multi-tab terminal driven by background `node-pty` processes streaming raw xterm.js sessions with full interactive shell support (PowerShell, CMD, Git Bash, WSL).
- **Single Source of Truth Theming**: 60+ curated themes (Vertex Forge Dark, VS Code Modern, Dracula, Catppuccin, Monokai, Tokyo Night, Gruvbox) synchronized instantly across CSS variables, Monaco Editor syntax, and xterm ANSI palettes with pre-paint zero-flash injection.
- **Zero-Loss Session Retention & Hot-Exit**: Reopening Vertex Forge instantly restores open files, cursor coordinates, scroll offsets, terminal working directories, active chat contexts, and dirty buffer recovery.
- **Enterprise KOS-Parity Governance**: Complete implementation of all 17 Section E specifications including hardware telemetry, cryptographic API credential vaults, and strict approval workflows.

---

## 🎛️ Visual Swarm Cockpit & Parallel Execution

Vertex Forge features a dedicated visual command center for orchestrating parallel sub-agent swarms with zero file conflicts:

```
                          ┌─────────────────────────────┐
                          │   SWARM COORDINATOR CORE    │
                          │   (Level 1 Lead Planner)    │
                          └──────────────┬──────────────┘
                                         │
                 ┌───────────────────────┼───────────────────────┐
                 │                       │                       │
                 ▼                       ▼                       ▼
    ┌────────────────────────┐  ┌─────────────────┐  ┌────────────────────────┐
    │     BackendLead        │  │   FrontendLead  │  │        QALead          │
    │ ┌────────────────────┐ │  │ ┌─────────────┐ │  │ ┌────────────────────┐ │
    │ │DatabaseSchemaSpec  │ │  │ │ReactCompBldr│ │  │ │ UnitTestWriter      │ │
    │ └────────────────────┘ │  │ └─────────────┘ │  │ └────────────────────┘ │
    │ ┌────────────────────┐ │  └─────────────────┘  │ ┌────────────────────┐ │
    │ │APIEndpointBuilder  │ │                       │ │TestRunnerDiagnost  │ │
    │ └────────────────────┘ │                       │ └────────────────────┘ │
    └────────────────────────┘                       └────────────────────────┘
                 │                       │                       │
                 ▼                       ▼                       ▼
    ┌────────────────────────┐  ┌─────────────────┐  ┌────────────────────────┐
    │ models/billing.model.ts│  │BillingView.tsx  │  │ billing.spec.ts        │
    │ [RWLock: Excl Write]   │  │ [RWLock: Excl]  │  │ [RWLock: Excl Write]   │
    └────────────────────────┘  └─────────────────┘  └────────────────────────┘
```

### The 4 Autonomous Parallel Swarms

| Swarm | Role Specializations | Execution Model | Slash Command |
|---|---|---|---|
| **1. Feature-Slicing Swarm** | `DatabaseSchemaSpecialist`, `APIEndpointBuilder`, `ReactComponentBuilder`, `UnitTestWriter` | 4 Concurrent Threads with zero file lock overlap | `/swarm-feature` |
| **2. Continuous Background Guardians** | `TypeLintSentry`, `SecretLeakSniffer`, `PerfLeakWatcher` | Silent parallel watchdogs auditing AST, tokens, & memory | `/swarm-guard` |
| **3. Self-Healing Test & Patch Swarm** | `TestRunnerDiagnostician`, `PatchSynthesizer` | Devin-style RCA diagnosis ➔ minimal AST surgical patch | `/swarm-heal` |
| **4. Doc & Environment Sync Swarm** | `DocSyncAgent`, `EnvSyncAgent` | Concurrent updates to README, TSDoc, and `.env.example` | `/swarm-sync` |

---

## 🚀 Flagship AI Capabilities

### 1. 👻 Inline Ghost-Text Speculative Autocomplete
Cursor/Copilot-style predictive code generation rendered directly inside Monaco Editor:
- **Instant Ast Heuristics**: Sub-10ms pattern recognition for TypeScript interfaces, React `useState`/`useEffect` hooks, `try-catch` structures, and async arrow functions.
- **DeepSeek Speculative Generation**: Automatically queries local or cloud models for multi-line block completions ahead of your cursor.
- **Tab-to-Accept**: Press `Tab` to accept full suggestions, `Escape` to dismiss, with live acceptance rate analytics.

### 2. 📸 Screenshot & Mockup to Component (Vision-to-Code)
Turn any UI design into working code in seconds:
- **Design Token Extraction**: Automatically extracts color palettes, surface tones, typography hierarchies, and border radii.
- **Clean React 19 Generation**: Emits clean, accessible TypeScript components with typed props and companion CSS variables.
- **Virtual File System Integration**: Automatically registers synthesized files in your project with zero manual copy-pasting.

### 3. 🦙 100% Offline Local LLMs (Ollama & LM Studio)
Run state-of-the-art coding intelligence locally on your hardware:
- **Auto-Detection & Healthchecks**: Automatically polls `localhost:11434` (Ollama) and `localhost:1234` (LM Studio).
- **Model Support**: First-class support for `deepseek-coder-v2`, `qwen2.5-coder`, `llama3.3`, `codellama`, and `starcoder2`.
- **Strict Privacy Mode**: Toggle on Privacy Mode to guarantee zero packets leave your local machine.

### 4. 🧪 Shadow Sandbox Auto-Verification (Devin-Style)
Zero-risk agent code generation that never leaves your build broken:
- **Virtual Staging**: File additions and edits are staged inside an in-memory virtual clone of your workspace.
- **Multi-Stage Automated Gates**: Validates curly brace balancing, AST syntax, and resolves relative import targets before saving.
- **Security Interceptors**: Blocks accidental tampering with `.env`, private keys, and credential stores.
- **Atomic Commits & Instant Rollback**: Changes are only merged into your real workspace once 100% verified.

---

## ⚡ Interactive Slash Commands & Skills

Vertex Forge includes **33 specialized autonomous engineering skills** invokable via natural language or slash commands:

<details>
<summary><b>👉 Click to expand full 33-Skills Directory & Slash Commands</b></summary>

| Command | Skill ID | Specialty |
|---|---|---|
| `/swarm-feature` | `swarm-feature-slicing` | 4-tier parallel feature slicing (DB, API, UI, Tests) |
| `/swarm-guard` | `swarm-background-guardians` | Continuous TypeLint, SecretLeak, and PerfLeak watchdogs |
| `/swarm-heal` | `swarm-self-healing` | Autonomous test diagnosis and surgical patch synthesis |
| `/swarm-sync` | `swarm-doc-env-sync` | Synchronize README, TSDoc, OpenAPI, and `.env.example` |
| `/review` | `code-review` | Static security, OWASP Top 10, performance audit |
| `/refactor` | `refactor-clean` | Clean code, SOLID principles, cyclomatic complexity reduction |
| `/test` | `unit-test-gen` | Formulate comprehensive Vitest / Jest test suites |
| `/explain` | `explain-code` | Deep code explanation with architecture & flow diagrams |
| `/optimize` | `perf-optimize` | Memory profiling, bundle sizing, O(N) algorithmic improvements |
| `/security` | `security-audit` | Penetration review, secret detection, dependency CVE scan |
| `/debug` | `debug-investigate` | Diagnostic stack trace analysis and root-cause isolation |
| `/doc` | `doc-writer` | Technical documentation, markdown guides, TSDoc specs |
| `/git` | `git-assistant` | Conventional commits, PR preparation, interactive rebase |
| `/types` | `ts-type-wizard` | Strict TypeScript types, generics, discriminated unions |
| `/api` | `api-scaffolding` | REST / GraphQL / tRPC router endpoints with Zod schemas |
| `/docker` | `docker-devops` | Multi-stage Dockerfiles, Docker Compose, CI/CD pipelines |
| `/css` | `css-styling-pro` | Responsive design tokens, Tailwind, Vanilla CSS glassmorphism |
| `/db` | `db-migration` | Prisma, Drizzle, SQL migrations and schema optimization |
| `/accessibility` | `a11y-audit` | WCAG 2.1 AA compliance, ARIA attributes, keyboard navigation |
| `/ai` | `ai-prompt-eng` | System prompts, structured JSON schemas, few-shot templates |
| `/regex` | `regex-generator` | Safe, performant regular expressions with test cases |
| `/deploy` | `deploy-advisor` | Production readiness, edge functions, serverless hosting |
| `/state` | `state-architect` | Redux Toolkit, Zustand, React Context state orchestration |
| `/i18n` | `i18n-localization`| Multi-language translations, RTL support, ICU formats |
| `/microservice` | `microservice-architect`| Distributed systems, event sourcing, gRPC contracts |
| `/k8s` | `kubernetes-operator`| K8s manifests, Helm charts, ingress, horizontal pod autoscalers |
| `/graphql` | `graphql-expert` | GraphQL schemas, resolvers, DataLoader N+1 mitigations |
| `/electron` | `electron-specialist`| Secure IPC bridge protocols, desktop packaging, native addons |
| `/appstore` | `mobile-app-distributor`| Fastlane lanes, TestFlight, Google Play Console release checks |
| `/deps` | `dependency-guard` | Outdated package audits, breaking changes, license compliance |
| `/mock` | `mock-data-generator` | Realistic test fixtures, Faker schemas, MSW mock handlers |
| `/bench` | `performance-benchmarker`| Benchmark.js latency tests, throughput, ops/sec telemetry |
| `/design-system`| `design-system-curator`| Token governance, atomic component libraries, Storybook |

</details>

---

## 💻 Comprehensive Feature Matrix

| Subsystem | Module | Description |
|---|---|---|
| **Autonomous Swarms** | `agentHierarchyService.ts` | 4 concurrent swarms with DAG task dependencies and RWLock file reservations. |
| **Swarm Cockpit** | `SwarmMissionCockpit.tsx` | Visual node topology drawer with live status pulses and one-click launchpad. |
| **Inline Autocomplete**| `ghostAutocompleteService.ts` | Predictive inline ghost-text with Tab-to-accept and AST pattern heuristics. |
| **Vision Engine** | `visionToComponentService.ts` | Screenshot and wireframe to React 19 + TypeScript component synthesis. |
| **Offline Local AI** | `localLLMService.ts` | Native Ollama and LM Studio integration with DeepSeek-Coder and Privacy Mode. |
| **Shadow Sandbox** | `shadowSandboxService.ts` | Devin-style virtual staging, import validation, and atomic commits. |
| **Workspace Browser** | `WorkspaceOpenModal.tsx` | Native dialog replacement with physical drive browsing and folder creation. |
| **Desktop Bridge** | `desktopBridge.ts` | Dual-mode desktop integration (Electron IPC + HTTP REST fallback). |
| **Virtual File System**| `virtualFs.ts` | In-memory VFS with reactive watchers and git diff staging. |
| **Multi-Provider Hub** | `aiProviderService.ts` | BYOK integration with Google Jules, Claude 3.7, Gemini 3.8 Flash, GPT-4o, and DeepSeek. |
| **Google Jules Cloud** | `julesService.ts` | Asynchronous cloud coding missions, GitHub sources, plan sign-offs & PR workflows. |
| **PTY Terminal** | `TerminalDock.tsx` | Real interactive terminal streaming raw xterm.js sessions via `node-pty`. |
| **Security Vault** | `credentialVaultService.ts` | Cryptographic AES-256-GCM vault with automatic memory zeroization. |
| **Live Debugger** | `debuggerEngine.ts` | Breakpoints, call-stack inspection, variable evaluation, and watchpoints. |

---

## 📦 Desktop Packaging & Windows Installers

Vertex Forge compiles natively to standalone Windows installers and single-file portable packages:

```bash
# Package Windows setup installer and portable executable
npm run electron:build
```

**Build Artifacts (in `release/`):**
- `release/Vertex Forge Setup 1.0.0.exe` (Full NSIS Installer with desktop shortcuts)
- `release/Vertex Forge 1.0.0.exe` (Single-file portable executable)
- `release/latest.yml` (Auto-update cryptographic hash manifest)

---

## ⌨️ Keyboard Shortcuts

Access all shortcuts inside the IDE anytime by pressing `F1` or opening the interactive **Keyboard Shortcuts Modal** (`Cmd/Ctrl + /`):

| Shortcut | Action | Category |
|---|---|---|
| `Tab` | Accept inline ghost-text code prediction | AI & Autocomplete |
| `Cmd/Ctrl + I` | Cursor Composer: Multi-file generation with `@` context | AI & Copilot |
| `Cmd/Ctrl + K` | Cursor Inline Edit: In-editor diff review | AI & Copilot |
| `Cmd/Ctrl + K (Terminal)` | Terminal AI: Natural language shell command synthesis | AI & Copilot |
| `Cmd/Ctrl + P` | Quick-open file across entire workspace | Navigation |
| `Cmd/Ctrl + Shift + F` | Global codebase grep search and replace | Navigation |
| `Cmd/Ctrl + S` | Save active file & snapshot to history | Execution |
| `Cmd/Ctrl + Enter` | Execute autonomous agent task or send prompt | Execution |
| `Cmd/Ctrl + \`` | Toggle integrated terminal & diagnostics dock | Execution |
| `Cmd/Ctrl + Shift + T` | Run all Vitest assertions & unit test suites | Testing |
| `F5 / Shift + F5` | Start / Continue / Stop DAP Debugging session | Debugger |
| `F10 / F11` | Step Over / Step Into current statement | Debugger |
| `Escape` | Dismiss active modal, search, or inline ghost suggestion | Global |

---

## 🏁 Getting Started

### Prerequisites
- **Node.js**: v18.0.0 or higher (v22.x recommended)
- **Git**: Installed and available in system PATH
- **Operating System**: Windows 10/11, macOS, or Linux

### Quick Start (Web Development Mode)

```bash
# 1. Clone repository
git clone https://github.com/rexmoeed/Vertex-Forge.git
cd Vertex-Forge-main

# 2. Install dependencies
npm install

# 3. Launch local development server
npm run dev
```

Visit `http://localhost:3000` in your browser.

---

### 🐳 Docker & Containerized Running

Run Vertex Forge in a completely isolated container without requiring any local dependencies:

```bash
# Build the production Docker image
docker build -t vertex-forge .

# Run the containerized IDE
docker run -d -p 3000:3000 --name vertex-forge-app vertex-forge
```

Open `http://localhost:3000` to interact with the containerized studio.
Vertex Forge also ships with `.devcontainer` configuration for instantaneous zero-install development in VS Code or GitHub Codespaces.

---

### ⚙️ Environment Configuration

Copy `.env.example` to `.env` to configure runtime options:

| Variable | Requirement | Default | Description & Observability Purpose |
|:---|:---:|:---|:---|
| `PORT` | Optional | `3000` | Port for Express HTTP server, WebSocket bridge & static asset host |
| `NODE_ENV` | Optional | `development` | Runtime operational mode (`development`, `production`, or `test`) |
| `DISABLE_HMR` | Optional | `false` | Disable Vite Hot Module Reloading when running in constrained headless containers |
| `VITE_API_URL` | Optional | `http://localhost:3000` | Client API destination gateway used by frontend fetch clients |
| `VITE_DEV_SERVER_URL` | Optional | `http://localhost:5173` | Internal dev server link for Vite client development proxy |
| `APP_URL` | Optional | `http://localhost:3000` | Public origin URL used for OAuth redirects and self-referential links |
| `API_KEY` | Optional | *(None)* | Generic AI provider or upstream gateway authentication token |
| `GEMINI_API_KEY` | Optional | *(None)* | Google Gemini AI token (offline/local Ollama & DeepSeek models operate without it) |
| `JULES_API_KEY` | Optional | *(None)* | Google Jules Cloud Agent token for autonomous missions, VM tasks & GitHub PRs |
| `GITHUB_TOKEN` | Optional | *(None)* | GitHub Personal Access Token for remote repository sync, branch pushing & PR creation |

---

### Desktop App (Electron)

```bash
# Run desktop app locally in development mode
npm run electron

# Package Windows NSIS setup installer & portable executable (.exe)
npm run electron:build
```

---

### Verification & Quality Assurance

```bash
# Run complete test suite (513 tests across 69 test suites (100% passing, coverage enforced))
npm test

# Verify TypeScript type integrity (0 errors)
npx tsc --noEmit

# Compile production web bundle
npm run build
```


---

<div align="center">
Built with ❤️ for developers who demand real tools, zero simulated answers, and uncompromising autonomous AI engineering control.
</div>
