import React, { useState, useEffect, useMemo } from 'react';
import { useIDE } from '../../context/IDEContext';
import {
  X,
  Sparkles,
  Layers,
  Check,
  ChevronRight,
  FolderTree,
  ShieldCheck,
  Play,
  RotateCw,
  AlertCircle,
  FileCode,
  PackageCheck,
  Folder,
  Terminal,
  Copy,
  ExternalLink,
  GitBranch,
  Cpu,
  Globe,
  Smartphone,
  Server,
  Zap,
} from 'lucide-react';
import {
  ProjectTypeCategory,
  ArchitectureType,
  PackageManager,
  TemplateDefinition,
  ScaffoldingContext,
  PlannedFileItem,
  ArchitecturePlan,
  CreationLogEntry,
  PathValidationResult,
  CreationExecutionResult,
} from '../../types/scaffolding';
import { TemplateRegistry } from '../../services/templateRegistry';
import { ArchitecturePlanner } from '../../services/architecturePlanner';
import { ScaffoldingEngine } from '../../services/scaffoldingEngine';
import { NamingEngine } from '../../services/namingEngine';
import { DesktopBridge } from '../../services/desktopBridge';
import { ProjectStructureEditor } from './ProjectStructureEditor';

interface ProjectCreationWizardProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ProjectCreationWizard: React.FC<ProjectCreationWizardProps> = ({ isOpen, onClose }) => {
  const { openLocalFolder, logAgentAction } = useIDE();

  // Wizard Steps:
  // 1: Project Details & Validation
  // 2: Template & Stack Selection
  // 3: Architecture Planning & Structure Editor
  // 4: Real Filesystem Creation & Verification
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);

  // Form State (Step 1)
  const [projectName, setProjectName] = useState('vertex-commerce-app');
  const [projectDescription, setProjectDescription] = useState('Modern e-commerce platform with reactive product catalog, shopping cart, and mock API services.');
  const [category, setCategory] = useState<ProjectTypeCategory>('web');
  const [parentDir, setParentDir] = useState(
    typeof window !== 'undefined' ? '/workspace/projects' : 'C:/Projects'
  );
  const [packageManager, setPackageManager] = useState<PackageManager>('npm');
  const [architecture, setArchitecture] = useState<ArchitectureType>('feature-based');
  const [initGit, setInitGit] = useState(true);

  // Validation & Conflict State
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

  // Fast Scaffold (skip review for rapid creation)
  const handleFastCreate = async () => {
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

    if (result.success) {
      logAgentAction(
        'Architect',
        `Fast-scaffolded "${ctx.projectName}" on filesystem at ${result.projectPath}`,
        'success'
      );
    }
  };

  const handleRevealInExplorer = () => {
    setRevealNotice(true);
    setTimeout(() => setRevealNotice(false), 3000);
  };

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

  if (!isOpen) return null;

  // Build Context helper
  const buildContext = (): ScaffoldingContext => ({
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
  });

  // Handle Directory Browser
  const handleBrowseParentDir = async () => {
    const selected = await DesktopBridge.openDirectoryDialog();
    if (selected) {
      setParentDir(selected);
    }
  };

  // Move from Step 1 to Step 2
  const handleProceedToTemplates = () => {
    if (!validationResult.valid) return;
    setStep(2);
  };

  // Move from Step 2 to Step 3 (Run AI Architecture Planner)
  const handleGenerateArchitecturePlan = async () => {
    setIsPlanning(true);
    setStep(3);

    const ctx = buildContext();
    const generatedPlan = await ArchitecturePlanner.planArchitecture(ctx);
    setPlan(generatedPlan);
    setPlannedFiles(generatedPlan.files);
    setIsPlanning(false);
  };

  // Revise plan in Step 3
  const handleRevisePlan = (instruction: string) => {
    if (!plan) return;
    const ctx = buildContext();
    const revised = ArchitecturePlanner.revisePlan(plan, instruction, ctx);
    setPlan(revised);
    setPlannedFiles(revised.files);
  };

  // Reset to recommended blueprint
  const handleResetToBlueprint = async () => {
    const ctx = buildContext();
    const freshPlan = await ArchitecturePlanner.planArchitecture(ctx);
    setPlan(freshPlan);
    setPlannedFiles(freshPlan.files);
  };

  // Step 4: Execute Real Filesystem Scaffolding
  const handleExecuteCreation = async () => {
    setStep(4);
    setIsExecuting(true);
    setCreationProgress(5);
    setCreationLogs([]);

    const ctx = buildContext();

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

    if (result.success) {
      logAgentAction(
        'Architect',
        `Successfully generated "${ctx.projectName}" on filesystem at ${result.projectPath}`,
        'success'
      );
    }
  };

  // Open generated project immediately in Vertex Forge
  const handleOpenCreatedProject = async () => {
    if (!executionResult || !executionResult.projectPath) return;
    onClose();
    await openLocalFolder(executionResult.projectPath);
  };

  // Copy project path to clipboard
  const handleCopyPath = () => {
    if (!finalProjectPath) return;
    navigator.clipboard.writeText(finalProjectPath);
    setCopiedPath(true);
    setTimeout(() => setCopiedPath(false), 2000);
  };

  // Category Selector Cards
  const categories: Array<{ id: ProjectTypeCategory; label: string; icon: any; desc: string }> = [
    { id: 'web', label: 'Web Applications', icon: Globe, desc: 'React, Next.js, Vue, Svelte, Astro' },
    { id: 'mobile', label: 'Mobile Apps', icon: Smartphone, desc: 'React Native, Expo, Flutter' },
    { id: 'backend', label: 'Backend APIs', icon: Server, desc: 'Express, FastAPI, NestJS, Go, Rust' },
    { id: 'fullstack', label: 'Full-Stack Solutions', icon: Zap, desc: 'Decoupled Client + Server Architectures' },
  ];

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-xs flex items-center justify-center z-50 p-4 select-none">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-3xl shadow-2xl overflow-hidden flex flex-col text-slate-100 max-h-[92vh]">
        
        {/* Wizard Top Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/80">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-600 flex items-center justify-center text-white font-bold text-sm shadow-md shadow-indigo-500/20">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white flex items-center gap-2">
                <span>New Project Engine</span>
                <span className="text-[10px] font-mono font-medium px-2 py-0.5 bg-indigo-500/10 text-indigo-400 rounded-full border border-indigo-500/20">
                  Production Scaffolder
                </span>
              </h2>
              <p className="text-xs text-slate-400">Filesystem-backed multi-stack architecture generator</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Step Navigation Indicator */}
            <div className="flex items-center gap-1.5 text-[11px] font-mono text-slate-500">
              <span className={step === 1 ? 'text-indigo-400 font-bold' : step > 1 ? 'text-emerald-400' : ''}>1. Details</span>
              <span>&gt;</span>
              <span className={step === 2 ? 'text-indigo-400 font-bold' : step > 2 ? 'text-emerald-400' : ''}>2. Stack</span>
              <span>&gt;</span>
              <span className={step === 3 ? 'text-indigo-400 font-bold' : step > 3 ? 'text-emerald-400' : ''}>3. Architecture</span>
              <span>&gt;</span>
              <span className={step === 4 ? 'text-emerald-400 font-bold' : ''}>4. Scaffold</span>
            </div>

            <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Wizard Scrollable Body */}
        <div className="p-6 overflow-y-auto flex-1 flex flex-col gap-6">

          {/* ======================================================== */}
          {/* STEP 1: PROJECT DETAILS, DESTINATION, CONFLICT CHECKS    */}
          {/* ======================================================== */}
          {step === 1 && (
            <div className="flex flex-col gap-5">
              {/* Category Selector */}
              <div className="flex flex-col gap-2">
                <label className="text-xs font-bold text-slate-300 uppercase tracking-wider">Choose Project Domain</label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5">
                  {categories.map(c => {
                    const Icon = c.icon;
                    const isSelected = category === c.id;
                    return (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => setCategory(c.id)}
                        className={`p-3 rounded-xl border text-left flex flex-col gap-1 transition ${
                          isSelected
                            ? 'bg-indigo-600/20 border-indigo-500 text-white shadow-sm shadow-indigo-500/20'
                            : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <Icon className={`w-4 h-4 ${isSelected ? 'text-indigo-400' : 'text-slate-500'}`} />
                          {isSelected && <Check className="w-3.5 h-3.5 text-indigo-400" />}
                        </div>
                        <span className="text-xs font-bold mt-1 text-slate-100">{c.label}</span>
                        <span className="text-[10px] text-slate-400 leading-tight">{c.desc}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Name & Parent Destination */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-slate-200">Project Name</label>
                  <input
                    type="text"
                    value={projectName}
                    onChange={e => setProjectName(e.target.value)}
                    placeholder="e.g. taskflow-portal"
                    className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500 font-mono"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-slate-200">Parent Directory Location</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={parentDir}
                      onChange={e => setParentDir(e.target.value)}
                      placeholder="/workspace/projects"
                      className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500 font-mono"
                    />
                    <button
                      type="button"
                      onClick={handleBrowseParentDir}
                      className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-xs font-medium shrink-0"
                    >
                      Browse...
                    </button>
                  </div>
                </div>
              </div>

              {/* Live Final Destination Preview & Conflict Checker */}
              <div className={`p-3 rounded-xl border flex flex-col gap-1.5 text-xs transition ${
                !validationResult.valid
                  ? 'bg-rose-500/10 border-rose-500/40 text-rose-300'
                  : validationResult.warning
                  ? 'bg-amber-500/10 border-amber-500/40 text-amber-300'
                  : 'bg-slate-950 border-slate-800 text-slate-300'
              }`}>
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-[11px] text-slate-400">Target Filesystem Directory</span>
                  {isValidatingPath && (
                    <span className="text-[10px] text-indigo-400 animate-pulse flex items-center gap-1">
                      <RotateCw className="w-3 h-3 animate-spin" /> Checking conflict...
                    </span>
                  )}
                  {!isValidatingPath && validationResult.valid && !validationResult.warning && (
                    <span className="text-[10px] text-emerald-400 font-medium flex items-center gap-1">
                      <Check className="w-3 h-3" /> Ready on disk
                    </span>
                  )}
                </div>

                <div className="flex items-center justify-between font-mono text-[11px]">
                  <span className="truncate">{finalProjectPath}</span>
                  <button
                    onClick={handleCopyPath}
                    className="p-1 text-slate-400 hover:text-white rounded"
                    title="Copy path"
                  >
                    <Copy className="w-3.5 h-3.5" />
                  </button>
                </div>

                {!validationResult.valid && (
                  <p className="text-[11px] text-rose-400 flex items-center gap-1.5 pt-1 border-t border-rose-500/20">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                    <span>{validationResult.error}</span>
                  </p>
                )}

                {validationResult.warning && (
                  <p className="text-[11px] text-amber-300 flex items-center gap-1.5 pt-1 border-t border-amber-500/20">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                    <span>{validationResult.warning}</span>
                  </p>
                )}
              </div>

              {/* Natural Language Prompt & Goal */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-slate-200">
                  Project Description & Architectural Requirements
                </label>
                <textarea
                  value={projectDescription}
                  onChange={e => setProjectDescription(e.target.value)}
                  placeholder="Describe your requirements: e.g. Customer management portal with React 19, Tailwind, authentication, PostgreSQL database, and automated tests."
                  className="bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-indigo-500 h-20 resize-none leading-relaxed"
                />
              </div>

              {/* Package Manager & Architecture Preference */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="flex flex-col gap-1">
                  <label className="text-[11px] text-slate-400 font-semibold">Package Manager</label>
                  <select
                    value={packageManager}
                    onChange={e => setPackageManager(e.target.value as PackageManager)}
                    className="bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-indigo-500"
                  >
                    <option value="npm">npm</option>
                    <option value="pnpm">pnpm</option>
                    <option value="yarn">yarn</option>
                    <option value="bun">bun</option>
                    <option value="pip">pip (Python)</option>
                    <option value="cargo">cargo (Rust)</option>
                    <option value="go">go (Go modules)</option>
                  </select>
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-[11px] text-slate-400 font-semibold">Architecture Pattern</label>
                  <select
                    value={architecture}
                    onChange={e => setArchitecture(e.target.value as ArchitectureType)}
                    className="bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-indigo-500"
                  >
                    <option value="feature-based">Feature-Based (Recommended for scalability)</option>
                    <option value="modular">Modular / Layered (Standard full-stack)</option>
                    <option value="clean">Clean Architecture (Domain-driven)</option>
                    <option value="simple">Simple / Minimal (Small apps & prototypes)</option>
                  </select>
                </div>

                <div className="flex items-center gap-2 pt-5">
                  <input
                    type="checkbox"
                    id="initGitCheck"
                    checked={initGit}
                    onChange={e => setInitGit(e.target.checked)}
                    className="rounded border-slate-700 bg-slate-950 text-indigo-600 focus:ring-0"
                  />
                  <label htmlFor="initGitCheck" className="text-xs text-slate-300 cursor-pointer flex items-center gap-1.5">
                    <GitBranch className="w-3.5 h-3.5 text-indigo-400" />
                    <span>Initialize Git Repository</span>
                  </label>
                </div>
              </div>
            </div>
          )}

          {/* ======================================================== */}
          {/* STEP 2: TEMPLATE SELECTION & COMPATIBLE LIBRARIES        */}
          {/* ======================================================== */}
          {step === 2 && (
            <div className="flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xs font-bold text-white uppercase tracking-wider">Select Technology Template</h3>
                  <p className="text-[11px] text-slate-400">Production-validated stacks with functioning entry points and test configurations</p>
                </div>
                <span className="text-xs font-mono text-indigo-400">{filteredTemplates.length} of {availableTemplates.length} stacks</span>
              </div>

              {/* Template Search Filter */}
              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  <input
                    type="text"
                    value={templateSearch}
                    onChange={e => setTemplateSearch(e.target.value)}
                    placeholder="Search templates by framework, language, or stack (e.g. Next, React, Vue, FastAPI, Go, Rust, Flutter)..."
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 font-sans"
                  />
                  <Layers className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
                </div>
                {templateSearch && (
                  <button
                    onClick={() => setTemplateSearch('')}
                    className="px-2.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-medium"
                  >
                    Clear
                  </button>
                )}
              </div>

              {/* Template Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-[260px] overflow-y-auto pr-1">
                {filteredTemplates.map(t => {
                  const isSelected = selectedTemplateId === t.id;
                  return (
                    <div
                      key={t.id}
                      onClick={() => setSelectedTemplateId(t.id)}
                      className={`p-3.5 rounded-xl border cursor-pointer transition-all flex flex-col gap-2 ${
                        isSelected
                          ? 'bg-indigo-600/20 border-indigo-500 text-white shadow-md shadow-indigo-500/20'
                          : 'bg-slate-950/70 border-slate-800 text-slate-300 hover:border-slate-700 hover:bg-slate-900/60'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-lg">{t.icon}</span>
                          <span className="text-xs font-bold text-white">{t.name}</span>
                          {t.badge && (
                            <span className="text-[9px] font-mono px-1.5 py-0.2 bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 rounded">
                              {t.badge}
                            </span>
                          )}
                        </div>
                        {isSelected && <Check className="w-4 h-4 text-indigo-400" />}
                      </div>

                      <p className="text-[11px] text-slate-400 leading-relaxed">{t.description}</p>

                      <div className="flex flex-wrap gap-1 mt-1">
                        {t.frameworks.map((fw, i) => (
                          <span key={i} className="text-[10px] font-mono px-2 py-0.5 bg-slate-900 border border-slate-800 text-slate-300 rounded-md">
                            {fw}
                          </span>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Compatible Libraries / Add-ons */}
              {currentTemplate && currentTemplate.compatibleLibraries.length > 0 && (
                <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 flex flex-col gap-2.5">
                  <span className="text-xs font-bold text-slate-300">Compatible Libraries & Tooling</span>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {currentTemplate.compatibleLibraries.map(lib => {
                      const isChecked = selectedLibraries.includes(lib.id);
                      return (
                        <label
                          key={lib.id}
                          className="flex items-center gap-2.5 p-2 bg-slate-900/80 border border-slate-800 rounded-lg cursor-pointer hover:border-slate-700 text-xs"
                        >
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => {
                              setSelectedLibraries(prev =>
                                isChecked ? prev.filter(id => id !== lib.id) : [...prev, lib.id]
                              );
                            }}
                            className="rounded border-slate-700 bg-slate-950 text-indigo-600 focus:ring-0"
                          />
                          <div className="flex flex-col">
                            <span className="font-semibold text-slate-200">{lib.name}</span>
                            <span className="text-[10px] text-slate-500">{lib.description}</span>
                          </div>
                        </label>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ======================================================== */}
          {/* STEP 3: AI ARCHITECTURE PLANNER & STRUCTURE EDITOR       */}
          {/* ======================================================== */}
          {step === 3 && plan && (
            <div className="flex flex-col gap-4">
              {/* Architecture Summary Banner */}
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 flex flex-col gap-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Cpu className="w-4 h-4 text-indigo-400" />
                    <span className="text-xs font-bold text-indigo-300 uppercase tracking-wider">
                      Architectural Blueprint
                    </span>
                  </div>
                  <span className="text-[10px] font-mono px-2 py-0.5 bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 rounded-full font-bold uppercase">
                    {plan.complexity} Scale
                  </span>
                </div>

                <p className="text-xs text-slate-300 leading-relaxed font-sans">{plan.summary}</p>
                <p className="text-[11px] text-slate-400 italic">{plan.rationale}</p>

                {/* Boundaries Map */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-2 pt-2 border-t border-slate-800/80 text-[11px]">
                  {plan.boundaries.frontend && (
                    <div className="p-2 bg-slate-900 border border-slate-800 rounded">
                      <span className="text-[10px] text-slate-500 block uppercase font-bold">Frontend Boundary</span>
                      <span className="text-slate-300 font-mono text-[10px]">{plan.boundaries.frontend}</span>
                    </div>
                  )}
                  {plan.boundaries.backend && (
                    <div className="p-2 bg-slate-900 border border-slate-800 rounded">
                      <span className="text-[10px] text-slate-500 block uppercase font-bold">Backend Boundary</span>
                      <span className="text-slate-300 font-mono text-[10px]">{plan.boundaries.backend}</span>
                    </div>
                  )}
                  {plan.boundaries.authentication && (
                    <div className="p-2 bg-slate-900 border border-slate-800 rounded">
                      <span className="text-[10px] text-slate-500 block uppercase font-bold">Authentication</span>
                      <span className="text-slate-300 font-mono text-[10px]">{plan.boundaries.authentication}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Interactive Structure Editor */}
              <ProjectStructureEditor
                files={plannedFiles}
                plan={plan}
                onUpdateFiles={setPlannedFiles}
                onRevisePlan={handleRevisePlan}
                onResetToRecommended={handleResetToBlueprint}
              />
            </div>
          )}

          {/* ======================================================== */}
          {/* STEP 4: REAL FILESYSTEM EXECUTION & LIVE PROGRESS        */}
          {/* ======================================================== */}
          {step === 4 && (
            <div className="flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xs font-bold text-white">Filesystem Scaffolding & Verification</h3>
                  <p className="text-[11px] text-slate-400 font-mono">{finalProjectPath}</p>
                </div>
                <span className="text-xs font-mono font-bold text-emerald-400">{creationProgress}%</span>
              </div>

              {/* Real Progress Bar */}
              <div className="w-full h-2.5 bg-slate-950 border border-slate-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-indigo-500 via-cyan-400 to-emerald-400 transition-all duration-300"
                  style={{ width: `${creationProgress}%` }}
                />
              </div>

              {/* Log View Header Controls */}
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span className="font-mono flex items-center gap-1.5">
                  <Terminal className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Real-time Operation Stream ({creationLogs.length} events)</span>
                </span>
                <button
                  type="button"
                  onClick={() => setShowLogs(!showLogs)}
                  className="px-2 py-0.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded text-[11px] border border-slate-700 transition"
                >
                  {showLogs ? 'Hide Creation Log' : 'View Creation Log'}
                </button>
              </div>

              {/* Live Streaming Terminal Logs */}
              {showLogs && (
                <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 font-mono text-xs text-slate-300 flex flex-col gap-1.5 h-52 overflow-y-auto">
                  {creationLogs.map(log => (
                    <div key={log.id} className="flex items-start gap-2">
                      <span className="text-slate-600 select-none">&gt;</span>
                      <span
                        className={
                          log.type === 'success'
                            ? 'text-emerald-400 font-bold'
                            : log.type === 'warn'
                            ? 'text-amber-400'
                            : log.type === 'error'
                            ? 'text-rose-400 font-bold'
                            : 'text-slate-300'
                        }
                      >
                        {log.message}
                      </span>
                    </div>
                  ))}
                </div>
              )}

              {/* Final Completion Card */}
              {executionResult && executionResult.success && (
                <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-xl flex flex-col gap-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <PackageCheck className="w-6 h-6 text-emerald-400 shrink-0" />
                      <div>
                        <h4 className="text-xs font-bold text-emerald-300">Project Scaffolding Complete!</h4>
                        <p className="text-[11px] text-emerald-400/80">
                          {executionResult.createdFilesCount} real files and {executionResult.createdDirsCount} directories generated on disk. Verified and ready.
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={handleRevealInExplorer}
                        className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg text-xs font-medium flex items-center gap-1.5 transition"
                        title="Reveal project directory in system file explorer"
                      >
                        <ExternalLink className="w-3.5 h-3.5 text-cyan-400" />
                        <span>Reveal in File Explorer</span>
                      </button>

                      <button
                        onClick={handleCopyPath}
                        className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg text-xs font-medium flex items-center gap-1.5 transition"
                      >
                        <Copy className="w-3.5 h-3.5" />
                        <span>{copiedPath ? 'Copied!' : 'Copy Path'}</span>
                      </button>

                      <button
                        onClick={handleOpenCreatedProject}
                        className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold shadow flex items-center gap-1.5 transition"
                      >
                        <Play className="w-3.5 h-3.5 fill-current" />
                        <span>Open Project in Editor</span>
                      </button>
                    </div>
                  </div>

                  {revealNotice && (
                    <div className="p-2.5 bg-slate-900 border border-cyan-500/30 rounded-lg text-xs font-mono text-cyan-300 flex items-center gap-2">
                      <Check className="w-4 h-4 text-cyan-400 shrink-0" />
                      <span>Project directory revealed: {finalProjectPath}</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

        </div>

        {/* Wizard Footer Controls */}
        <div className="px-6 py-3.5 border-t border-slate-800 bg-slate-950/80 flex items-center justify-between">
          {step > 1 && step < 4 ? (
            <button
              onClick={() => setStep((s: number) => (s - 1) as any)}
              className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-medium"
            >
              Back
            </button>
          ) : <div />}

          <div className="flex items-center gap-2.5">
            <button
              onClick={onClose}
              className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-medium"
            >
              {step === 4 && executionResult?.success ? 'Close' : 'Cancel'}
            </button>

            {step === 1 && (
              <button
                onClick={handleProceedToTemplates}
                disabled={!validationResult.valid || isValidatingPath}
                className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-lg text-xs font-bold flex items-center gap-1 shadow"
              >
                <span>Choose Stack & Template</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            )}

            {step === 2 && (
              <>
                <button
                  type="button"
                  onClick={handleFastCreate}
                  className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition"
                  title="Generate instantly with sensible defaults without reviewing folder tree"
                >
                  <Zap className="w-3.5 h-3.5 text-amber-400" />
                  <span>Fast Scaffold</span>
                </button>
                <button
                  type="button"
                  onClick={handleGenerateArchitecturePlan}
                  className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-bold flex items-center gap-1 shadow transition"
                >
                  <span>Plan Architecture</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </>
            )}

            {step === 3 && (
              <button
                onClick={handleExecuteCreation}
                className="px-5 py-1.5 bg-gradient-to-r from-indigo-600 to-emerald-600 hover:from-indigo-500 hover:to-emerald-500 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Create Project on Disk</span>
              </button>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};
