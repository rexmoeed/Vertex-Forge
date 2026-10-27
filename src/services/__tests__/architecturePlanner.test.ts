import { describe, it, expect } from 'vitest';
import { ArchitecturePlanner } from '../architecturePlanner';
import { ScaffoldingContext } from '../../types/scaffolding';

describe('ArchitecturePlanner', () => {
  const baseContext: ScaffoldingContext = {
    projectName: 'analytics-portal',
    parentDir: '/projects',
    destinationPath: '/projects/analytics-portal',
    templateId: 'react-vite-ts',
    category: 'web',
    architecture: 'modular',
    packageManager: 'npm',
    initGit: true,
    selectedLibraries: [],
    projectDescription: 'Enterprise high-scale analytics dashboard with RBAC and microservice integrations',
  };

  it('plans high complexity architecture for enterprise keywords', async () => {
    const plan = await ArchitecturePlanner.planArchitecture(baseContext);

    expect(plan.complexity).toBe('large');
    expect(plan.boundaries.frontend).toBeDefined();
    expect(plan.entryPoints.length).toBeGreaterThan(0);
    expect(plan.files.length).toBeGreaterThan(0);
    expect(plan.devAndProdCommands.dev).toBeDefined();
  });

  it('plans small complexity architecture for minimal descriptions', async () => {
    const simpleContext: ScaffoldingContext = {
      ...baseContext,
      projectName: 'landing-page',
      projectDescription: 'A simple minimal static landing page',
      architecture: 'simple',
    };

    const plan = await ArchitecturePlanner.planArchitecture(simpleContext);
    expect(plan.complexity).toBe('small');
  });

  it('revises plan based on user instructions to simplify structure', async () => {
    const initialPlan = await ArchitecturePlanner.planArchitecture(baseContext);
    const revised = ArchitecturePlanner.revisePlan(initialPlan, 'Keep it simple and avoid unnecessary layers', baseContext);

    expect(revised.complexity).toBe('small');
    expect(revised.rationale).toContain('Revised to simplified minimal structure');
  });

  it('revises plan to introduce dedicated services directory when requested', async () => {
    const initialPlan = await ArchitecturePlanner.planArchitecture(baseContext);
    const revised = ArchitecturePlanner.revisePlan(initialPlan, 'Move API logic into services folder', baseContext);

    const hasService = revised.files.some(f => f.path.startsWith('src/services/'));
    expect(hasService).toBe(true);
  });
});
