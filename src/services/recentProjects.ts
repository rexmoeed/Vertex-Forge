import { RecentProject, ProjectProfile } from '../types/project';

const RECENT_PROJECTS_KEY = 'vertex_ide_recent_projects_v2';

export const INITIAL_RECENT_PROJECTS: RecentProject[] = [];

class RecentProjectsService {
  public getRecentProjects(): RecentProject[] {
    if (typeof window === 'undefined') return INITIAL_RECENT_PROJECTS;
    try {
      const stored = localStorage.getItem(RECENT_PROJECTS_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch (e) {
      console.warn('Failed to load recent projects from localStorage:', e);
    }
    return INITIAL_RECENT_PROJECTS;
  }

  public saveRecentProjects(projects: RecentProject[]) {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(RECENT_PROJECTS_KEY, JSON.stringify(projects));
    } catch (e) {
      console.warn('Failed to save recent projects to localStorage:', e);
    }
  }

  public addProject(profile: Partial<ProjectProfile> & { rootPath: string; name: string }) {
    const list = this.getRecentProjects().filter(p => p.path !== profile.rootPath);
    const newEntry: RecentProject = {
      id: profile.id || `proj-${Date.now()}`,
      path: profile.rootPath,
      name: profile.name,
      lastOpened: Date.now(),
      framework: profile.frameworks?.join(' + ') || profile.frontend?.name || 'TypeScript Workspace',
      packageManager: profile.packageManager || 'npm',
      languages: (profile.languages as string[]) || ['TypeScript'],
    };
    const updated = [newEntry, ...list].slice(0, 15);
    this.saveRecentProjects(updated);
  }

  public removeProject(idOrPath: string) {
    const list = this.getRecentProjects().filter(p => p.id !== idOrPath && p.path !== idOrPath);
    this.saveRecentProjects(list);
  }

  public clearAll() {
    this.saveRecentProjects([]);
  }
}

export const RecentProjects = new RecentProjectsService();
