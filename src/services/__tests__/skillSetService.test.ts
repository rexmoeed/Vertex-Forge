import { describe, it, expect, beforeEach } from 'vitest';
import { SkillSetService } from '../skillSetService';

describe('SkillSetService Architecture & Persistence Engine', () => {
  beforeEach(() => {
    localStorage.clear();
    SkillSetService.initializeSkills();
  });

  it('initializes with default enterprise engineering skills', () => {
    const skills = SkillSetService.listSkills();
    expect(skills.length).toBeGreaterThanOrEqual(30);

    const reviewSkill = SkillSetService.getSkillById('skill-code-review');
    expect(reviewSkill).toBeDefined();
    expect(reviewSkill?.name).toBe('code-review');
  });

  it('persists skills to localStorage and restores them cleanly', () => {
    const custom = SkillSetService.addSkill({
      name: 'custom-skill',
      description: 'Test custom skill description',
      version: '1.0.0',
      triggers: [{ type: 'slash_command', pattern: '/custom' }],
      instructions: 'Run custom tests',
      allowedTools: ['read_file', 'write_file'],
      enabled: true,
      scope: 'global',
      author: 'Tester',
    });

    const retrieved = SkillSetService.getSkillById(custom.id);
    expect(retrieved).toBeDefined();
    expect(retrieved?.name).toBe('custom-skill');

    // Re-initialize to verify localStorage persistence
    SkillSetService.initializeSkills();
    const restored = SkillSetService.getSkillById(custom.id);
    expect(restored).toBeDefined();
  });

  it('toggles skills on and off properly', () => {
    const skill = SkillSetService.getSkillById('skill-code-review');
    expect(skill).toBeDefined();
    expect(skill?.enabled).toBe(true);

    SkillSetService.toggleSkill('skill-code-review', false);
    expect(SkillSetService.getSkillById('skill-code-review')?.enabled).toBe(false);

    SkillSetService.toggleSkill('skill-code-review', true);
    expect(SkillSetService.getSkillById('skill-code-review')?.enabled).toBe(true);
  });

  it('matches input against slash command and intent triggers', () => {
    const matchedSlash = SkillSetService.findMatchingSkill('/review src/App.tsx');
    expect(matchedSlash).toBeDefined();
    expect(matchedSlash?.id).toBe('skill-code-review');

    const matchedNone = SkillSetService.findMatchingSkill('/unknown-command-xyz');
    expect(matchedNone).toBeNull();
  });
});
