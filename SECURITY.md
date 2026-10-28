# Security Policy (SECURITY.md)

Vertex Forge takes the security of autonomous development, local workspaces, and credential isolation seriously. This document outlines our security policies, supported versions, and how to report vulnerabilities.

---

## 1. Supported Versions

Security updates and patches are actively applied to the following release tracks:

| Version | Supported | Security Patch Cadence |
|:---|:---:|:---|
| **1.5.x** | ✅ Active | Critical vulnerabilities patched within 48 hours |
| **1.4.x** | ✅ Active | Security maintenance fixes backported |
| **1.3.x** | ⚠️ Limited | High-severity security issues only |
| **< 1.3** | ❌ End of Life | Please upgrade to the latest stable release |

---

## 2. Reporting a Vulnerability

If you discover a security vulnerability or security-relevant bug in Vertex Forge, please report it privately:

1. **GitHub Private Vulnerability Reporting**:
   - Navigate to the **Security** tab of the [Vertex Forge Repository](https://github.com/rexmoeed/Vertex-Forge).
   - Click **Report a vulnerability** to open an encrypted advisory.
2. **Direct Security Contact**:
   - Email: `security@vertexforge.dev` (or contact maintainer `@rexmoeed` directly via GitHub).
   - Please include:
     - Clear description of the vulnerability.
     - Reproducible Proof of Concept (PoC) or step-by-step reproduction instructions.
     - Affected versions and environments (Electron Desktop, Express Backend, or Web).
     - Potential impact and mitigation ideas if available.

### Service Level Agreements (SLAs)
- **Initial Acknowledgment**: Within **24 hours**.
- **Triage & Severity Assessment**: Within **48 hours**.
- **Fix & Public Patch Release**: Within **7 to 14 days** depending on severity.
- **Coordinated Disclosure**: We follow standard 90-day responsible disclosure guidelines.

---

## 3. Autonomous Architectural Defenses

Vertex Forge is engineered with multiple defensive rings to prevent autonomous code execution risks:

### A. Devin-Style Shadow Sandbox (`shadowSandboxService.ts`)
- All autonomous code mutations are first executed in an in-memory virtual staging environment.
- AST syntax analysis, brace matching, and relative import integrity checks run before changes touch disk.
- If a compilation or lint boundary fails, the agent cannot commit the file.

### B. Secret Scanner & Boundary Protection (`secretScannerService.ts`)
- Sensitive files (`.env`, `.git/config`, private keys `*.pem`, `id_rsa`) are guarded with read/write interceptors.
- Autonomous agents are barred from staging or committing secrets to Git.

### C. Host Process & Traversal Interceptors (`agentToolRegistry.ts`)
- Absolute path traversal (`../..`) is blocked across all virtual and physical file system operations.
- Destructive commands (`rm -rf /`, `DROP DATABASE`, `git push --force`) are intercepted and require operator confirmation in Supervised Mode.

### D. 100% Offline Privacy Mode
- In Privacy Mode, outbound network traffic to third-party AI endpoints is completely severed.
- All intelligence runs strictly on local endpoints (`localhost:11434` for Ollama or `localhost:1234` for LM Studio).

### E. Encrypted Credential Vault (`credentialVaultService.ts`)
- User API tokens (Gemini, OpenAI, Anthropic, Jules, GitHub PATs) are stored locally in isolated, encrypted browser/OS vaults and are never transmitted to third parties.

---

## 4. Security Audit & CI Gates

Our continuous integration pipeline enforces:
- `npm audit --audit-level=high` on every pull request.
- Automated static analysis and type verification (`tsc --noEmit`, ESLint zero-warning policy).
- Isolated offline test suite execution (`npm run test:integration-isolated`).
