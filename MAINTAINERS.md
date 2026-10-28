# Project Maintainers & Governance (MAINTAINERS.md)

This document outlines the core maintainers and governance policies for the **Vertex Forge** project.

---

## 1. Core Maintainers

| Name | Role | GitHub | Contact | Focus Area |
|:---|:---|:---|:---|:---|
| **Moeed (rexmoeed)** | Project Lead & Core Architect | [@rexmoeed](https://github.com/rexmoeed) | maintainers@vertexforge.dev | Studio Architecture, Multi-Agent Swarms, Electron Shell |
| **Vertex Forge Team** | Security & Release Engineering | [@VertexForgeTeam](https://github.com/rexmoeed/Vertex-Forge) | security@vertexforge.dev | AI Provider Hub, Jules Integration, Test Automation |

---

## 2. Governance Principles

### A. Consensus & Decision Making
- Major architectural changes and protocol updates require consensus from core maintainers documented in `Decision.md` or dedicated RFC issues.
- Pull requests must receive at least 1 approval from a core maintainer before merging.

### B. Contribution & Review Guidelines
- All PRs are required to pass all CI checks:
  1. ESLint (`npm run lint`) with 0 warnings.
  2. TypeScript Typecheck (`tsc --noEmit`) with 0 errors.
  3. Vitest Test Suite (`npm test`) with 100% pass rate.
  4. Production Build (`npm run build`).
  5. Security Audit (`npm run audit`) with 0 high-severity CVEs.
- No single file may exceed **500 lines of code** (strict anti-god-file policy).

### C. Release Lifecycle
- Releases follow Semantic Versioning (`MAJOR.MINOR.PATCH`).
- New releases are tagged via Git (`vX.Y.Z`) and trigger the automated release pipeline in `.github/workflows/release.yml`.
