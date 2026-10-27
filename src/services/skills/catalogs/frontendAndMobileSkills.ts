import { SkillDefinition } from '../../../types/kos';

export function getFrontendAndMobileSkills(baseTime: number): SkillDefinition[] {
  return [
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
  ];
}
