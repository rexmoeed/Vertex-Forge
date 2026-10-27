import { SkillDefinition } from '../../../types/kos';

export function getBackendAndDataSkills(baseTime: number): SkillDefinition[] {
  return [
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
  ];
}
