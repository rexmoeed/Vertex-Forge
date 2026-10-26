import { SkillDefinition } from '../types/kos';
import { logger } from './logger';
import { getDefaultSkills } from './skills/defaultSkills';

const SKILLS_STORAGE_KEY = 'vertex_skill_sets_v5';

export class SkillSetService {
  private static skills: SkillDefinition[] = [];

  static {
    this.initializeSkills();
  }

  public static initializeSkills(): void {
    try {
      if (typeof localStorage !== 'undefined') {
        const stored = localStorage.getItem(SKILLS_STORAGE_KEY);
        if (stored) {
          const parsed = JSON.parse(stored);
          if (Array.isArray(parsed) && parsed.length >= 33) {
            this.skills = parsed;
            return;
          }
        }
      }
    } catch (e) {
      logger.warn('Failed to load skills from localStorage:', e);
    }

    this.skills = this.getDefaultSkills();
    this.persist();
  }

    public static getDefaultSkills(): SkillDefinition[] {
    return getDefaultSkills();
  }

  public static listSkills(): SkillDefinition[] {
    return [...this.skills];
  }

  public static getSkillById(id: string): SkillDefinition | undefined {
    return this.skills.find(s => s.id === id);
  }

  public static toggleSkill(id: string, enabled: boolean): void {
    const s = this.skills.find(item => item.id === id);
    if (s) {
      s.enabled = enabled;
      this.persist();
    }
  }

  public static addSkill(skill: Omit<SkillDefinition, 'id' | 'createdAt'>): SkillDefinition {
    const newSkill: SkillDefinition = {
      ...skill,
      id: `skill-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      createdAt: Date.now(),
    };
    this.skills.push(newSkill);
    this.persist();
    return newSkill;
  }

  public static findMatchingSkill(input: string): SkillDefinition | null {
    if (!input) return null;
    const trimmed = input.trim();
    for (const skill of this.skills) {
      if (!skill.enabled) continue;
      for (const t of skill.triggers) {
        if (t.type === 'slash_command') {
          // Matches "/review", "/review src/App.tsx", "/tests"
          if (trimmed === t.pattern || trimmed.startsWith(`${t.pattern} `) || trimmed.startsWith(`${t.pattern}:`)) {
            return skill;
          }
        }
        if (t.type === 'intent') {
          try {
            if (new RegExp(`\\b${t.pattern}\\b`, 'i').test(trimmed)) {
              return skill;
            }
          } catch {
            if (trimmed.toLowerCase().includes(t.pattern.toLowerCase())) {
              return skill;
            }
          }
        }
      }
    }
    return null;
  }

  public static resetToDefaults(): void {
    this.skills = this.getDefaultSkills();
    this.persist();
  }

  private static persist(): void {
    try {
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem(SKILLS_STORAGE_KEY, JSON.stringify(this.skills));
      }
    } catch {}
  }
}
