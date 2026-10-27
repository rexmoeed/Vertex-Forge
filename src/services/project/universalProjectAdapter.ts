import { ProjectProfile } from '../../types/project';

export interface ProjectAdapter {
  id: string;
  supports(profile: ProjectProfile): boolean;
  getCommands(profile: ProjectProfile): Record<string, string>;
  getRunConfiguration(profile: ProjectProfile): { devCommand: string; defaultPort: number };
  getTestConfiguration(profile: ProjectProfile): { testCommand: string };
  getBuildConfiguration(profile: ProjectProfile): { buildCommand: string };
}

export class UniversalProjectAdapter implements ProjectAdapter {
  id = 'universal-adapter';

  supports(_profile: ProjectProfile): boolean {
    return true; // fallback for all projects
  }

  getCommands(profile: ProjectProfile): Record<string, string> {
    const pm = profile.packageManager || 'npm';
    const run = pm === 'npm' ? 'npm run' : pm;

    return {
      dev: profile.scripts['dev'] ? `${run} dev` : profile.scripts['start'] ? `${run} start` : 'npm run dev',
      build: profile.scripts['build'] ? `${run} build` : 'npm run build',
      test: profile.scripts['test'] ? `${run} test` : 'npm test',
      lint: profile.scripts['lint'] ? `${run} lint` : 'npm run lint',
      install: pm === 'npm' ? 'npm install' : `${pm} install`,
    };
  }

  getRunConfiguration(profile: ProjectProfile): { devCommand: string; defaultPort: number } {
    const pm = profile.packageManager || 'npm';
    const run = pm === 'npm' ? 'npm run' : pm;

    let port = 3000;
    if (profile.frontend?.name?.includes('Vite')) port = 5173;
    if (profile.frontend?.name?.includes('Next')) port = 3000;
    if (profile.backend?.name?.includes('FastAPI')) port = 8000;
    if (profile.backend?.name?.includes('Flask')) port = 5000;

    const devCmd = profile.scripts['dev']
      ? `${run} dev`
      : profile.scripts['start']
      ? `${run} start`
      : 'npm run dev';

    return { devCommand: devCmd, defaultPort: port };
  }

  getTestConfiguration(profile: ProjectProfile): { testCommand: string } {
    const pm = profile.packageManager || 'npm';
    const run = pm === 'npm' ? 'npm run' : pm;
    return {
      testCommand: profile.scripts['test'] ? `${run} test` : 'npm test',
    };
  }

  getBuildConfiguration(profile: ProjectProfile): { buildCommand: string } {
    const pm = profile.packageManager || 'npm';
    const run = pm === 'npm' ? 'npm run' : pm;
    return {
      buildCommand: profile.scripts['build'] ? `${run} build` : 'npm run build',
    };
  }
}
