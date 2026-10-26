import { SkillDefinition } from '../../types/kos';

export function getDefaultSkills(): SkillDefinition[] {

    const baseTime = Date.now() - 3600000;
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
      {
        id: 'skill-sql-optimizer',
        name: 'sql-optimizer',
        description: 'Deep SQL query optimization, EXPLAIN ANALYZE tuning, composite indexing, and N+1 elimination.',
        version: '2.1.0',
        triggers: [
          { type: 'slash_command', pattern: '/sql-opt' },
          { type: 'slash_command', pattern: '/query-opt' },
          { type: 'intent', pattern: 'optimize sql' },
          { type: 'intent', pattern: 'slow query' },
          { type: 'intent', pattern: 'explain analyze' },
        ],
        instructions: `Optimize database query performance and execution plans:
1. Analyze slow query patterns, full table scans, and cross joins; rewrite using selective JOINs, CTEs, or window functions.
2. Identify missing composite, partial, or covering indexes based on query filter and sorting cardinalities.
3. Detect and eliminate ORM N+1 query loops using bulk eager loading, dataloaders, or batching.
4. Inspect EXPLAIN ANALYZE outputs to minimize buffer reads, temp disk spills, and row estimates discrepancies.`,
        allowedTools: ['read_file', 'edit_file', 'grep_search'],
        enabled: true,
        scope: 'global',
        author: 'Vertex Forge Core',
        createdAt: baseTime,
      },
      {
        id: 'skill-orm-master',
        name: 'orm-master',
        description: 'Prisma, Drizzle, TypeORM, SQLAlchemy, & Mongoose schema modeling, transactions, and pools.',
        version: '2.1.0',
        triggers: [
          { type: 'slash_command', pattern: '/orm' },
          { type: 'slash_command', pattern: '/prisma' },
          { type: 'slash_command', pattern: '/drizzle' },
          { type: 'intent', pattern: 'orm model' },
          { type: 'intent', pattern: 'database transaction' },
        ],
        instructions: `Architect robust ORM models and database operations:
1. Define schema definitions (Prisma schema, Drizzle schemas, TypeORM entities) with strict TypeScript types.
2. Execute multi-step mutations inside managed transactions ($transaction / db.transaction) to prevent partial writes.
3. Configure connection pooling, timeouts, and read-replica query routing for production workloads.
4. Generate reproducible seeder scripts with realistic relational foreign-key references.`,
        allowedTools: ['read_file', 'create_file', 'edit_file'],
        enabled: true,
        scope: 'global',
        author: 'Vertex Forge Core',
        createdAt: baseTime,
      },
      {
        id: 'skill-cache-architect',
        name: 'cache-architect',
        description: 'Redis & in-memory caching strategies, Cache-Aside pattern, TTL invalidation, and rate limiting.',
        version: '2.1.0',
        triggers: [
          { type: 'slash_command', pattern: '/cache' },
          { type: 'slash_command', pattern: '/redis' },
          { type: 'intent', pattern: 'redis caching' },
          { type: 'intent', pattern: 'cache strategy' },
          { type: 'intent', pattern: 'rate limiter' },
        ],
        instructions: `Engineer high-throughput caching and in-memory data structures:
1. Implement Cache-Aside (Lazy Loading) and Write-Through caching patterns with explicit TTL expirations.
2. Mitigate cache stampedes (dogpiling) using distributed mutex locks (Redlock) or probabilistic early expiration.
3. Select optimal Redis primitives (Strings, Hashes, Sorted Sets, Bitmaps) to minimize memory footprints.
4. Implement sliding-window rate limiters and real-time Pub/Sub notification pipelines.`,
        allowedTools: ['read_file', 'create_file', 'edit_file'],
        enabled: true,
        scope: 'global',
        author: 'Vertex Forge Core',
        createdAt: baseTime,
      },
      {
        id: 'skill-backend-auth',
        name: 'backend-auth',
        description: 'Robust backend auth, JWT refresh token rotation, OAuth2/OIDC, and RBAC/ABAC authorization guards.',
        version: '2.1.0',
        triggers: [
          { type: 'slash_command', pattern: '/auth' },
          { type: 'slash_command', pattern: '/jwt' },
          { type: 'intent', pattern: 'authentication setup' },
          { type: 'intent', pattern: 'rbac authorization' },
          { type: 'intent', pattern: 'refresh token' },
        ],
        instructions: `Construct hardened authentication and authorization architectures:
1. Implement secure password hashing using Argon2id or Bcrypt with appropriate work factor/salt rounds.
2. Deploy short-lived JWT Access Tokens combined with rotating HttpOnly Secure SameSite Refresh Tokens.
3. Build declarative RBAC (Role-Based) and ABAC (Attribute-Based) middleware guards for endpoints.
4. Harden against CSRF, session fixation, and token replay attacks with cryptographically secure token revocation blacklists.`,
        allowedTools: ['read_file', 'create_file', 'edit_file'],
        enabled: true,
        scope: 'global',
        author: 'Vertex Forge Core',
        createdAt: baseTime,
      },
      {
        id: 'skill-queue-worker',
        name: 'queue-worker',
        description: 'Background job queues (BullMQ, RabbitMQ, Kafka), worker idempotency, and Dead Letter Queues.',
        version: '2.1.0',
        triggers: [
          { type: 'slash_command', pattern: '/queue' },
          { type: 'slash_command', pattern: '/worker' },
          { type: 'intent', pattern: 'background job' },
          { type: 'intent', pattern: 'message queue' },
          { type: 'intent', pattern: 'bullmq rabbitmq' },
        ],
        instructions: `Architect resilient asynchronous message queues and worker pipelines:
1. Decouple heavy workflows from HTTP request cycles using reliable queues (BullMQ, RabbitMQ, SQS, or Kafka).
2. Enforce strict consumer idempotency via unique idempotency keys and transactional state locks.
3. Configure exponential backoff retry algorithms with randomized jitter to prevent thundering herd problems.
4. Route poison messages to Dead Letter Queues (DLQ) with telemetry alerts and graceful worker shutdown hooks.`,
        allowedTools: ['read_file', 'create_file', 'edit_file'],
        enabled: true,
        scope: 'global',
        author: 'Vertex Forge Core',
        createdAt: baseTime,
      },
      {
        id: 'skill-database-backup-dr',
        name: 'database-backup-dr',
        description: 'Database backup automation, point-in-time recovery (PITR), replication, and disaster recovery.',
        version: '2.1.0',
        triggers: [
          { type: 'slash_command', pattern: '/backup' },
          { type: 'slash_command', pattern: '/dr' },
          { type: 'intent', pattern: 'database backup' },
          { type: 'intent', pattern: 'disaster recovery' },
          { type: 'intent', pattern: 'point in time recovery' },
        ],
        instructions: `Engineer reliable database backup and disaster recovery protocols:
1. Script automated point-in-time recovery (PITR) workflows combining daily snapshots with WAL/binlog archiving.
2. Write automated verification routines that restore backups into an isolated sandbox to validate data integrity.
3. Define primary-replica replication topologies, read-scaling strategies, and automated healthcheck failover policies.
4. Formulate comprehensive Disaster Recovery (DR) runbooks specifying RTO (Recovery Time) and RPO (Recovery Point) metrics.`,
        allowedTools: ['read_file', 'create_file', 'edit_file'],
        enabled: true,
        scope: 'global',
        author: 'Vertex Forge Core',
        createdAt: baseTime,
      },
      {
        id: 'skill-conflict-resolver',
        name: 'conflict-resolver',
        description: 'Semantic Git merge conflict resolver reconciling divergent branches without regression.',
        version: '2.1.0',
        triggers: [
          { type: 'slash_command', pattern: '/conflict' },
          { type: 'intent', pattern: 'resolve merge conflict' },
          { type: 'intent', pattern: 'fix git conflict' },
        ],
        instructions: `Resolve complex git merge conflicts intelligently:
1. Parse 3-way git conflict markers (<<<<<<< HEAD, =======, >>>>>>> branch).
2. Contrast incoming changes against base and local branches to deduce both developer intents.
3. Reconcile both changes into clean, unified code without discarding required imports, types, or handlers.
4. Verify syntax and type safety to guarantee zero compiler diagnostics post-merge.`,
        allowedTools: ['read_file', 'edit_file', 'git_diff', 'get_diagnostics'],
        enabled: true,
        scope: 'global',
        author: 'Vertex Forge Core',
        createdAt: baseTime,
      },
      {
        id: 'skill-commit-generator',
        name: 'commit-generator',
        description: 'Generate Conventional Commits messages with accurate scopes and release notes from git diffs.',
        version: '2.1.0',
        triggers: [
          { type: 'slash_command', pattern: '/commit' },
          { type: 'intent', pattern: 'generate commit message' },
          { type: 'intent', pattern: 'write commit' },
        ],
        instructions: `Formulate standardized Conventional Commits from code changes:
1. Inspect unstaged and staged git diffs to detect architectural changes.
2. Determine appropriate type: feat, fix, refactor, perf, test, docs, chore, or ci.
3. Write concise subject line (<72 chars) following imperative tense: "feat(auth): add refresh token rotation".
4. Include detailed body explaining why the change was made and any breaking changes (BREAKING CHANGE:).`,
        allowedTools: ['read_file', 'git_diff', 'grep_search'],
        enabled: true,
        scope: 'global',
        author: 'Vertex Forge Core',
        createdAt: baseTime,
      },
      {
        id: 'skill-component-architect',
        name: 'component-architect',
        description: 'Scaffold responsive UI components with clean props interfaces, Tailwind, and accessibility.',
        version: '2.1.0',
        triggers: [
          { type: 'slash_command', pattern: '/component' },
          { type: 'intent', pattern: 'create component' },
          { type: 'intent', pattern: 'scaffold ui component' },
        ],
        instructions: `Construct production-ready UI components:
1. Design strict TypeScript interfaces for Props, Variants, and Event Handlers.
2. Apply responsive layout and styling using Tailwind CSS or standard CSS modules.
3. Integrate WCAG AA accessibility (aria attributes, keyboard tab indexing, focus states).
4. Deconstruct into modular subcomponents and export clean barrel index files.`,
        allowedTools: ['read_file', 'create_file', 'edit_file'],
        enabled: true,
        scope: 'global',
        author: 'Vertex Forge Core',
        createdAt: baseTime,
      },
      {
        id: 'skill-migration-architect',
        name: 'migration-architect',
        description: 'Framework upgrades, JavaScript-to-TypeScript conversions, and breaking API migrations.',
        version: '2.1.0',
        triggers: [
          { type: 'slash_command', pattern: '/migrate' },
          { type: 'intent', pattern: 'migrate codebase' },
          { type: 'intent', pattern: 'upgrade framework' },
          { type: 'intent', pattern: 'convert to typescript' },
        ],
        instructions: `Execute zero-regression code and library migrations:
1. Formulate step-by-step phased migration plan detailing deprecations and breaking API differences.
2. Incrementally convert JavaScript modules to strictly typed TypeScript with precise types.
3. Upgrade framework patterns (e.g., CommonJS to ESM, React Class to Hooks, Vue 2 to 3, ORM version transitions).
4. Ensure backward compatibility and verify all existing unit tests pass without failures.`,
        allowedTools: ['read_file', 'create_file', 'edit_file', 'grep_search', 'run_tests'],
        enabled: true,
        scope: 'global',
        author: 'Vertex Forge Core',
        createdAt: baseTime,
      },
      {
        id: 'skill-env-vault',
        name: 'env-vault',
        description: 'Audit environment variables, generate .env.example, and guard against secret leaks.',
        version: '2.1.0',
        triggers: [
          { type: 'slash_command', pattern: '/env' },
          { type: 'intent', pattern: 'audit env vars' },
          { type: 'intent', pattern: 'generate env example' },
          { type: 'intent', pattern: 'check secrets' },
        ],
        instructions: `Audit and manage environment configurations safely:
1. Scan codebase for all occurrences of process.env, import.meta.env, and config lookups.
2. Generate comprehensive .env.example template with dummy placeholders, descriptive comments, and expected formats.
3. Validate runtime environment variables using schema libraries (Zod / envalid) to fail fast on boot.
4. Flag any inadvertently committed credentials, private keys, or raw connection strings.`,
        allowedTools: ['read_file', 'create_file', 'edit_file', 'grep_search'],
        enabled: true,
        scope: 'global',
        author: 'Vertex Forge Core',
        createdAt: baseTime,
      },
      {
        id: 'skill-mock-generator',
        name: 'mock-generator',
        description: 'Generate realistic mock datasets, MSW network handlers, and database seed fixtures.',
        version: '2.1.0',
        triggers: [
          { type: 'slash_command', pattern: '/mock' },
          { type: 'intent', pattern: 'generate mock data' },
          { type: 'intent', pattern: 'msw handlers' },
          { type: 'intent', pattern: 'mock fixtures' },
        ],
        instructions: `Synthesize realistic testing and development mocks:
1. Generate realistic, type-safe entity datasets with varied edge cases (empty strings, unicode, max boundaries).
2. Scaffold Mock Service Worker (MSW) or Fetch interceptor handlers for offline frontend development.
3. Construct database seed fixtures with valid relational foreign-key dependencies.
4. Provide factory functions (buildUser(), buildProduct()) with overrideable attributes.`,
        allowedTools: ['read_file', 'create_file', 'edit_file'],
        enabled: true,
        scope: 'global',
        author: 'Vertex Forge Core',
        createdAt: baseTime,
      },
      {
        id: 'skill-docs-generator',
        name: 'docs-generator',
        description: 'Generate comprehensive TSDoc docstrings, architectural ADRs, and API guides.',
        version: '2.1.0',
        triggers: [
          { type: 'slash_command', pattern: '/docs' },
          { type: 'intent', pattern: 'write documentation' },
          { type: 'intent', pattern: 'generate docstrings' },
        ],
        instructions: `Synthesize clean, professional documentation:
1. Write informative TSDoc/JSDoc comments with @param, @returns, and @throws tags.
2. Produce Architecture Decision Records (ADRs) explaining technical trade-offs.
3. Generate usage examples with copy-pasteable TypeScript code blocks.
4. Document edge cases, failure states, and required environment variables.`,
        allowedTools: ['read_file', 'edit_file', 'create_file'],
        enabled: true,
        scope: 'global',
        author: 'Vertex Forge Core',
        createdAt: baseTime,
      },
      {
        id: 'skill-accessibility-a11y',
        name: 'accessibility-a11y',
        description: 'Upgrade UI components to WCAG 2.1 AA compliance with full keyboard navigation.',
        version: '2.1.0',
        triggers: [
          { type: 'slash_command', pattern: '/a11y' },
          { type: 'intent', pattern: 'improve accessibility' },
          { type: 'intent', pattern: 'screen reader support' },
        ],
        instructions: `Audit and elevate component accessibility:
1. Ensure proper ARIA roles, states, and properties (aria-expanded, aria-controls, aria-label).
2. Validate keyboard focus order, TabIndex flow, and visible focus rings.
3. Replace generic <div> and <span> clickables with semantic <button>, <nav>, and <main> elements.
4. Verify color contrast ratios meet WCAG 2.1 AA standards (minimum 4.5:1 for normal text).`,
        allowedTools: ['read_file', 'edit_file'],
        enabled: true,
        scope: 'global',
        author: 'Vertex Forge Core',
        createdAt: baseTime,
      },
      {
        id: 'skill-devops-docker',
        name: 'devops-docker',
        description: 'Scaffold production multi-stage Dockerfiles and GitHub Actions CI/CD workflows.',
        version: '2.1.0',
        triggers: [
          { type: 'slash_command', pattern: '/docker' },
          { type: 'slash_command', pattern: '/ci' },
          { type: 'intent', pattern: 'dockerize app' },
          { type: 'intent', pattern: 'setup ci cd' },
        ],
        instructions: `Configure production deployment and CI pipelines:
1. Construct multi-stage Dockerfiles with separate build and minimal unprivileged runtime images.
2. Create docker-compose.yml files linking app services, databases, and caches.
3. Generate GitHub Actions CI workflows for automated linting, typechecking, and testing.
4. Implement healthcheck endpoints and zero-downtime container termination signals.`,
        allowedTools: ['read_file', 'create_file', 'edit_file'],
        enabled: true,
        scope: 'global',
        author: 'Vertex Forge Core',
        createdAt: baseTime,
      },
      {
        id: 'skill-type-safety',
        name: 'type-safety',
        description: 'Eliminate implicit any, resolve TypeScript compile errors, and harden generics.',
        version: '2.1.0',
        triggers: [
          { type: 'slash_command', pattern: '/types' },
          { type: 'intent', pattern: 'fix type errors' },
          { type: 'intent', pattern: 'strict typing' },
        ],
        instructions: `Achieve 100% strict TypeScript type safety:
1. Remove all 'any' and 'as any' casts; replace with precise interfaces, generics, or unknown + narrowing.
2. Implement discriminated unions for complex state machines.
3. Leverage type predicates (isType) and exhaustive switch checks (never check).
4. Verify code passes 'tsc --noEmit' with zero compilation diagnostics.`,
        allowedTools: ['read_file', 'edit_file', 'get_diagnostics'],
        enabled: true,
        scope: 'global',
        author: 'Vertex Forge Core',
        createdAt: baseTime,
      },
      {
        id: 'skill-react-native-expert',
        name: 'react-native-expert',
        description: 'React Native & Expo cross-platform mobile architecture, Reanimated, gesture handling, and FlashList.',
        version: '2.1.0',
        triggers: [
          { type: 'slash_command', pattern: '/react-native' },
          { type: 'slash_command', pattern: '/rn' },
          { type: 'slash_command', pattern: '/expo' },
          { type: 'intent', pattern: 'react native' },
          { type: 'intent', pattern: 'expo mobile' },
        ],
        instructions: `Architect high-performance cross-platform React Native and Expo applications:
1. Compose responsive mobile layouts with React Native primitives (View, Text, Pressable, ScrollView) using StyleSheet or NativeWind.
2. Maximize list rendering performance using FlashList / FlatList with proper item layout estimation and key extractors.
3. Construct 60/120fps native-driven gestures and animations using react-native-reanimated and react-native-gesture-handler.
4. Implement offline-first storage (MMKV / WatermelonDB), deep linking schemes, and platform permission request flows (Camera, Location).`,
        allowedTools: ['read_file', 'create_file', 'edit_file'],
        enabled: true,
        scope: 'global',
        author: 'Vertex Forge Core',
        createdAt: baseTime,
      },
      {
        id: 'skill-flutter-dart-master',
        name: 'flutter-dart-master',
        description: 'Flutter widget tree composition, BLoC / Riverpod / Provider state management, and Dart sound null-safety.',
        version: '2.1.0',
        triggers: [
          { type: 'slash_command', pattern: '/flutter' },
          { type: 'slash_command', pattern: '/dart' },
          { type: 'intent', pattern: 'flutter widget' },
          { type: 'intent', pattern: 'dart null safety' },
          { type: 'intent', pattern: 'bloc state management' },
        ],
        instructions: `Engineer robust Flutter & Dart cross-platform mobile architectures:
1. Deconstruct complex UIs into clean StatelessWidget and StatefulWidget hierarchies, custom Slivers, and LayoutBuilders.
2. Structure scalable state management using BLoC / Cubit or Riverpod with immutable state classes (Freezed).
3. Leverage modern Dart 3 features: sound null-safety, records, pattern matching, sealed classes, and extension methods.
4. Eliminate jank via const constructors and RepaintBoundary; implement type-safe platform channels (MethodChannel) for native OS bridges.`,
        allowedTools: ['read_file', 'create_file', 'edit_file'],
        enabled: true,
        scope: 'global',
        author: 'Vertex Forge Core',
        createdAt: baseTime,
      },
      {
        id: 'skill-android-native',
        name: 'android-native',
        description: 'Native Android architecture with Kotlin, Jetpack Compose, Coroutines, StateFlow, Room, and Gradle builds.',
        version: '2.1.0',
        triggers: [
          { type: 'slash_command', pattern: '/android' },
          { type: 'slash_command', pattern: '/kotlin' },
          { type: 'intent', pattern: 'android jetpack compose' },
          { type: 'intent', pattern: 'kotlin coroutines' },
        ],
        instructions: `Develop modern native Android applications:
1. Design declarative, responsive UIs with Jetpack Compose using unidirectional data flow (UDF) and State hoisting.
2. Orchestrate asynchronous reactive streams using Kotlin Coroutines and StateFlow / SharedFlow with structured concurrency.
3. Implement clean MVVM / MVI architecture leveraging Hilt for dependency injection and Room for local SQL persistence.
4. Configure Gradle build files, ProGuard / R8 code shrinking rules, and runtime permission handling in AndroidManifest.xml.`,
        allowedTools: ['read_file', 'create_file', 'edit_file'],
        enabled: true,
        scope: 'global',
        author: 'Vertex Forge Core',
        createdAt: baseTime,
      },
      {
        id: 'skill-ios-native',
        name: 'ios-native',
        description: 'Native iOS app engineering with Swift, SwiftUI, Combine, Swift Concurrency, and SwiftData.',
        version: '2.1.0',
        triggers: [
          { type: 'slash_command', pattern: '/ios' },
          { type: 'slash_command', pattern: '/swift' },
          { type: 'intent', pattern: 'swiftui' },
          { type: 'intent', pattern: 'ios swift' },
        ],
        instructions: `Build premium native iOS applications:
1. Construct declarative SwiftUI views utilizing modern state wrappers (@State, @Binding, @Observable macro, @Environment).
2. Employ modern Swift Concurrency (async/await, TaskGroups, Actors) ensuring UI updates execute on @MainActor without data races.
3. Implement schema-driven offline persistence using SwiftData or CoreData with transactional background context saves.
4. Structure clean navigation (NavigationStack) and configure Info.plist privacy descriptions (App Tracking, Camera, FaceID).`,
        allowedTools: ['read_file', 'create_file', 'edit_file'],
        enabled: true,
        scope: 'global',
        author: 'Vertex Forge Core',
        createdAt: baseTime,
      },
      {
        id: 'skill-mobile-release-devops',
        name: 'mobile-release-devops',
        description: 'Automated iOS TestFlight & Google Play Store deployment, Fastlane pipelines, and code signing.',
        version: '2.1.0',
        triggers: [
          { type: 'slash_command', pattern: '/mobile-release' },
          { type: 'slash_command', pattern: '/appstore' },
          { type: 'slash_command', pattern: '/playstore' },
          { type: 'slash_command', pattern: '/fastlane' },
          { type: 'intent', pattern: 'testflight release' },
          { type: 'intent', pattern: 'google play release' },
        ],
        instructions: `Automate end-to-end mobile CI/CD distribution:
1. Script Fastlane lanes (Fastfile, Matchfile, Appfile) for automated beta and production publishing.
2. Automate iOS code signing using Match (git-backed certificates and provisioning profiles) and Android Keystore signing.
3. Configure automated build number increments and semantic app version synchronization across Info.plist and build.gradle.
4. Produce release checklists for App Store Review Guidelines and Google Play Console compliance.`,
        allowedTools: ['read_file', 'create_file', 'edit_file'],
        enabled: true,
        scope: 'global',
        author: 'Vertex Forge Core',
        createdAt: baseTime,
      },
      {
        id: 'skill-swarm-feature-slicing',
        name: 'swarm-feature-slicing',
        description: 'Concurrently builds Backend API, Database Schema, Reactive UI, and Test Suite with zero file lock collisions.',
        triggers: [
          { type: 'slash_command', pattern: '/swarm-feature' },
          { type: 'slash_command', pattern: '/feature-slice' },
          { type: 'intent', pattern: 'parallel feature build' },
          { type: 'intent', pattern: 'slice feature' },
        ],
        instructions: `Coordinate the 4-tier parallel feature slicing swarm:
1. DatabaseSchemaSpecialist produces isolated models and migration SQL.
2. APIEndpointBuilder constructs concurrent REST/RPC routes and request validators.
3. ReactComponentBuilder delivers responsive UI views and reactive state orchestration.
4. UnitTestWriter validates contracts with comprehensive Vitest coverage.
All tasks run in parallel with strictly segregated file reservations to prevent merge deadlocks.`,
        allowedTools: ['create_file', 'edit_file', 'read_file', 'run_terminal'],
        enabled: true,
        scope: 'global',
        version: '1.0.0',
        author: 'Vertex Forge Swarm Core',
        createdAt: baseTime,
      },
      {
        id: 'skill-swarm-background-guardians',
        name: 'swarm-background-guardians',
        description: 'Silent parallel watchdogs: TypeLintSentry, SecretLeakSniffer, and PerfLeakWatcher for continuous project health.',
        triggers: [
          { type: 'slash_command', pattern: '/swarm-guard' },
          { type: 'slash_command', pattern: '/guardians' },
          { type: 'intent', pattern: 'start background guardians' },
          { type: 'intent', pattern: 'continuous sentry' },
        ],
        instructions: `Maintain continuous background surveillance with zero interference:
1. TypeLintSentry continuously monitors AST syntax, strict types, and module boundaries.
2. SecretLeakSniffer intercepts API tokens, secrets, private keys, and environment leakage.
3. PerfLeakWatcher detects unclosed event listeners, runaway loops, and memory bloat.`,
        allowedTools: ['read_file', 'run_terminal'],
        enabled: true,
        scope: 'global',
        version: '1.0.0',
        author: 'Vertex Forge Swarm Core',
        createdAt: baseTime,
      },
      {
        id: 'skill-swarm-self-healing',
        name: 'swarm-self-healing',
        description: 'Devin-style autonomous diagnostic root cause isolation and surgical patch synthesis for failing tests or errors.',
        triggers: [
          { type: 'slash_command', pattern: '/swarm-heal' },
          { type: 'slash_command', pattern: '/self-heal' },
          { type: 'intent', pattern: 'auto heal tests' },
          { type: 'intent', pattern: 'fix failing tests' },
        ],
        instructions: `Execute autonomous two-phase self-healing:
1. TestRunnerDiagnostician analyzes failing test runner output and stack traces to isolate the exact defect.
2. PatchSynthesizer formulates and applies minimal surgical AST diffs to resolve root cause without altering existing invariants.
3. Re-executes the test runner to guarantee 100% green verification.`,
        allowedTools: ['edit_file', 'read_file', 'run_terminal'],
        enabled: true,
        scope: 'global',
        version: '1.0.0',
        author: 'Vertex Forge Swarm Core',
        createdAt: baseTime,
      },
      {
        id: 'skill-swarm-doc-env-sync',
        name: 'swarm-doc-env-sync',
        description: 'Concurrently synchronizes architectural documentation, TSDoc/OpenAPI specs, and .env.example templates.',
        triggers: [
          { type: 'slash_command', pattern: '/swarm-sync' },
          { type: 'slash_command', pattern: '/sync-docs' },
          { type: 'slash_command', pattern: '/sync-env' },
          { type: 'intent', pattern: 'sync environment and docs' },
        ],
        instructions: `Concurrently sync technical assets across the workspace:
1. DocSyncAgent audits updated interfaces and syncs README.md, TSDoc comments, and OpenAPI specifications.
2. EnvSyncAgent audits all process.env invocations across the codebase and maintains .env.example with documented placeholders.`,
        allowedTools: ['edit_file', 'create_file', 'read_file'],
        enabled: true,
        scope: 'global',
        version: '1.0.0',
        author: 'Vertex Forge Swarm Core',
        createdAt: baseTime,
      },
    ];
  
}

export const DEFAULT_SKILLS = getDefaultSkills();
