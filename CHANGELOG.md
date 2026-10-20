# Changelog

All notable changes to Vertex Forge will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.1.0] - 2026-10-20

### Added
- **Structured Logging Framework**: High-performance structured logger (`src/services/logger.ts`) featuring log levels, in-memory history ring buffers, subscriber event channels, and explicit error cause preservation.
- **Component & Integration Testing**: Added testing-library integration suite (`src/components/__tests__/OrchestratorComponents.test.tsx`) asserting real UI rendering, model selection, and autonomous progress flows.
- **Automated Dependency Updates**: Configured `.github/dependabot.yml` for automated weekly npm ecosystem maintenance.
- **Container Orchestration**: Added root `docker-compose.yml` for one-command isolated container deployment alongside `Dockerfile` and `devcontainer`.

### Refactored
- **Monolith Server Decomposition**: Modularized 3,487-line `server.ts` into a clean 69-line bootstrap entrypoint with layered routers under `server/routes/` and Express factory in `server/app.ts`.
- **AI Orchestrator Decomposition**: Extracted `ModelSelectorBar.tsx`, `AutonomousProgressCard.tsx`, and `OrchestratorModals.tsx` into `src/components/layout/orchestrator/`, reducing panel complexity by over 550 lines.
- **Domain Context Separation**: Extracted dedicated, self-contained `FileSystemContext.tsx` and `DebuggerContext.tsx` under `src/context/` with comprehensive unit tests.

### Security & Quality Gates
- **API Boundary Input Validation**: Implemented typed schema middleware (`server/middleware/validation.ts`) rejecting malformed payloads and null-byte path traversal attempts.
- **Automated High-Severity Audit**: Enforced `npm audit --audit-level=high` as a mandatory gate in CI pipeline.
- **Vitest Coverage Thresholds**: Enforced automated code coverage gates via `@vitest/coverage-v8` across 312 tests in 22 test suites.
- **Stable TypeScript Pinning**: Updated compiler to official stable `typescript@^5.8.2` and configured ESLint 9 flat configuration.

## [1.0.0] - 2026-10-15

### Added
- **Visual Swarm Cockpit & Live Graph**: Interactive real-time DAG task orchestration visualizer, execution timeline, and node telemetry for multi-agent workflows.
- **Inline Ghost-Text Autocomplete**: Context-aware low-latency Tab-to-accept inline code suggestions engine.
- **Vision to Component Generator**: Direct screenshot and mockup to fully responsive, production-ready React component synthesizer.
- **Local LLM & Offline Provider Integration**: First-class support for Ollama, DeepSeek-Coder, and local API inference endpoints.
- **Devin-Style Shadow Sandbox & Atomic Verification**: AST syntax validation, import path graph checks, security gate verification, and atomic disk commits with rollbacks.
- **CI/CD Pipeline**: GitHub Actions automated workflow for continuous integration (`.github/workflows/ci.yml`), running TypeScript type-checking, Vitest suite, and production build.
- **Containerization & DevContainers**: Multi-stage production `Dockerfile`, `.dockerignore`, and `.devcontainer/devcontainer.json`.
- **Packaging**: Windows NSIS setup installer and portable single-file executable.

### Security
- Isolated test secret fixtures to dedicated test harness to eliminate scanner false-positives.
- Eliminated runtime `.env` plaintext disk persistence; all credentials securely retained in runtime memory.

### Documentation
- Comprehensive `.env.example` including runtime ports, API targets, and offline configuration.
- Detailed developer contribution guidelines (`CONTRIBUTING.md`).
