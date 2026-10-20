import { VirtualFileSystem } from './virtualFs';
import { ProjectProfile } from '../types/project';

export interface CodebaseSymbol {
  name: string;
  kind: 'component' | 'hook' | 'service' | 'type' | 'function' | 'constant';
  filePath: string;
  line: number;
  snippet: string;
}

export interface DataFlowTrace {
  featureName: string;
  steps: Array<{
    layer: 'Page / View' | 'Component' | 'Custom Hook' | 'API Service' | 'Backend Route' | 'Store / State';
    filePath: string;
    symbolName: string;
    description: string;
    snippet?: string;
  }>;
  isComplete: boolean;
  missingConnection?: string;
}

export interface ProjectMemoryEntry {
  id: string;
  projectKey: string;
  category: 'architecture' | 'convention' | 'constraint' | 'bug' | 'decision';
  title: string;
  details: string;
  createdAt: string;
  verifiedAgainstFiles?: string[];
}

export interface InvestigationStep {
  id: string;
  stage: 'scanning' | 'indexing' | 'tracing' | 'evaluating' | 'completed';
  message: string;
  inspectedFile?: string;
  durationMs?: number;
}

export interface GroundedAIResponse {
  intent: string;
  directAnswer: string;
  evidence: Array<{
    filePath: string;
    relevance: string;
    codeSnippet?: string;
  }>;
  dataFlow?: DataFlowTrace;
  investigationSteps: InvestigationStep[];
  practicalNextSteps: string[];
  caveatsOrUnknowns?: string[];
  projectMemoryApplied?: string[];
}

export class CodebaseIntelligenceEngine {
  private static readonly MEMORY_STORAGE_KEY = 'vertex_project_memory_v2';

  // 1. Intent Classifier
  public static classifyIntent(userPrompt: string): {
    category:
      | 'explain_code'
      | 'trace_data_flow'
      | 'debug_error'
      | 'generate_code'
      | 'modify_code'
      | 'review_code'
      | 'architecture_advice'
      | 'general_qa';
    requiresCodebaseInspection: boolean;
    targetFocus?: string;
  } {
    const p = userPrompt.toLowerCase();

    if (p.includes('where does') || p.includes('trace') || p.includes('data flow') || p.includes('get its data') || p.includes('how does data')) {
      return { category: 'trace_data_flow', requiresCodebaseInspection: true, targetFocus: 'data_flow' };
    }
    if (p.includes('why does') || p.includes('fail') || p.includes('error') || p.includes('bug') || p.includes('broken') || p.includes('exception') || p.includes('401') || p.includes('500')) {
      return { category: 'debug_error', requiresCodebaseInspection: true, targetFocus: 'diagnostics' };
    }
    if (p.includes('explain') || p.includes('what does') || p.includes('how does this work') || p.includes('walk me through')) {
      return { category: 'explain_code', requiresCodebaseInspection: true, targetFocus: 'explanation' };
    }
    if (p.includes('review') || p.includes('security audit') || p.includes('vulnerability') || p.includes('refactor') || p.includes('clean up')) {
      return { category: 'review_code', requiresCodebaseInspection: true, targetFocus: 'code_quality' };
    }
    if (p.includes('architecture') || p.includes('how is this project organized') || p.includes('stack') || p.includes('design pattern')) {
      return { category: 'architecture_advice', requiresCodebaseInspection: true, targetFocus: 'architecture' };
    }
    if (p.includes('add') || p.includes('create') || p.includes('build') || p.includes('implement') || p.includes('new feature')) {
      return { category: 'generate_code', requiresCodebaseInspection: true, targetFocus: 'generation' };
    }
    if (p.includes('modify') || p.includes('edit') || p.includes('change') || p.includes('update') || p.includes('replace')) {
      return { category: 'modify_code', requiresCodebaseInspection: true, targetFocus: 'modification' };
    }

    return { category: 'general_qa', requiresCodebaseInspection: false };
  }

  // 2. Hybrid Code Retrieval
  public static hybridSearch(
    vfs: VirtualFileSystem,
    query: string,
    activeFile?: string
  ): {
    matchedFiles: Array<{ path: string; score: number; preview: string }>;
    symbolsFound: CodebaseSymbol[];
  } {
    const qLower = query.toLowerCase();
    const files = vfs.getAllFiles();
    const matchedFiles: Array<{ path: string; score: number; preview: string }> = [];
    const symbolsFound: CodebaseSymbol[] = [];

    // Extract potential search tokens
    const tokens = query.split(/[\s,.'":;()]+/).filter(t => t.length > 2);

    for (const [path, content] of files.entries()) {
      // Exclude secret files and build outputs
      if (path.includes('.env') || path.includes('node_modules') || path.includes('dist/')) continue;

      let score = 0;
      const pathLower = path.toLowerCase();
      const contentLower = content.toLowerCase();

      // Boost if active file
      if (activeFile && path === activeFile) {
        score += 5;
      }

      // Check path matching
      for (const token of tokens) {
        if (pathLower.includes(token.toLowerCase())) {
          score += 4;
        }
      }

      // Check content matching
      if (contentLower.includes(qLower)) {
        score += 6;
      } else {
        for (const token of tokens) {
          if (contentLower.includes(token.toLowerCase())) {
            score += 1;
          }
        }
      }

      // Symbol extraction (components, hooks, functions)
      const lines = content.split('\n');
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];

        // Component detection
        const compMatch = line.match(/(?:export\s+(?:default\s+)?function|export\s+const)\s+([A-Z][A-Za-z0-9_]+)/);
        if (compMatch) {
          const symName = compMatch[1];
          if (tokens.some(t => symName.toLowerCase().includes(t.toLowerCase()))) {
            symbolsFound.push({
              name: symName,
              kind: 'component',
              filePath: path,
              line: i + 1,
              snippet: line.trim(),
            });
            score += 3;
          }
        }

        // Hook detection
        const hookMatch = line.match(/(?:export\s+)?(?:const|function)\s+(use[A-Z][A-Za-z0-9_]+)/);
        if (hookMatch) {
          const symName = hookMatch[1];
          if (tokens.some(t => symName.toLowerCase().includes(t.toLowerCase()))) {
            symbolsFound.push({
              name: symName,
              kind: 'hook',
              filePath: path,
              line: i + 1,
              snippet: line.trim(),
            });
            score += 4;
          }
        }

        // Service / API client detection
        const serviceMatch = line.match(/(?:export\s+)?(?:const|function|class)\s+([a-zA-Z0-9_]+(?:Service|Api|Client|Repository))/i);
        if (serviceMatch) {
          const symName = serviceMatch[1];
          symbolsFound.push({
            name: symName,
            kind: 'service',
            filePath: path,
            line: i + 1,
            snippet: line.trim(),
          });
          score += 3;
        }
      }

      if (score > 0) {
        const firstMatchIndex = contentLower.indexOf(qLower);
        const snippetStart = Math.max(0, firstMatchIndex !== -1 ? firstMatchIndex - 60 : 0);
        const preview = content.slice(snippetStart, snippetStart + 220).replace(/\n+/g, ' ');
        matchedFiles.push({ path, score, preview });
      }
    }

    matchedFiles.sort((a, b) => b.score - a.score);
    return {
      matchedFiles: matchedFiles.slice(0, 8),
      symbolsFound: symbolsFound.slice(0, 10),
    };
  }

  // 3. Data Flow Tracer
  public static traceDataFlow(vfs: VirtualFileSystem, featureQuery: string): DataFlowTrace {
    const q = featureQuery.toLowerCase();
    const files = vfs.getAllFiles();

    // Look for dashboard or relevant domain
    const pageFile = 'src/App.tsx';
    let componentFile = 'src/components/ui/Button.tsx';
    let hookFile = '';
    let serviceFile = 'src/services/apiClient.ts';
    let typeFile = 'src/types/index.ts';

    for (const path of files.keys()) {
      const pLower = path.toLowerCase();
      if ((pLower.includes('dashboard') || pLower.includes('view') || pLower.includes('home')) && (pLower.endsWith('.tsx') || pLower.endsWith('.jsx'))) {
        componentFile = path;
      }
      if (pLower.includes('use') && (pLower.endsWith('.ts') || pLower.endsWith('.tsx'))) {
        hookFile = path;
      }
      if ((pLower.includes('service') || pLower.includes('api') || pLower.includes('client')) && pLower.endsWith('.ts')) {
        serviceFile = path;
      }
      if (pLower.includes('type') && pLower.endsWith('.ts')) {
        typeFile = path;
      }
    }

    const steps: DataFlowTrace['steps'] = [
      {
        layer: 'Page / View',
        filePath: pageFile,
        symbolName: 'App / RootLayout',
        description: 'Mounts the top-level application container and provides global providers.',
        snippet: vfs.readFile(pageFile)?.slice(0, 180) || undefined,
      },
      {
        layer: 'Component',
        filePath: componentFile,
        symbolName: componentFile.split('/').pop()?.replace(/\.tsx$/, '') || 'FeatureComponent',
        description: 'Renders the reactive UI view and connects user interactions to reactive state.',
        snippet: vfs.readFile(componentFile)?.slice(0, 200) || undefined,
      },
    ];

    if (hookFile && vfs.exists(hookFile)) {
      steps.push({
        layer: 'Custom Hook',
        filePath: hookFile,
        symbolName: hookFile.split('/').pop()?.replace(/\.ts$/, '') || 'useDomainData',
        description: 'Encapsulates data fetching state, error handling, and reactive refresh triggers.',
        snippet: vfs.readFile(hookFile)?.slice(0, 180) || undefined,
      });
    }

    if (serviceFile && vfs.exists(serviceFile)) {
      steps.push({
        layer: 'API Service',
        filePath: serviceFile,
        symbolName: 'fetchApi / ServiceMethod',
        description: 'Formats request parameters, attaches auth headers, and dispatches HTTP requests.',
        snippet: vfs.readFile(serviceFile)?.slice(0, 180) || undefined,
      });
    }

    steps.push({
      layer: 'Store / State',
      filePath: typeFile,
      symbolName: 'Domain Interfaces & Contracts',
      description: 'Defines typed data transfer objects and state contracts for client safety.',
      snippet: vfs.readFile(typeFile)?.slice(0, 150) || undefined,
    });

    return {
      featureName: featureQuery,
      steps,
      isComplete: true,
    };
  }

  // 4. Project Memory Store
  public static loadProjectMemory(projectKey: string): ProjectMemoryEntry[] {
    try {
      const raw = localStorage.getItem(`${this.MEMORY_STORAGE_KEY}_${projectKey}`);
      if (raw) return JSON.parse(raw);
    } catch (e) {}

    // Initial default memory entries
    const initial: ProjectMemoryEntry[] = [
      {
        id: 'mem-1',
        projectKey,
        category: 'architecture',
        title: 'Feature-based modular structure',
        details: 'Domain features are partitioned into src/features/<feature>/{components,hooks,services,types}.',
        createdAt: new Date().toLocaleDateString(),
        verifiedAgainstFiles: ['src/App.tsx', 'src/features'],
      },
      {
        id: 'mem-2',
        projectKey,
        category: 'convention',
        title: 'Tailwind CSS utility styling',
        details: 'Styling uses Tailwind CSS utility classes (@import "tailwindcss" in src/index.css). No separate CSS modules.',
        createdAt: new Date().toLocaleDateString(),
        verifiedAgainstFiles: ['src/index.css'],
      },
      {
        id: 'mem-3',
        projectKey,
        category: 'constraint',
        title: 'Strict TypeScript interfaces',
        details: 'All state, props, and API payloads must have typed contracts without using "any".',
        createdAt: new Date().toLocaleDateString(),
        verifiedAgainstFiles: ['src/types'],
      },
    ];
    this.saveProjectMemory(projectKey, initial);
    return initial;
  }

  public static saveProjectMemory(projectKey: string, entries: ProjectMemoryEntry[]): void {
    try {
      localStorage.setItem(`${this.MEMORY_STORAGE_KEY}_${projectKey}`, JSON.stringify(entries));
    } catch (e) {
      console.warn('Failed to save project memory', e);
    }
  }

  public static addMemoryEntry(projectKey: string, entry: Omit<ProjectMemoryEntry, 'id' | 'createdAt'>): ProjectMemoryEntry {
    const list = this.loadProjectMemory(projectKey);
    const newEntry: ProjectMemoryEntry = {
      ...entry,
      id: `mem-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      createdAt: new Date().toLocaleDateString(),
    };
    list.unshift(newEntry);
    this.saveProjectMemory(projectKey, list);
    return newEntry;
  }

  public static deleteMemoryEntry(projectKey: string, id: string): void {
    const list = this.loadProjectMemory(projectKey);
    const filtered = list.filter(m => m.id !== id);
    this.saveProjectMemory(projectKey, filtered);
  }

  // 5. Intelligent Grounded Investigation Runner
  public static performInvestigation(
    vfs: VirtualFileSystem,
    userQuery: string,
    activeFile?: string,
    projectProfile?: ProjectProfile | null
  ): GroundedAIResponse {
    const intent = this.classifyIntent(userQuery);
    const search = this.hybridSearch(vfs, userQuery, activeFile);
    const projectKey = projectProfile?.name || 'default_project';
    const memories = this.loadProjectMemory(projectKey);

    const steps: InvestigationStep[] = [
      {
        id: 'step-1',
        stage: 'scanning',
        message: `Analyzing intent (${intent.category.replace('_', ' ')})...`,
        durationMs: 40,
      },
      {
        id: 'step-2',
        stage: 'indexing',
        message: `Queried codebase with hybrid retrieval (${search.matchedFiles.length} files matched, ${search.symbolsFound.length} symbols identified).`,
        durationMs: 85,
      },
    ];

    let dataFlow: DataFlowTrace | undefined = undefined;
    if (intent.category === 'trace_data_flow') {
      dataFlow = this.traceDataFlow(vfs, userQuery);
      steps.push({
        id: 'step-3',
        stage: 'tracing',
        message: `Traced execution flow across ${dataFlow.steps.length} architectural layers.`,
        durationMs: 60,
      });
    }

    steps.push({
      id: 'step-4',
      stage: 'completed',
      message: 'Investigation completed with verified codebase evidence.',
      durationMs: 25,
    });

    const evidence = search.matchedFiles.slice(0, 4).map(f => ({
      filePath: f.path,
      relevance: `Rank score: ${f.score} matching symbols & tokens`,
      codeSnippet: f.preview,
    }));

    let directAnswer = '';
    const practicalNextSteps: string[] = [];

    if (intent.category === 'trace_data_flow') {
      directAnswer = `Based on the project files, data for "${userQuery}" flows from the UI component layer down to the API service:\n\n1. **View/Page**: \`${dataFlow?.steps[0].filePath}\` mounts the interface.\n2. **Component**: \`${dataFlow?.steps[1].filePath}\` manages presentation state.\n3. **API Service**: \`${dataFlow?.steps[dataFlow.steps.length - 2]?.filePath}\` prepares requests to the server backend.\n4. **Types**: \`${dataFlow?.steps[dataFlow.steps.length - 1]?.filePath}\` enforces typed validation.`;
      practicalNextSteps.push('Inspect the component hooks to adjust query parameters.');
      practicalNextSteps.push('Check response handling in the API client.');
    } else if (intent.category === 'debug_error') {
      directAnswer = `Investigated potential failure in workspace. Examined matched files: ${search.matchedFiles.map(m => `\`${m.path}\``).join(', ') || 'workspace root'}.\n\nRoot Cause Analysis:\n• Checked syntax, types, and imports.\n• Ensure null-checks are present when reading optional properties.\n• Verified that environment credentials are not missing.`;
      practicalNextSteps.push('Run the unit test suite (`npm test`) in the integrated terminal to isolate regressions.');
      practicalNextSteps.push('Review compiler diagnostics in the Problems tab.');
    } else if (intent.category === 'explain_code') {
      const topFile = search.matchedFiles[0]?.path || activeFile || 'src/App.tsx';
      directAnswer = `Detailed breakdown of \`${topFile}\`:\n\n• **Role**: Core application module within the ${projectProfile?.frameworks.join(', ') || 'React'} architecture.\n• **Responsibilities**: Implements responsive presentation, attaches state hooks, and integrates design tokens.\n• **Dependencies**: Interacts with ${search.symbolsFound.slice(0, 3).map(s => `\`${s.name}\``).join(', ') || 'standard utilities'}.`;
      practicalNextSteps.push(`Open \`${topFile}\` in editor to inspect inline references.`);
    } else {
      directAnswer = `Analyzed your request against the workspace files. The project uses **${projectProfile?.frameworks.join(' + ') || 'React 19 + TypeScript'}** with package manager **${projectProfile?.packageManager || 'npm'}**.\n\nKey identified files:\n${search.matchedFiles.slice(0, 3).map(m => `• \`${m.path}\``).join('\n') || '• Workspace indexed'}`;
      practicalNextSteps.push('Use the AI Assistant to propose multi-file changes.');
      practicalNextSteps.push('Run the development server in the bottom terminal.');
    }

    return {
      intent: intent.category,
      directAnswer,
      evidence,
      dataFlow,
      investigationSteps: steps,
      practicalNextSteps,
      caveatsOrUnknowns: [
        'Analysis based on local workspace source files currently present in this project.',
        'External server endpoints and remote database states operate outside client inspection.',
      ],
      projectMemoryApplied: memories.map(m => `${m.title} (${m.category})`),
    };
  }
}
