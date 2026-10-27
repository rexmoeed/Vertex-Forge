import { useState, useEffect, useMemo, useCallback } from 'react';
import {
  ProjectTypeCategory,
  ArchitectureType,
  PackageManager,
  ScaffoldingContext,
  PlannedFileItem,
  ArchitecturePlan,
  CreationLogEntry,
  PathValidationResult,
  CreationExecutionResult,
} from '../types/scaffolding';
import { TemplateRegistry } from '../services/templateRegistry';
import { ArchitecturePlanner } from '../services/architecturePlanner';
import { ScaffoldingEngine } from '../services/scaffoldingEngine';
import { DesktopBridge } from '../services/desktopBridge';

export function useProjectCreationWizard(
  logAgentAction?: (agent: string, message: string, status?: 'info' | 'success' | 'warning' | 'error') => void,
  openLocalFolder?: (path?: string) => Promise<any> | any
) {
  // Wizard Steps: 1..4
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);

  // Form State (Step 1)
  const [projectName, setProjectName] = useState('vertex-commerce-app');
  const [projectDescription, setProjectDescription] = useState(
    'Modern e-commerce platform with reactive product catalog, shopping cart, and mock API services.'
  );
  const [category, setCategory] = useState<ProjectTypeCategory>('web');
  const [parentDir, setParentDir] = useState(
    typeof window !== 'undefined' ? '/workspace/projects' : 'C:/Projects'
  );
  const [packageManager, setPackageManager] = useState<PackageManager>('npm');
  const [architecture, setArchitecture] = useState<ArchitectureType>('feature-based');
  const [initGit, setInitGit] = useState(true);

  // Validation State
  const [validationResult, setValidationResult] = useState<PathValidationResult>({ valid: true });
  const [isValidatingPath, setIsValidatingPath] = useState(false);

  // Step 2: Selected Template & Add-ons
  const availableTemplates = useMemo(() => TemplateRegistry.getByCategory(category), [category]);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('web-react-vite');
  const [selectedLibraries, setSelectedLibraries] = useState<string[]>(['tailwind', 'zustand']);

  // Sync selected template when category changes
  useEffect(() => {
    if (availableTemplates.length > 0 && !availableTemplates.some(t => t.id === selectedTemplateId)) {
      setSelectedTemplateId(availableTemplates[0].id);
    }
  }, [category, availableTemplates, selectedTemplateId]);

  const currentTemplate = useMemo(
    () => TemplateRegistry.getById(selectedTemplateId) || availableTemplates[0],
    [selectedTemplateId, availableTemplates]
  );

  // Template Search Filter
  const [templateSearch, setTemplateSearch] = useState('');
  const filteredTemplates = useMemo(() => {
    if (!templateSearch.trim()) return availableTemplates;
    const q = templateSearch.toLowerCase();
    return availableTemplates.filter(
      t =>
        t.name.toLowerCase().includes(q) ||
        t.description.toLowerCase().includes(q) ||
        t.frameworks.some(f => f.toLowerCase().includes(q)) ||
        t.languages.some(l => l.toLowerCase().includes(q))
    );
  }, [availableTemplates, templateSearch]);

  // Step 3: Architecture Plan & File Manifest
  const [plan, setPlan] = useState<ArchitecturePlan | null>(null);
  const [plannedFiles, setPlannedFiles] = useState<PlannedFileItem[]>([]);
  const [isPlanning, setIsPlanning] = useState(false);

  // Step 4: Live Execution State
  const [creationStage, setCreationStage] = useState<string>('idle');
  const [creationProgress, setCreationProgress] = useState(0);
  const [creationLogs, setCreationLogs] = useState<CreationLogEntry[]>([]);
  const [executionResult, setExecutionResult] = useState<CreationExecutionResult | null>(null);
  const [isExecuting, setIsExecuting] = useState(false);
  const [copiedPath, setCopiedPath] = useState(false);
  const [showLogs, setShowLogs] = useState(true);
  const [revealNotice, setRevealNotice] = useState(false);

  // Dynamic final project path
  const finalProjectPath = useMemo(() => {
    const cleanParent = parentDir.replace(/\\/g, '/').replace(/\/+$/, '');
    const cleanName = projectName.trim() || 'project';
    return `${cleanParent}/${cleanName}`;
  }, [parentDir, projectName]);

  // Live Path Conflict & Validation Check
  useEffect(() => {
    let active = true;
    const timer = setTimeout(async () => {
      setIsValidatingPath(true);
      const res = await ScaffoldingEngine.validateProjectTarget(parentDir, projectName);
      if (active) {
        setValidationResult(res);
        setIsValidatingPath(false);
      }
    }, 250);
    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [parentDir, projectName]);

  // Build Context helper
  const buildContext = useCallback((): ScaffoldingContext => ({
    projectName: projectName.trim(),
    projectDescription: projectDescription.trim(),
    destinationPath: finalProjectPath,
    parentDir: parentDir.trim(),
    templateId: currentTemplate?.id || 'web-react-vite',
    category,
    architecture,
    packageManager,
    initGit,
    selectedLibraries,
  }), [
    projectName,
    projectDescription,
    finalProjectPath,
    parentDir,
    currentTemplate?.id,
    category,
    architecture,
    packageManager,
    initGit,
    selectedLibraries,
  ]);

  // Fast Scaffold
  const handleFastCreate = useCallback(async () => {
    const ctx = buildContext();
    const generatedPlan = await ArchitecturePlanner.planArchitecture(ctx);
    setPlan(generatedPlan);
    setPlannedFiles(generatedPlan.files);
    setStep(4);
    setIsExecuting(true);
    setCreationProgress(5);
    setCreationLogs([]);

    const result = await ScaffoldingEngine.executeCreation(
      ctx,
      generatedPlan.files,
      (progress, log, stage) => {
        setCreationProgress(progress);
        setCreationStage(stage);
        setCreationLogs(prev => [...prev, log]);
      }
    );

    setExecutionResult(result);
    setIsExecuting(false);

    if (result.success && logAgentAction) {
      logAgentAction(
        'Architect',
        `Fast-scaffolded "${ctx.projectName}" on filesystem at ${result.projectPath}`,
        'success'
      );
    }
  }, [buildContext, logAgentAction]);

  // Generate Architecture Plan
  const handleGeneratePlan = useCallback(async () => {
    setIsPlanning(true);
    const ctx = buildContext();
    try {
      const generatedPlan = await ArchitecturePlanner.planArchitecture(ctx);
      setPlan(generatedPlan);
      setPlannedFiles(generatedPlan.files);
      setStep(3);
    } finally {
      setIsPlanning(false);
    }
  }, [buildContext]);

  // Execute Creation
  const handleExecuteCreation = useCallback(async () => {
    const ctx = buildContext();
    setStep(4);
    setIsExecuting(true);
    setCreationProgress(5);
    setCreationLogs([]);

    const result = await ScaffoldingEngine.executeCreation(
      ctx,
      plannedFiles,
      (progress, log, stage) => {
        setCreationProgress(progress);
        setCreationStage(stage);
        setCreationLogs(prev => [...prev, log]);
      }
    );

    setExecutionResult(result);
    setIsExecuting(false);

    if (result.success && logAgentAction) {
      logAgentAction(
        'Architect',
        `Created "${ctx.projectName}" on filesystem at ${result.projectPath}`,
        'success'
      );
    }
  }, [buildContext, plannedFiles, logAgentAction]);

  // Handle Directory Browser
  const handleBrowseDirectory = useCallback(async () => {
    const selected = await DesktopBridge.openDirectoryDialog();
    if (selected) {
      setParentDir(selected);
    }
  }, []);

  const handleCopyPath = useCallback(() => {
    if (navigator?.clipboard) {
      navigator.clipboard.writeText(finalProjectPath);
      setCopiedPath(true);
      setTimeout(() => setCopiedPath(false), 2000);
    }
  }, [finalProjectPath]);

  const handleOpenCreatedProject = useCallback(async (onClose?: () => void) => {
    if (executionResult?.projectPath && openLocalFolder) {
      await openLocalFolder(executionResult.projectPath);
      if (onClose) onClose();
    }
  }, [executionResult?.projectPath, openLocalFolder]);

  const toggleLibrary = useCallback((libId: string) => {
    setSelectedLibraries(prev =>
      prev.includes(libId) ? prev.filter(l => l !== libId) : [...prev, libId]
    );
  }, []);

  return {
    step,
    setStep,
    projectName,
    setProjectName,
    projectDescription,
    setProjectDescription,
    category,
    setCategory,
    parentDir,
    setParentDir,
    packageManager,
    setPackageManager,
    architecture,
    setArchitecture,
    initGit,
    setInitGit,
    validationResult,
    isValidatingPath,
    availableTemplates,
    selectedTemplateId,
    setSelectedTemplateId,
    selectedLibraries,
    setSelectedLibraries,
    toggleLibrary,
    currentTemplate,
    templateSearch,
    setTemplateSearch,
    filteredTemplates,
    plan,
    setPlan,
    plannedFiles,
    setPlannedFiles,
    isPlanning,
    creationStage,
    creationProgress,
    creationLogs,
    executionResult,
    isExecuting,
    copiedPath,
    showLogs,
    setShowLogs,
    revealNotice,
    setRevealNotice,
    finalProjectPath,
    buildContext,
    handleFastCreate,
    handleGeneratePlan,
    handleExecuteCreation,
    handleBrowseDirectory,
    handleCopyPath,
    handleOpenCreatedProject,
  };
}
