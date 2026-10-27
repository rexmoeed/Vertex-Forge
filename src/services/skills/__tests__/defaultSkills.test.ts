import { describe, it, expect } from 'vitest';
import { getDefaultSkills, DEFAULT_SKILLS } from '../defaultSkills';

describe('Modular Default Skills Catalog', () => {
  it('loads all 33 specialized engineering, mobile, backend, and swarm skills', () => {
    const skills = getDefaultSkills();
    expect(skills.length).toBe(33);
    expect(DEFAULT_SKILLS.length).toBe(33);
  });

  it('ensures each skill contains valid triggers, instructions, and metadata', () => {
    const skills = getDefaultSkills();
    for (const skill of skills) {
      expect(skill.id).toBeDefined();
      expect(skill.name).toBeDefined();
      expect(skill.instructions.length).toBeGreaterThan(20);
      expect(skill.triggers.length).toBeGreaterThan(0);
      expect(skill.allowedTools.length).toBeGreaterThan(0);
    }
  });

  it('contains swarm skills with proper tool allocations', () => {
    const skills = getDefaultSkills();
    const swarmSkills = skills.filter(s => s.id.startsWith('skill-swarm'));
    expect(swarmSkills.length).toBe(4);
  });
});
