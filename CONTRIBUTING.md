# Contributing to Vertex Forge

Thank you for your interest in contributing to Vertex Forge! We welcome contributions, bug fixes, feature enhancements, and documentation improvements.

## Development Workflow

### 1. Prerequisites
- Node.js >= 18.0.0 (v20+ recommended)
- Git
- npm >= 9.0.0

### 2. Setup
```bash
# Clone the repository
git clone https://github.com/rexmoeed/Vertex-Forge.git
cd Vertex-Forge-main

# Copy environment template
cp .env.example .env

# Install dependencies
npm ci
```

### 3. Verification & Testing
Before submitting any pull request or committing code, ensure:
```bash
# 1. Typecheck & lint passes with 0 errors
npm run lint

# 2. All unit and integration tests pass
npm test

# 3. Production build succeeds
npm run build
```

## Atomic Commits & Test Pairing
- Every new feature or bug fix must arrive with unit or integration tests that prove it.
- Keep commits focused and atomic with descriptive conventional commit messages:
  - `feat:` for new capabilities
  - `fix:` for bug fixes
  - `test:` for test additions/refactoring
  - `docs:` for documentation updates
  - `ci:` for CI/CD pipeline changes
  - `refactor:` for code restructuring without behavioral changes

## Pull Request Guidelines
1. Branch from `main` (`feature/my-enhancement` or `fix/issue-description`).
2. Run test suites locally before opening a PR.
3. Ensure the GitHub Actions CI pipeline runs completely green.
4. Provide a clear description of the problem solved and test coverage added.


### Minimal Environment Configuration & Offline Mode

Vertex Forge is designed to boot immediately from a fresh clone without mandatory API credentials:
```bash
# Optional: create a local .env file
PORT=3000
NODE_ENV=development
# GEMINI_API_KEY=your_key_here  # Optional: defaults to offline/mock mode if absent
```
To verify fresh-clone health:
```bash
npm run smoke   # Boots Express server and validates /api/health
npm run dev     # Starts local Vite development server
```
