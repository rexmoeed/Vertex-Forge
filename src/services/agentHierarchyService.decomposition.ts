import { SubAgentTaskContract } from '../types/agentHierarchy';
import { Project, FileNode } from '../types/ide';
import { VirtualFileSystem } from './virtualFs';

export interface TaskDelegator {
  resetAllTasks(): void;
  delegateTask(contract: Omit<SubAgentTaskContract, 'status' | 'progressPercent'>): SubAgentTaskContract;
  logPlanDecompositionMessage(payload: Record<string, unknown>): void;
  getTasks(): SubAgentTaskContract[];
  notify(): void;
}

export function flattenFileNodes(nodes: FileNode[]): string[] {
  const paths: string[] = [];
  const traverse = (items: FileNode[]) => {
    for (const item of items) {
      if (item.type === 'file') {
        paths.push(item.path);
      }
      if (item.children) {
        traverse(item.children);
      }
    }
  };
  traverse(nodes);
  return paths;
}

export function decomposeProjectIntoSubTasks(
  delegator: TaskDelegator,
  vfs: VirtualFileSystem,
  project?: Project | { name: string; rootFiles?: FileNode[]; techStack?: unknown; description?: string },
  userGoal?: string
): SubAgentTaskContract[] {
  delegator.resetAllTasks();

  const projectName = project?.name || 'Current Workspace';
  const goalTitle = userGoal?.trim() ? userGoal.trim() : `Full Engineering Architecture & Verification Lifecycle for ${projectName}`;

  // Inspect files from VFS or project nodes
  const allVfsFiles = Array.from(vfs.getAllFiles().keys());
  const fileList = allVfsFiles.length > 0
    ? allVfsFiles
    : (project?.rootFiles ? flattenFileNodes(project.rootFiles) : ['package.json', 'src/App.tsx', 'src/index.css']);

  // Detect key files
  const mainEntry = fileList.find(f => /src\/(App|index|main)\.(tsx|jsx|ts|js)/i.test(f))
    || fileList.find(f => /(main|app)\.(py|go|rs|cpp|java)/i.test(f))
    || fileList.find(f => /index\.html/i.test(f))
    || 'src/App.tsx';

  const styleFile = fileList.find(f => /(index|app|styles?|global)\.(css|scss|sass|less)/i.test(f))
    || 'src/index.css';

  const backendFile = fileList.find(f => /(service|api|server|router|controller|db|database)\.(ts|js|py|go)/i.test(f))
    || fileList.find(f => f.startsWith('src/services/'))
    || 'src/services/desktopBridge.ts';

  const configFile = fileList.find(f => /(package\.json|tsconfig\.json|vite\.config|Cargo\.toml|pyproject\.toml|go\.mod)/i.test(f))
    || 'package.json';

  const testFile = fileList.find(f => /(\.test\.|\.spec\.|__tests__)/i.test(f))
    || 'src/services/__tests__/autonomousAgent.test.ts';

  const prefix = `task-${Date.now().toString(36)}`;

  // PHASE 1: Architecture, Product Scope & Codebase Research (INDEPENDENT - CAN RUN IN PARALLEL)
  const tArch = delegator.delegateTask({
    taskId: `${prefix}-arch-1`,
    parentAgentId: 'ArchitectureLead',
    subAgentRole: 'DependencyMapper',
    title: `Map Architecture Boundaries & Data Flow [${projectName}]`,
    objective: `Analyze entry points, module boundaries, and dependency relations for ${goalTitle}.`,
    instructions: `Inspect ${mainEntry} and ${backendFile}. Formulate component hierarchy, service contracts, and state flow graph.`,
    allowedTools: ['file_read', 'symbol_search'],
    workspaceScope: 'src',
    allowedFilePaths: [mainEntry, backendFile],
    restrictedFilePaths: ['.env', '.git'],
    dependencies: [],
    expectedDeliverables: ['Module dependency graph', 'Component hierarchy contract', 'Interface specifications'],
    acceptanceCriteria: ['Validates strict separation of concerns', 'Zero circular dependencies'],
    permissionLevel: 'read',
  });

  const tProduct = delegator.delegateTask({
    taskId: `${prefix}-pd-1`,
    parentAgentId: 'ProductDesignLead',
    subAgentRole: 'RequirementsAnalyst',
    title: `Decompose Requirements & User Journey [${projectName}]`,
    objective: `Deconstruct user goals into functional criteria, acceptance gates, and edge cases for: ${goalTitle}.`,
    instructions: `Establish user journey maps, input validation criteria, and workflow stages for: ${goalTitle}.`,
    allowedTools: ['file_read'],
    workspaceScope: '.',
    allowedFilePaths: [configFile, mainEntry],
    restrictedFilePaths: ['.env'],
    dependencies: [],
    expectedDeliverables: ['Product specification brief', 'Functional acceptance criteria', 'Failure mode analysis'],
    acceptanceCriteria: ['Edge cases and user interactions defined', 'Acceptance criteria fully quantified'],
    permissionLevel: 'read',
  });

  delegator.delegateTask({
    taskId: `${prefix}-res-1`,
    parentAgentId: 'ResearchLead',
    subAgentRole: 'SymbolSearchAgent',
    title: `Index Codebase Symbols & AST Graph [${projectName}]`,
    objective: `Extract symbol index, call sites, type signatures, and external library dependencies for: ${goalTitle}.`,
    instructions: `Traverse AST declarations and identify reusable patterns, type contracts, and utility functions across the workspace.`,
    allowedTools: ['file_read', 'symbol_search'],
    workspaceScope: 'src',
    allowedFilePaths: [mainEntry, backendFile, configFile],
    restrictedFilePaths: ['.env'],
    dependencies: [],
    expectedDeliverables: ['AST Symbol Index', 'Export/Import mapping matrix', 'Type contract inventory'],
    acceptanceCriteria: ['High-confidence symbol mapping completed without orphaned exports'],
    permissionLevel: 'read',
  });

  // PHASE 2: Core Engineering & Systems Implementation
  const tUI = delegator.delegateTask({
    taskId: `${prefix}-ui-1`,
    parentAgentId: 'UIDesignLead',
    subAgentRole: 'DesignTokenSpecialist',
    title: `Audit Design Tokens & Styling System [${projectName}]`,
    objective: `Harmonize CSS variables, dark/light themes, typography, and responsive grid tokens for: ${goalTitle}.`,
    instructions: `Audit ${styleFile}. Verify contrast ratios, semantic color palettes, and responsive breakpoints for ${goalTitle}.`,
    allowedTools: ['file_read', 'file_write'],
    workspaceScope: 'src',
    allowedFilePaths: [styleFile],
    restrictedFilePaths: ['.env'],
    dependencies: [tProduct.taskId],
    expectedDeliverables: ['Harmonized design tokens', 'WCAG AA contrast validation', 'Consistent CSS variables'],
    acceptanceCriteria: ['Zero broken CSS variables', 'Light/Dark token consistency verified'],
    permissionLevel: 'write',
  });

  const tFrontend = delegator.delegateTask({
    taskId: `${prefix}-fe-1`,
    parentAgentId: 'FrontendLead',
    subAgentRole: 'ReactComponentBuilder',
    title: `Build & Wire Frontend Components [${projectName}]`,
    objective: `Construct reactive, state-managed UI components according to architecture and product specs for: ${goalTitle}.`,
    instructions: `Implement feature components in ${mainEntry}. Connect state hooks, error boundaries, and accessibility props for ${goalTitle}.`,
    allowedTools: ['file_read', 'file_write'],
    workspaceScope: 'src',
    allowedFilePaths: [mainEntry],
    restrictedFilePaths: ['.env'],
    dependencies: [tArch.taskId, tProduct.taskId],
    expectedDeliverables: ['Functional component implementation', 'Typed props and state hooks', 'Responsive UX integration'],
    acceptanceCriteria: ['0 TypeScript compilation errors', 'Strict prop validation passed'],
    permissionLevel: 'write',
  });

  const tBackend = delegator.delegateTask({
    taskId: `${prefix}-be-1`,
    parentAgentId: 'BackendLead',
    subAgentRole: 'APIEndpointBuilder',
    title: `Architect Backend APIs & Data Operations [${projectName}]`,
    objective: `Implement robust service endpoints, schema validations, and IPC/REST handlers for: ${goalTitle}.`,
    instructions: `Develop service methods in ${backendFile}. Ensure idempotent execution, error handling, and payload sanitization for: ${goalTitle}.`,
    allowedTools: ['file_read', 'file_write'],
    workspaceScope: 'src',
    allowedFilePaths: [backendFile],
    restrictedFilePaths: ['.env'],
    dependencies: [tArch.taskId],
    expectedDeliverables: ['API endpoint implementation', 'Payload schemas and validators', 'Error handling middleware'],
    acceptanceCriteria: ['Idempotent execution verified', 'Strict schema validation on all inputs'],
    permissionLevel: 'write',
  });

  const tDevOps = delegator.delegateTask({
    taskId: `${prefix}-ops-1`,
    parentAgentId: 'DevOpsLead',
    subAgentRole: 'BuildConfigurationAssistant',
    title: `Validate Build Pipeline & Environment Hygiene [${projectName}]`,
    objective: `Audit bundling configuration, script definitions, and environment isolation.`,
    instructions: `Review ${configFile}. Verify dependencies, build flags, and dev server configurations.`,
    allowedTools: ['file_read', 'terminal_run'],
    workspaceScope: '.',
    allowedFilePaths: [configFile],
    restrictedFilePaths: ['.env'],
    dependencies: [tArch.taskId],
    expectedDeliverables: ['Build configuration validation', 'Dependency health audit', 'Script pipeline checklist'],
    acceptanceCriteria: ['Clean build bundle generation verified', 'Zero unpinned vulnerable dependencies'],
    permissionLevel: 'read',
  });

  // PHASE 3: Security, Quality & End-to-End Verification
  const tSecurity = delegator.delegateTask({
    taskId: `${prefix}-sec-1`,
    parentAgentId: 'SecurityLead',
    subAgentRole: 'InputValidationReviewer',
    title: `Audit AST Security & Vulnerability Defense [${projectName}]`,
    objective: `Audit AST for potential path traversal, unsanitized inputs, secret leaks, and insecure IPC.`,
    instructions: `Scan ${mainEntry} and ${backendFile}. Enforce boundary sanitization and credential isolation.`,
    allowedTools: ['file_read'],
    workspaceScope: 'src',
    allowedFilePaths: [mainEntry, backendFile],
    restrictedFilePaths: ['.env'],
    dependencies: [tFrontend.taskId, tBackend.taskId],
    expectedDeliverables: ['Security audit report', 'Input validation matrix', 'Zero CVE vulnerability attestation'],
    acceptanceCriteria: ['Zero unauthorized credential access', 'All file paths sanitized against traversal'],
    permissionLevel: 'read',
  });

  const tQA = delegator.delegateTask({
    taskId: `${prefix}-qa-1`,
    parentAgentId: 'QALead',
    subAgentRole: 'UnitTestWriter',
    title: `Generate Test Suites & Quality Assertions [${projectName}]`,
    objective: `Author Vitest assertion suites, boundary condition tests, and regression assertions.`,
    instructions: `Draft unit and integration test assertions for ${mainEntry} and ${backendFile}. Target high branch coverage.`,
    allowedTools: ['file_read', 'file_write', 'terminal_run'],
    workspaceScope: 'src',
    allowedFilePaths: [testFile],
    restrictedFilePaths: ['.env'],
    dependencies: [tFrontend.taskId, tBackend.taskId],
    expectedDeliverables: ['Automated test suite', 'Assertion coverage report', 'Regression test verification'],
    acceptanceCriteria: ['All assertion test suites pass green', 'Edge cases verified'],
    permissionLevel: 'write',
  });

  // PHASE 4: Full-Stack Integration & Quality Gate Signoff
  delegator.delegateTask({
    taskId: `${prefix}-fs-1`,
    parentAgentId: 'FullStackLead',
    subAgentRole: 'EndToEndWorkflowSpecialist',
    title: `End-to-End Workflow & Quality Gate Signoff [${projectName}]`,
    objective: `Verify end-to-end integration across UI, backend, tests, and security boundaries.`,
    instructions: `Perform cross-tier smoke tests, verify telemetry, and issue final Quality Gate signoff.`,
    allowedTools: ['file_read', 'terminal_run'],
    workspaceScope: 'src',
    allowedFilePaths: [mainEntry, backendFile, testFile],
    restrictedFilePaths: ['.env'],
    dependencies: [tSecurity.taskId, tQA.taskId, tUI.taskId, tDevOps.taskId],
    expectedDeliverables: ['End-to-end verification summary', 'Quality Gate clearance cert', 'Deployment readiness audit'],
    acceptanceCriteria: ['Full stack workflow functions seamlessly', 'All quality gates passed'],
    permissionLevel: 'read',
  });

  delegator.logPlanDecompositionMessage({
    goal: goalTitle,
    totalTasks: 10,
    phases: 4,
    parallelCapable: true,
  });

  delegator.notify();
  return delegator.getTasks();
}
