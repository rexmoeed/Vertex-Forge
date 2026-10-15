import React, { useState, useEffect } from 'react';
import {
  X,
  ArrowRight,
  ArrowLeft,
  Sparkles,
  FolderOpen,
  Code2,
  Bot,
  Terminal,
  Bug,
  ShieldCheck,
  Keyboard,
  CheckCircle2,
  Zap,
  Layers,
  Cpu,
  Compass,
  Play,
  Flame,
  Check,
} from 'lucide-react';

interface WalkthroughTourModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenProjectWizard?: () => void;
}

interface TourStep {
  id: string;
  badge: string;
  title: string;
  tagline: string;
  icon: React.ElementType;
  iconColor: string;
  iconBg: string;
  purpose: string;
  whatItDoes: string[];
  hotkeys?: { key: string; label: string }[];
  visualHighlights: { label: string; value: string; desc: string }[];
}

export const WalkthroughTourModal: React.FC<WalkthroughTourModalProps> = ({
  isOpen,
  onClose,
  onOpenProjectWizard,
}) => {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);

  const steps: TourStep[] = [
    {
      id: 'welcome',
      badge: 'Welcome to Vertex Forge',
      title: 'Autonomous AI Software Engineering Studio',
      tagline: 'A complete developer workstation unifying real filesystem execution, multi-agent swarms, and AI coding.',
      icon: Sparkles,
      iconColor: 'text-amber-400',
      iconBg: 'bg-amber-500/10 border-amber-500/20',
      purpose: 'Provide professional developers with an uncompromised, zero-mock IDE where AI agents autonomously write, test, debug, and ship real code.',
      whatItDoes: [
        'Direct local machine file manipulation (Windows, Linux, macOS) with zero simulated outputs.',
        'Interactive WebSocket PTY terminal running real PowerShell, CMD, Bash, or WSL sessions.',
        'BYOK Multi-Provider Hub supporting Anthropic Claude, Google Gemini, OpenAI, and Local LAN LLMs.',
        'Pre-packaged Windows installer with automatic background updates from GitHub.',
      ],
      hotkeys: [
        { key: 'Cmd/Ctrl + Shift + P', label: 'Command Palette' },
        { key: 'Cmd/Ctrl + P', label: 'Quick Open' },
      ],
      visualHighlights: [
        { label: 'Intelligence', value: 'Multi-Model', desc: 'Claude 3.7, Gemini 2.5, GPT-4o, DeepSeek' },
        { label: 'Execution', value: '100% Real', desc: 'Real node-pty shells & OS disk operations' },
        { label: 'Governance', value: 'KOS Parity', desc: '17 enterprise safety gates & AES-256 vault' },
      ],
    },
    {
      id: 'workspace',
      badge: 'Step 1: Workspace & Filesystem',
      title: 'In-App Custom Workspace Navigator',
      tagline: 'No native OS popups — inspect drives, create folders, and manage bookmarks seamlessly.',
      icon: FolderOpen,
      iconColor: 'text-sky-400',
      iconBg: 'bg-sky-500/10 border-sky-500/20',
      purpose: 'Enable seamless navigation across any folder or disk on your computer while keeping AI agent writes strictly contained within your project root.',
      whatItDoes: [
        'Drive navigation for Windows (C:, D:, E:) with instant folder browsing and breadcrumbs.',
        'Automatic project stack detection (React, Next.js, Node, Python, Rust, Go, Vue).',
        'Recent project history bookmarks for instant one-click switching.',
        'Strict boundary enforcement blocking access to sensitive root paths or user credentials.',
      ],
      hotkeys: [
        { key: 'Cmd/Ctrl + P', label: 'Quick Open File' },
        { key: 'Cmd/Ctrl + Shift + F', label: 'Global Codebase Search' },
      ],
      visualHighlights: [
        { label: 'Drives', value: 'Full Access', desc: 'Mount any local directory or network path' },
        { label: 'Safety', value: 'Sandboxed', desc: 'Zero out-of-workspace destructive writes' },
        { label: 'Hot-Exit', value: 'Zero-Loss', desc: 'Remembers open tabs and scroll positions' },
      ],
    },
    {
      id: 'editor',
      badge: 'Step 2: Monaco Core & In-Editor Copilot',
      title: 'VS Code Editor Core & Inline Diff Editing',
      tagline: 'Full language diagnostics, bracket colorization, multi-cursor editing, and inline AI diff review.',
      icon: Code2,
      iconColor: 'text-indigo-400',
      iconBg: 'bg-indigo-500/10 border-indigo-500/20',
      purpose: 'Deliver full VS Code fidelity for code editing combined with instantaneous inline code generation and diff comparisons.',
      whatItDoes: [
        'Inline Code Edit (Cmd/Ctrl + K): Highlight code or place your cursor to propose changes with side-by-side diffs.',
        'Ghost-Text Tab Autocomplete: Fast multi-token prediction that accepts with a single Tab press.',
        'Side-by-side split diff reviewer with atomic Accept and Reject controls.',
        'TypeScript, JavaScript, Python, Rust, HTML, CSS diagnostics with auto-formatting.',
      ],
      hotkeys: [
        { key: 'Cmd/Ctrl + K', label: 'Inline AI Edit' },
        { key: 'Tab', label: 'Accept Ghost-Text' },
        { key: 'Cmd/Ctrl + S', label: 'Save & Snapshot' },
      ],
      visualHighlights: [
        { label: 'Engine', value: 'Monaco Core', desc: 'Identical editor engine powering VS Code' },
        { label: 'Diff Review', value: 'Side-by-Side', desc: 'Inspect additions and deletions before saving' },
        { label: 'History', value: 'Snapshots', desc: 'Local timeline rollback independent of Git' },
      ],
    },
    {
      id: 'composer',
      badge: 'Step 3: AI Chat & Context Composer',
      title: 'Deep Multi-File AI Collaboration',
      tagline: 'Attach files, git diffs, and terminal logs directly into context using @ mentions and / slash commands.',
      icon: Bot,
      iconColor: 'text-purple-400',
      iconBg: 'bg-purple-500/10 border-purple-500/20',
      purpose: 'Allow engineers to converse naturally with top-tier AI models while feeding exact codebase context and generating multi-file implementations.',
      whatItDoes: [
        'Cursor Composer (Cmd/Ctrl + I): Multi-file generation across complex file structures simultaneously.',
        '@ Mentions: Attach specific files (@file), folders (@folder), git diffs (@diff), or terminal logs.',
        '/ Slash Commands: Trigger specialized agent modes like /plan, /test, /review, and /fix.',
        'Autonomous Execution: Switch between Supervised Mode (approval required) and YOLO Mode (full autonomy).',
      ],
      hotkeys: [
        { key: 'Cmd/Ctrl + I', label: 'Cursor Composer' },
        { key: 'Cmd/Ctrl + Enter', label: 'Execute Task / Send' },
      ],
      visualHighlights: [
        { label: 'Context', value: '@ Mentions', desc: 'Precise AST symbol and file context binding' },
        { label: 'Workflows', value: '/ Commands', desc: 'Automated planning, testing, and fixing' },
        { label: 'Autonomy', value: 'YOLO Mode', desc: 'Continuous multi-step coding iterations' },
      ],
    },
    {
      id: 'swarm',
      badge: 'Step 4: Multi-Agent Parallel Swarm',
      title: '10 Team Leads & Parallel Task Execution',
      tagline: 'Breaks any request into an ordered Directed Acyclic Graph (DAG) with concurrency locking.',
      icon: Cpu,
      iconColor: 'text-emerald-400',
      iconBg: 'bg-emerald-500/10 border-emerald-500/20',
      purpose: 'Scale software development by assigning modular sub-tasks across 10 specialized Team Leads executing in parallel without file collisions.',
      whatItDoes: [
        'Dynamic Decomposition: Converts requests into a 10-task DAG spanning 4 sequential phases.',
        '10 Specialized Leads: Architect, Design System, Frontend, Backend, Database, Security, QA, DevOps, Docs, Release.',
        'RWLock File Reservation: Reader-Writer concurrency control prevents conflicting simultaneous file edits.',
        'Live Team Dashboard: Track each agent’s real-time progress, file reservations, and output artifacts.',
      ],
      hotkeys: [
        { key: 'Top Menu', label: 'Agents & Teams Tab' },
      ],
      visualHighlights: [
        { label: 'Team Leads', value: '10 Agents', desc: 'Specialized roles for every layer of the stack' },
        { label: 'Pipeline', value: '4-Phase DAG', desc: 'Discovery -> Foundations -> Assembly -> QA' },
        { label: 'Concurrency', value: 'RWLock', desc: 'Zero file collisions during parallel runs' },
      ],
    },
    {
      id: 'terminal',
      badge: 'Step 5: Interactive Terminal & DevOps',
      title: 'Real WebSocket PTY Shell & Dev Servers',
      tagline: 'Multi-tab interactive terminal with real node-pty processes and live port listeners.',
      icon: Terminal,
      iconColor: 'text-amber-400',
      iconBg: 'bg-amber-500/10 border-amber-500/20',
      purpose: 'Give developers complete terminal power inside the IDE with full interactive shell support, dev server monitoring, and natural language command synthesis.',
      whatItDoes: [
        'Spawns real OS terminal sessions (PowerShell, CMD, Git Bash, WSL) streaming over WebSockets.',
        'Terminal AI (Cmd/Ctrl + K in Terminal): Convert plain English instructions into safe, runnable shell commands.',
        'Background Dev Server Panel: Start, stop, and monitor local development servers with active port detection.',
        'Multi-tab dock with ANSI color support, terminal resizing, and persistent history.',
      ],
      hotkeys: [
        { key: 'Cmd/Ctrl + `', label: 'Toggle Terminal Dock' },
        { key: 'Cmd/Ctrl + K (Terminal)', label: 'Terminal AI' },
      ],
      visualHighlights: [
        { label: 'Shells', value: 'Native PTY', desc: 'PowerShell, CMD, Bash, WSL on real OS' },
        { label: 'Servers', value: 'Port Tracker', desc: 'Automatic dev server detection on port 3000+' },
        { label: 'Assistance', value: 'Terminal AI', desc: 'Prompt to shell command translation' },
      ],
    },
    {
      id: 'testing',
      badge: 'Step 6: Testing, Debugger & Self-Repair',
      title: 'Intelligent Test Discovery & DAP Debugger',
      tagline: 'Continuous Vitest assertion tracking, DAP breakpoints, and self-repair loops.',
      icon: Bug,
      iconColor: 'text-rose-400',
      iconBg: 'bg-rose-500/10 border-rose-500/20',
      purpose: 'Ensure code quality automatically by executing test suites, diagnosing failures, and allowing the AI agent to self-heal broken tests.',
      whatItDoes: [
        'Automated Test Discovery: Scans and runs Vitest/Jest unit and integration tests with live pass/fail status.',
        'Self-Healing Loop: When a test fails, the agent automatically reads stack traces, identifies bugs, and applies fixes.',
        'DAP Debugger (F5): Set breakpoints, step over (F10), step into (F11), and inspect variables during runtime.',
        'Problems Panel: Direct navigation to compile-time TypeScript errors and linter issues.',
      ],
      hotkeys: [
        { key: 'Cmd/Ctrl + Shift + T', label: 'Run Vitest Tests' },
        { key: 'F5 / Shift + F5', label: 'Start / Stop Debugger' },
        { key: 'F10 / F11', label: 'Step Over / Step Into' },
      ],
      visualHighlights: [
        { label: 'Test Suites', value: '164 Passing', desc: 'Full automated Vitest test suite integration' },
        { label: 'Self-Repair', value: 'Autonomous', desc: 'AI diagnoses and fixes failing test assertions' },
        { label: 'DAP Protocol', value: 'Full Stepping', desc: 'Breakpoints, callstack, and variable watches' },
      ],
    },
    {
      id: 'governance',
      badge: 'Step 7: Enterprise Vault & Auto-Updates',
      title: 'AES-256 Vault, Rulebook & Background Updates',
      tagline: 'Hard pre-execution gates, encrypted credentials, and seamless Windows auto-updating.',
      icon: ShieldCheck,
      iconColor: 'text-cyan-400',
      iconBg: 'bg-cyan-500/10 border-cyan-500/20',
      purpose: 'Keep your secrets, configurations, and environment secure with zero LLM leaks, plus effortless updates as new versions release.',
      whatItDoes: [
        'AES-256 Credential Vault: Secrets are referenced as vault:key; raw keys are never passed to the LLM.',
        'Rulebook Hard Gates: Prohibits destructive commands, git force pushes, or modifying sensitive files (.env).',
        'Secret & Entropy Scanner: Real-time Shannon entropy scanner warns if private keys appear in code.',
        'GitHub Background Auto-Update: Downloads updates silently in the background and prompts to restart.',
      ],
      hotkeys: [
        { key: 'F1', label: 'Keyboard Shortcuts' },
        { key: 'Top Menu -> Help', label: 'Check for Updates' },
      ],
      visualHighlights: [
        { label: 'Encryption', value: 'AES-256', desc: 'Zero credential leakage in logs or chat' },
        { label: 'Protection', value: 'Rulebook Gates', desc: 'Blocks force push & out-of-bounds writes' },
        { label: 'Auto-Update', value: 'GitHub Releases', desc: 'Silent downloads & cryptographic verification' },
      ],
    },
  ];

  // Keyboard navigation: Left/Right arrow keys & Escape
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      } else if (e.key === 'ArrowRight') {
        setCurrentStepIndex((prev) => Math.min(prev + 1, steps.length - 1));
      } else if (e.key === 'ArrowLeft') {
        setCurrentStepIndex((prev) => Math.max(prev - 1, 0));
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose, steps.length]);

  if (!isOpen) return null;

  const currentStep = steps[currentStepIndex];
  const StepIcon = currentStep.icon;
  const isLastStep = currentStepIndex === steps.length - 1;

  const handleNext = () => {
    if (isLastStep) {
      onClose();
    } else {
      setCurrentStepIndex((prev) => prev + 1);
    }
  };

  const handlePrev = () => {
    setCurrentStepIndex((prev) => Math.max(prev - 1, 0));
  };

  return (
    <div
      className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-3 sm:p-4 md:p-6 overflow-hidden animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="relative bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-2xl max-h-[90vh] shadow-2xl flex flex-col text-slate-100 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Header & Progress Bar */}
        <div className="px-5 py-4 border-b border-slate-800 bg-slate-950/80 shrink-0 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`w-9 h-9 rounded-xl ${currentStep.iconBg} border flex items-center justify-center ${currentStep.iconColor} shadow-inner`}>
              <StepIcon className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-mono font-semibold px-2 py-0.5 rounded-full bg-indigo-500/15 text-indigo-300 border border-indigo-500/30">
                  {currentStep.badge}
                </span>
                <span className="text-[11px] text-slate-400 font-medium">
                  {currentStepIndex + 1} of {steps.length}
                </span>
              </div>
              <h2 className="text-sm sm:text-base font-bold text-white tracking-tight mt-0.5">
                {currentStep.title}
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              aria-label="Skip tour"
              className="text-xs text-slate-400 hover:text-white px-2 py-1 rounded hover:bg-slate-800/60 transition-colors"
            >
              Skip Tour
            </button>
            <button
              onClick={onClose}
              aria-label="Close walkthrough"
              className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Linear Progress Bar */}
        <div className="w-full bg-slate-800/80 h-1 shrink-0">
          <div
            className="bg-gradient-to-r from-indigo-500 via-cyan-400 to-emerald-400 h-full transition-all duration-300 ease-out"
            style={{ width: `${((currentStepIndex + 1) / steps.length) * 100}%` }}
          />
        </div>

        {/* Scrollable Content Body */}
        <div className="p-5 sm:p-6 flex-1 overflow-y-auto space-y-5 scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-transparent">
          {/* Tagline */}
          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed font-normal bg-slate-800/40 border border-slate-700/50 p-3 rounded-xl">
            {currentStep.tagline}
          </p>

          {/* Visual Highlight Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            {currentStep.visualHighlights.map((vh, i) => (
              <div
                key={i}
                className="bg-slate-950/60 border border-slate-800 p-3 rounded-xl flex flex-col justify-between"
              >
                <span className="text-[10px] text-slate-400 font-mono uppercase tracking-wider">{vh.label}</span>
                <span className="text-sm font-bold text-white my-0.5">{vh.value}</span>
                <span className="text-[11px] text-slate-400 leading-tight">{vh.desc}</span>
              </div>
            ))}
          </div>

          {/* Purpose & Core Capabilities */}
          <div className="space-y-3">
            <div className="text-[11px] font-semibold text-indigo-300 uppercase tracking-wider flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5 text-indigo-400" />
              <span>Core Purpose & Architecture</span>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed pl-1">
              {currentStep.purpose}
            </p>

            <div className="bg-slate-950/40 border border-slate-800/80 rounded-xl p-3.5 space-y-2">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                What this does:
              </span>
              <ul className="space-y-2">
                {currentStep.whatItDoes.map((item, idx) => (
                  <li key={idx} className="flex items-start gap-2.5 text-xs text-slate-300">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    <span className="leading-snug">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Keyboard Shortcuts for this step */}
          {currentStep.hotkeys && currentStep.hotkeys.length > 0 && (
            <div className="space-y-2 pt-1 border-t border-slate-800/60">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <Keyboard className="w-3.5 h-3.5 text-indigo-400" />
                <span>Associated Shortcuts</span>
              </span>
              <div className="flex flex-wrap gap-2">
                {currentStep.hotkeys.map((hk, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-2 px-2.5 py-1 rounded-lg bg-slate-800/70 border border-slate-700 text-xs"
                  >
                    <span className="text-slate-300 text-[11px]">{hk.label}:</span>
                    <kbd className="px-2 py-0.5 bg-slate-950 border border-slate-700/80 rounded text-[11px] font-mono font-semibold text-indigo-300 shadow-inner">
                      {hk.key}
                    </kbd>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer Navigation Controls */}
        <div className="px-5 py-3.5 border-t border-slate-800 bg-slate-950/80 flex items-center justify-between shrink-0">
          {/* Step dots */}
          <div className="flex items-center gap-1.5">
            {steps.map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrentStepIndex(i)}
                aria-label={`Jump to step ${i + 1}`}
                className={`h-2 rounded-full transition-all duration-200 cursor-pointer ${
                  i === currentStepIndex
                    ? 'w-6 bg-indigo-500'
                    : 'w-2 bg-slate-700 hover:bg-slate-600'
                }`}
              />
            ))}
          </div>

          {/* Prev / Next Buttons */}
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrev}
              disabled={currentStepIndex === 0}
              className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                currentStepIndex === 0
                  ? 'text-slate-600 cursor-not-allowed'
                  : 'text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 cursor-pointer'
              }`}
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back</span>
            </button>

            <button
              onClick={handleNext}
              className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white shadow-md shadow-indigo-600/25 transition-all cursor-pointer"
            >
              <span>{isLastStep ? 'Get Started' : 'Next'}</span>
              {isLastStep ? <Check className="w-3.5 h-3.5" /> : <ArrowRight className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
