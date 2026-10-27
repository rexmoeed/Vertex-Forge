import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useProjectCreationWizard } from '../useProjectCreationWizard';

vi.mock('../../services/scaffoldingEngine', () => ({
  ScaffoldingEngine: {
    validateProjectTarget: vi.fn().mockResolvedValue({ valid: true }),
    executeCreation: vi.fn().mockResolvedValue({
      success: true,
      projectPath: '/workspace/projects/test-app',
      createdFilesCount: 12,
      createdDirsCount: 4,
      durationMs: 120,
    }),
  },
}));

vi.mock('../../services/architecturePlanner', () => ({
  ArchitecturePlanner: {
    planArchitecture: vi.fn().mockResolvedValue({
      complexity: 'moderate',
      summary: 'Test architectural blueprint',
      rationale: 'Clean modern structure',
      boundaries: { frontend: 'src/*', backend: 'api/*' },
      files: [{ path: 'src/App.tsx', purpose: 'Root', action: 'create' }],
    }),
    revisePlan: vi.fn().mockReturnValue({
      complexity: 'moderate',
      summary: 'Revised plan',
      rationale: 'Custom instructions applied',
      boundaries: { frontend: 'src/*' },
      files: [{ path: 'src/Main.tsx', purpose: 'Root', action: 'create' }],
    }),
  },
}));

describe('useProjectCreationWizard Hook', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('initializes with default step 1, category web, and valid path', () => {
    const { result } = renderHook(() => useProjectCreationWizard());

    expect(result.current.step).toBe(1);
    expect(result.current.category).toBe('web');
    expect(result.current.packageManager).toBe('npm');
    expect(result.current.projectName).toBe('vertex-commerce-app');
    expect(result.current.availableTemplates.length).toBeGreaterThan(0);
  });

  it('updates category and switches active templates', () => {
    const { result } = renderHook(() => useProjectCreationWizard());

    act(() => {
      result.current.setCategory('backend');
    });

    expect(result.current.category).toBe('backend');
    expect(result.current.availableTemplates.length).toBeGreaterThan(0);
  });

  it('toggles libraries in selected stack', () => {
    const { result } = renderHook(() => useProjectCreationWizard());

    act(() => {
      result.current.toggleLibrary('tailwind');
    });
    expect(result.current.selectedLibraries).not.toContain('tailwind');

    act(() => {
      result.current.toggleLibrary('tailwind');
    });
    expect(result.current.selectedLibraries).toContain('tailwind');
  });

  it('generates architecture plan and advances to step 3', async () => {
    const { result } = renderHook(() => useProjectCreationWizard());

    await act(async () => {
      await result.current.handleGeneratePlan();
    });

    expect(result.current.step).toBe(3);
    expect(result.current.plan).toBeDefined();
    expect(result.current.plannedFiles.length).toBeGreaterThan(0);
  });

  it('executes fast scaffolding directly to step 4', async () => {
    const logAction = vi.fn();
    const { result } = renderHook(() => useProjectCreationWizard(logAction));

    await act(async () => {
      await result.current.handleFastCreate();
    });

    expect(result.current.step).toBe(4);
    expect(result.current.executionResult?.success).toBe(true);
    expect(logAction).toHaveBeenCalledWith('Architect', expect.any(String), 'success');
  });
});
