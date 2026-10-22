import { describe, it, expect, beforeEach } from 'vitest';
import { RecentProjects } from '../recentProjects';

describe('RecentProjectsService', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('returns empty array when no recent projects stored', () => {
    expect(RecentProjects.getRecentProjects()).toEqual([]);
  });

  it('adds a project and deduplicates by rootPath', () => {
    RecentProjects.addProject({
      name: 'Alpha Project',
      rootPath: '/workspaces/alpha',
      frameworks: ['React', 'Vite'],
    });

    const list = RecentProjects.getRecentProjects();
    expect(list.length).toBe(1);
    expect(list[0].name).toBe('Alpha Project');
    expect(list[0].path).toBe('/workspaces/alpha');

    // Add same project again
    RecentProjects.addProject({
      name: 'Alpha Project Updated',
      rootPath: '/workspaces/alpha',
      frameworks: ['React', 'Next.js'],
    });

    const updatedList = RecentProjects.getRecentProjects();
    expect(updatedList.length).toBe(1);
    expect(updatedList[0].name).toBe('Alpha Project Updated');
  });

  it('removes a project by id or path', () => {
    RecentProjects.addProject({
      id: 'proj-1',
      name: 'Beta Project',
      rootPath: '/workspaces/beta',
    });

    expect(RecentProjects.getRecentProjects().length).toBe(1);

    RecentProjects.removeProject('/workspaces/beta');
    expect(RecentProjects.getRecentProjects().length).toBe(0);
  });

  it('clears all recent projects', () => {
    RecentProjects.addProject({ name: 'One', rootPath: '/one' });
    RecentProjects.addProject({ name: 'Two', rootPath: '/two' });
    expect(RecentProjects.getRecentProjects().length).toBe(2);

    RecentProjects.clearAll();
    expect(RecentProjects.getRecentProjects().length).toBe(0);
  });
});
