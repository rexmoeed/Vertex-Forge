import { ProjectReleaseVersion } from '../types/kos';

const VERSION_STORAGE_KEY = 'vertex_version_releases_v1';

export class VersioningService {
  private static releases: ProjectReleaseVersion[] = [];

  static {
    try {
      if (typeof localStorage !== 'undefined') {
        const stored = localStorage.getItem(VERSION_STORAGE_KEY);
        if (stored) this.releases = JSON.parse(stored);
      }
    } catch {}

    if (this.releases.length === 0) {
      this.releases = [
        {
          version: '1.2.0',
          bumpType: 'minor',
          changelog: 'Added in-app zero-native-dialog Open Folder modal, OpenRouter BYOK dynamic catalog, and responsive flex layout.',
          timestamp: Date.now() - 3600000 * 24,
          commitHash: '0ea7a79',
          releasedBy: 'Lead IDE Architect',
        },
        {
          version: '1.3.0',
          bumpType: 'minor',
          changelog: 'Added KOS-parity features: Credential Vault, Hard Rulebook Gates, Multi-AI Council, and Operator Console.',
          timestamp: Date.now(),
          commitHash: 'c8bc3f9',
          releasedBy: 'Principal Engineer',
        },
      ];
      this.persist();
    }
  }

  public static listReleases(): ProjectReleaseVersion[] {
    return [...this.releases];
  }

  public static getCurrentVersion(): string {
    return this.releases[0]?.version || '1.3.0';
  }

  public static bumpVersion(type: 'major' | 'minor' | 'patch', changelogSummary: string): ProjectReleaseVersion {
    const current = this.getCurrentVersion();
    const parts = current.split('.').map(Number);
    let [major, minor, patch] = parts;

    if (type === 'major') {
      major += 1;
      minor = 0;
      patch = 0;
    } else if (type === 'minor') {
      minor += 1;
      patch = 0;
    } else {
      patch += 1;
    }

    const newVersion = `${major}.${minor}.${patch}`;
    const release: ProjectReleaseVersion = {
      version: newVersion,
      bumpType: type,
      changelog: changelogSummary,
      timestamp: Date.now(),
      commitHash: Math.random().toString(16).slice(2, 9),
      releasedBy: 'Workspace Owner',
    };

    this.releases.unshift(release);
    this.persist();
    return release;
  }

  private static persist(): void {
    try {
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem(VERSION_STORAGE_KEY, JSON.stringify(this.releases));
      }
    } catch {}
  }
}
