import { describe, it, expect, beforeEach } from 'vitest';
import { SkillSetService } from '../skillSetService';
import { UniversalSystemPromptBuilder } from '../universalSystemPrompt';

describe('Enhanced Specialized Coding Skills Engine', () => {
  beforeEach(() => {
    SkillSetService.resetToDefaults();
  });

  it('initializes with all 29 specialized coding skills enabled', () => {
    const skills = SkillSetService.listSkills();
    expect(skills.length).toBeGreaterThanOrEqual(29);

    const skillNames = skills.map(s => s.name);
    // Core Engineering Skills
    expect(skillNames).toContain('code-review');
    expect(skillNames).toContain('write-tests');
    expect(skillNames).toContain('bug-triage');
    expect(skillNames).toContain('code-refactor');
    expect(skillNames).toContain('perf-optimize');
    expect(skillNames).toContain('security-hardening');
    expect(skillNames).toContain('api-architect');
    expect(skillNames).toContain('db-schema');
    expect(skillNames).toContain('docs-generator');
    expect(skillNames).toContain('accessibility-a11y');
    expect(skillNames).toContain('devops-docker');
    expect(skillNames).toContain('type-safety');

    // Backend & Database Suite
    expect(skillNames).toContain('sql-optimizer');
    expect(skillNames).toContain('orm-master');
    expect(skillNames).toContain('cache-architect');
    expect(skillNames).toContain('backend-auth');
    expect(skillNames).toContain('queue-worker');
    expect(skillNames).toContain('database-backup-dr');

    // Fullstack / Git Suite
    expect(skillNames).toContain('conflict-resolver');
    expect(skillNames).toContain('commit-generator');
    expect(skillNames).toContain('component-architect');
    expect(skillNames).toContain('migration-architect');
    expect(skillNames).toContain('env-vault');
    expect(skillNames).toContain('mock-generator');

    // Mobile Development Suite (Android, iOS, Flutter, React Native)
    expect(skillNames).toContain('react-native-expert');
    expect(skillNames).toContain('flutter-dart-master');
    expect(skillNames).toContain('android-native');
    expect(skillNames).toContain('ios-native');
    expect(skillNames).toContain('mobile-release-devops');

    expect(skills.every(s => s.enabled)).toBe(true);
  });

  describe('Slash Command Matching', () => {
    const expectations = [
      { input: '/review src/App.tsx', expectedSkill: 'code-review' },
      { input: '/tests src/services/auth.ts', expectedSkill: 'write-tests' },
      { input: '/debug TypeError: Cannot read property of undefined', expectedSkill: 'bug-triage' },
      { input: '/refactor extract helper function', expectedSkill: 'code-refactor' },
      { input: '/optimize reduce re-renders in Table component', expectedSkill: 'perf-optimize' },
      { input: '/security audit JWT auth middleware', expectedSkill: 'security-hardening' },
      { input: '/api create user signup route with Zod', expectedSkill: 'api-architect' },
      { input: '/db create Prisma schema for organizations and teams', expectedSkill: 'db-schema' },
      { input: '/schema design normalized e-commerce models', expectedSkill: 'db-schema' },
      { input: '/docs write TSDoc for API provider service', expectedSkill: 'docs-generator' },
      { input: '/a11y improve modal focus trapping and aria-labels', expectedSkill: 'accessibility-a11y' },
      { input: '/docker create multi-stage build for Node.js app', expectedSkill: 'devops-docker' },
      { input: '/ci setup github actions workflow', expectedSkill: 'devops-docker' },
      { input: '/types remove any casts and add discriminated unions', expectedSkill: 'type-safety' },
      // Backend & Database Skills
      { input: '/sql-opt SELECT * FROM orders WHERE user_id = 42', expectedSkill: 'sql-optimizer' },
      { input: '/query-opt explain analyze join query', expectedSkill: 'sql-optimizer' },
      { input: '/orm create drizzle relations and transaction', expectedSkill: 'orm-master' },
      { input: '/prisma configure multi-tenant schema with cascades', expectedSkill: 'orm-master' },
      { input: '/drizzle setup type-safe schema', expectedSkill: 'orm-master' },
      { input: '/cache implement redis cache-aside for product catalog', expectedSkill: 'cache-architect' },
      { input: '/redis setup sliding window rate limiter', expectedSkill: 'cache-architect' },
      { input: '/auth setup jwt refresh token rotation with httponly cookies', expectedSkill: 'backend-auth' },
      { input: '/jwt implement rbac authorization guard', expectedSkill: 'backend-auth' },
      { input: '/queue bullmq email notification queue with retries', expectedSkill: 'queue-worker' },
      { input: '/worker configure rabbitmq consumer with dlq', expectedSkill: 'queue-worker' },
      { input: '/backup setup postgres point-in-time recovery script', expectedSkill: 'database-backup-dr' },
      { input: '/dr define automated failover runbook', expectedSkill: 'database-backup-dr' },
      // Fullstack & Git Skills
      { input: '/conflict merge branch feature/billing into main', expectedSkill: 'conflict-resolver' },
      { input: '/commit write conventional commit for auth refactoring', expectedSkill: 'commit-generator' },
      { input: '/component responsive data table with sorting and filtering', expectedSkill: 'component-architect' },
      { input: '/migrate convert commonjs modules to esm', expectedSkill: 'migration-architect' },
      { input: '/env audit process.env references and make .env.example', expectedSkill: 'env-vault' },
      { input: '/mock generate 50 mock users for seed script', expectedSkill: 'mock-generator' },
      // Mobile Development Skills
      { input: '/react-native smooth gesture handler animation', expectedSkill: 'react-native-expert' },
      { input: '/rn configure flashlist with memoization', expectedSkill: 'react-native-expert' },
      { input: '/expo setup deep linking navigation scheme', expectedSkill: 'react-native-expert' },
      { input: '/flutter scaffold responsive layout with riverpod', expectedSkill: 'flutter-dart-master' },
      { input: '/dart apply sealed class pattern matching', expectedSkill: 'flutter-dart-master' },
      { input: '/android implement jetpack compose state hoisting', expectedSkill: 'android-native' },
      { input: '/kotlin create reactive flow repository with Room', expectedSkill: 'android-native' },
      { input: '/ios setup swiftui navigationstack with swiftdata', expectedSkill: 'ios-native' },
      { input: '/swift configure task group for parallel network calls', expectedSkill: 'ios-native' },
      { input: '/mobile-release configure fastlane match for testflight', expectedSkill: 'mobile-release-devops' },
      { input: '/appstore generate localized release metadata', expectedSkill: 'mobile-release-devops' },
      { input: '/playstore automate android aab bundle signing', expectedSkill: 'mobile-release-devops' },
      { input: '/fastlane create automated build pipeline', expectedSkill: 'mobile-release-devops' },
    ];

    for (const exp of expectations) {
      it(`matches "${exp.input}" to "${exp.expectedSkill}"`, () => {
        const match = SkillSetService.findMatchingSkill(exp.input);
        expect(match).toBeDefined();
        expect(match?.name).toBe(exp.expectedSkill);
        expect(match?.instructions.length).toBeGreaterThan(20);
        expect(match?.allowedTools.length).toBeGreaterThan(0);
      });
    }
  });

  describe('Natural Language Intent Matching', () => {
    it('matches "please review my changes" to code-review', () => {
      const match = SkillSetService.findMatchingSkill('please review my changes in this file');
      expect(match?.name).toBe('code-review');
    });

    it('matches "write unit tests for this module" to write-tests', () => {
      const match = SkillSetService.findMatchingSkill('write unit tests for this module');
      expect(match?.name).toBe('write-tests');
    });

    it('matches "fix this bug in the checkout flow" to bug-triage', () => {
      const match = SkillSetService.findMatchingSkill('fix this bug in the checkout flow');
      expect(match?.name).toBe('bug-triage');
    });

    it('matches "optimize performance of this algorithm" to perf-optimize', () => {
      const match = SkillSetService.findMatchingSkill('optimize performance of this algorithm');
      expect(match?.name).toBe('perf-optimize');
    });

    it('returns null for unrelated generic conversation', () => {
      const match = SkillSetService.findMatchingSkill('hello what is the weather today?');
      expect(match).toBeNull();
    });
  });

  describe('Skill Toggle and Dynamic Addition', () => {
    it('disables skill when toggled off', () => {
      const reviewSkill = SkillSetService.listSkills().find(s => s.name === 'code-review');
      expect(reviewSkill).toBeDefined();

      SkillSetService.toggleSkill(reviewSkill!.id, false);

      const match = SkillSetService.findMatchingSkill('/review src/App.tsx');
      expect(match).toBeNull();

      SkillSetService.toggleSkill(reviewSkill!.id, true);
      const matchAfter = SkillSetService.findMatchingSkill('/review src/App.tsx');
      expect(matchAfter?.name).toBe('code-review');
    });

    it('supports adding custom workspace skills', () => {
      const custom = SkillSetService.addSkill({
        name: 'graphql-codegen',
        description: 'Synthesize GraphQL operations and Apollo client hooks',
        version: '1.0.0',
        triggers: [{ type: 'slash_command', pattern: '/gql' }],
        instructions: 'Generate typed GraphQL queries and mutations.',
        allowedTools: ['read_file', 'create_file'],
        enabled: true,
        scope: 'workspace',
        author: 'User',
      });

      expect(custom.id).toBeDefined();
      const match = SkillSetService.findMatchingSkill('/gql fetchUserProfile');
      expect(match?.name).toBe('graphql-codegen');
    });
  });

  describe('UniversalSystemPromptBuilder Skill Injection', () => {
    it('embeds active skill directives into system prompt when slash command is used', () => {
      const prompt = UniversalSystemPromptBuilder.buildSystemPrompt({
        userPrompt: '/refactor decouple data fetching from UI component',
        includeTools: true,
      });

      expect(prompt).toContain('Active Specialized Coding Skill: /code-refactor');
      expect(prompt).toContain('SOLID, DRY, and modular decoupled patterns');
      expect(prompt).toContain('Extract duplicate logic into pure, reusable utility functions');
      expect(prompt).toContain('You MUST adhere strictly to these specialized coding directives');
    });

    it('embeds security hardening directives when /security is called', () => {
      const prompt = UniversalSystemPromptBuilder.buildSystemPrompt({
        userPrompt: '/security sanitize user input in auth controller',
        includeTools: true,
      });

      expect(prompt).toContain('Active Specialized Coding Skill: /security-hardening');
      expect(prompt).toContain('Sanitize all user inputs against XSS');
      expect(prompt).toContain('Scan for hardcoded credentials');
    });
  });
});
