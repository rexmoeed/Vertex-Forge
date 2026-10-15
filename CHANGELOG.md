# Changelog

All notable changes to Vertex Forge will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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
