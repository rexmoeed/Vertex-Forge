import { SkillDefinition } from '../../../types/kos';

export function getEngineeringSkills(baseTime: number): SkillDefinition[] {
  return [
    {
      id: 'skill-code-review',
      name: 'code-review',
      description: 'Comprehensive static security, type-safety, and architecture checklist review.',
      version: '2.1.0',
      triggers: [
        { type: 'slash_command', pattern: '/review' },
        { type: 'intent', pattern: 'review my changes' },
        { type: 'intent', pattern: 'code review' },
      ],
      instructions: `Execute a rigorous architectural and security code review:
1. Input validation & prompt injection boundary checks.
2. Null pointer dereference, unhandled promise rejections, and missing error boundaries.
3. Performance regressions, expensive loops, and memory leaks.
4. Strict TypeScript typing (flag any implicit 'any', unsafe casts, or missing generics).
5. Output findings with exact line references, severity ratings (Critical, Warning, Suggestion), and actionable fixes.`,
      allowedTools: ['read_file', 'grep_search', 'get_diagnostics', 'git_diff'],
      enabled: true,
      scope: 'global',
      author: 'Vertex Forge Core',
      createdAt: baseTime,
    },
    {
      id: 'skill-write-tests',
      name: 'write-tests',
      description: 'Generate high-coverage Vitest/Jest unit and integration tests with edge cases.',
      version: '2.1.0',
      triggers: [
        { type: 'slash_command', pattern: '/tests' },
        { type: 'intent', pattern: 'write unit tests' },
        { type: 'intent', pattern: 'generate tests' },
      ],
      instructions: `Generate exhaustive, idiomatic test suites using detected test runner (Vitest/Jest):
1. Mock external network/filesystem/database boundaries with clean teardown.
2. Test happy paths, boundary thresholds, empty inputs, network timeouts, and failure states.
3. Ensure 100% type coverage without 'any' in test assertions.
4. Provide executable test files ready to run via 'npm test'.`,
      allowedTools: ['read_file', 'create_file', 'run_tests', 'fs_read_file', 'fs_write_file'],
      enabled: true,
      scope: 'global',
      author: 'Vertex Forge Core',
      createdAt: baseTime,
    },
    {
      id: 'skill-bug-triage',
      name: 'bug-triage',
      description: 'Analyze stack trace, localize culprit lines, and propose verified minimal patch.',
      version: '2.1.0',
      triggers: [
        { type: 'slash_command', pattern: '/debug' },
        { type: 'intent', pattern: 'fix this bug' },
        { type: 'intent', pattern: 'debug error' },
        { type: 'intent', pattern: 'troubleshoot failure' },
      ],
      instructions: `Isolate failing component from runtime error log or stack trace:
1. Map stack trace back to exact source file coordinates.
2. Cross-reference recent git diffs to detect regressing changes.
3. Explain root cause in one crisp paragraph.
4. Synthesize minimal surgical fix without breaking unrelated components.
5. Provide exact verification step or assertion command.`,
      allowedTools: ['read_file', 'edit_file', 'run_command', 'run_tests', 'get_diagnostics'],
      enabled: true,
      scope: 'global',
      author: 'Vertex Forge Core',
      createdAt: baseTime,
    },
    {
      id: 'skill-code-refactor',
      name: 'code-refactor',
      description: 'Clean code refactoring adhering to SOLID, DRY, and modular decoupled patterns.',
      version: '2.1.0',
      triggers: [
        { type: 'slash_command', pattern: '/refactor' },
        { type: 'intent', pattern: 'refactor code' },
        { type: 'intent', pattern: 'clean up architecture' },
        { type: 'intent', pattern: 'modularize' },
      ],
      instructions: `Perform clean-code refactoring without modifying external behavior:
1. Extract duplicate logic into pure, reusable utility functions (DRY).
2. Deconstruct oversized components (>200 lines) into focused single-responsibility sub-modules.
3. Decouple business logic, state management, and UI rendering.
4. Preserve existing public APIs and verify all contracts remain backward-compatible.`,
      allowedTools: ['read_file', 'edit_file', 'create_file', 'grep_search'],
      enabled: true,
      scope: 'global',
      author: 'Vertex Forge Core',
      createdAt: baseTime,
    },
    {
      id: 'skill-perf-optimize',
      name: 'perf-optimize',
      description: 'Profile algorithmic complexity, eliminate re-renders, and optimize memory usage.',
      version: '2.1.0',
      triggers: [
        { type: 'slash_command', pattern: '/optimize' },
        { type: 'intent', pattern: 'optimize performance' },
        { type: 'intent', pattern: 'speed up' },
        { type: 'intent', pattern: 'fix lag' },
      ],
      instructions: `Analyze and optimize performance bottlenecks:
1. Reduce time complexity from O(N^2) to O(N) or O(log N) using HashMaps/Sets.
2. Eliminate redundant React re-renders with strategic memoization (useMemo, useCallback, React.memo).
3. Introduce virtualization for large list renderings.
4. Debounce or throttle high-frequency events (scroll, resize, keystrokes).
5. Identify and remove memory leaks (dangling event listeners, unclosed timers, open streams).`,
      allowedTools: ['read_file', 'edit_file', 'get_diagnostics'],
      enabled: true,
      scope: 'global',
      author: 'Vertex Forge Core',
      createdAt: baseTime,
    },
    {
      id: 'skill-security-hardening',
      name: 'security-hardening',
      description: 'OWASP Top 10 audit, secret leak defense, and input sanitization hardening.',
      version: '2.1.0',
      triggers: [
        { type: 'slash_command', pattern: '/security' },
        { type: 'intent', pattern: 'audit security' },
        { type: 'intent', pattern: 'secure code' },
        { type: 'intent', pattern: 'vulnerability scan' },
      ],
      instructions: `Enforce zero-trust application security:
1. Sanitize all user inputs against XSS, SQL/NoSQL injection, and Path Traversal.
2. Scan for hardcoded credentials, API keys, or private tokens; migrate to environment variables or Credential Vault.
3. Validate CORS, CSRF headers, and Content-Security-Policy (CSP) configurations.
4. Check cryptographic implementations for timing attacks and deprecated algorithms (MD5/SHA1).`,
      allowedTools: ['read_file', 'grep_search', 'edit_file'],
      enabled: true,
      scope: 'global',
      author: 'Vertex Forge Core',
      createdAt: baseTime,
    },
    {
      id: 'skill-api-architect',
      name: 'api-architect',
      description: 'Design robust REST, GraphQL, or tRPC endpoints with strict Zod validation.',
      version: '2.1.0',
      triggers: [
        { type: 'slash_command', pattern: '/api' },
        { type: 'intent', pattern: 'design api' },
        { type: 'intent', pattern: 'create endpoint' },
        { type: 'intent', pattern: 'api contract' },
      ],
      instructions: `Architect production-ready API contracts:
1. Define strict runtime schema validation using Zod/Valibot for request body, query, and params.
2. Implement idempotent operations with proper HTTP status codes (200, 201, 400, 401, 403, 404, 429, 500).
3. Standardize unified error response payloads with machine-readable error codes.
4. Export type-safe client SDK types matching the backend API contract.`,
      allowedTools: ['read_file', 'create_file', 'edit_file'],
      enabled: true,
      scope: 'global',
      author: 'Vertex Forge Core',
      createdAt: baseTime,
    },
    {
      id: 'skill-db-schema',
      name: 'db-schema',
      description: 'Model relational & document database schemas with migrations and indexing.',
      version: '2.1.0',
      triggers: [
        { type: 'slash_command', pattern: '/db' },
        { type: 'slash_command', pattern: '/schema' },
        { type: 'intent', pattern: 'database schema' },
        { type: 'intent', pattern: 'create migration' },
        { type: 'intent', pattern: 'design database' },
      ],
      instructions: `Engineer resilient database schemas (PostgreSQL, MySQL, SQLite, MongoDB, Prisma, Drizzle):
1. Design normalized relational models (3NF) with primary keys, foreign key constraints, and cascade policies.
2. Add B-Tree, Hash, or composite indexes for high-frequency filter and sort queries.
3. Enforce ACID transactional consistency across multi-step mutations.
4. Provide forward and backward migration scripts.`,
      allowedTools: ['read_file', 'create_file', 'edit_file'],
      enabled: true,
      scope: 'global',
      author: 'Vertex Forge Core',
      createdAt: baseTime,
    },
  ];
}
