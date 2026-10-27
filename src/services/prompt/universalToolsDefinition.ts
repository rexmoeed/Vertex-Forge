export interface ToolDefinition {
  name: string;
  description: string;
  parameters: {
    type: 'object';
    properties: Record<string, { type: string; description: string; enum?: string[] }>;
    required: string[];
  };
}

export const AVAILABLE_TOOLS: ToolDefinition[] = [
  {
    name: 'fs_read_file',
    description: 'Read the actual contents of a file from the workspace project.',
    parameters: {
      type: 'object',
      properties: {
        filePath: { type: 'string', description: 'Relative path of the file to inspect' },
      },
      required: ['filePath'],
    },
  },
  {
    name: 'fs_write_file',
    description: 'Write updated or new code to a file in the workspace.',
    parameters: {
      type: 'object',
      properties: {
        filePath: { type: 'string', description: 'Relative path of the target file' },
        content: { type: 'string', description: 'Complete content to write' },
      },
      required: ['filePath', 'content'],
    },
  },
  {
    name: 'fs_list_directory',
    description: 'List directories and files in a workspace folder.',
    parameters: {
      type: 'object',
      properties: {
        dirPath: { type: 'string', description: 'Directory path relative to workspace root' },
      },
      required: ['dirPath'],
    },
  },
  {
    name: 'terminal_execute',
    description: 'Execute a real shell command in the project working directory.',
    parameters: {
      type: 'object',
      properties: {
        command: { type: 'string', description: 'Shell command line to execute' },
      },
      required: ['command'],
    },
  },
  {
    name: 'git_status',
    description: 'Inspect real Git repository status, branch, and staged/unstaged changes.',
    parameters: {
      type: 'object',
      properties: {},
      required: [],
    },
  },
  {
    name: 'git_diff',
    description: 'Inspect real Git diff for uncommitted workspace modifications.',
    parameters: {
      type: 'object',
      properties: {
        filePath: { type: 'string', description: 'Optional specific file path' },
      },
      required: [],
    },
  },
  {
    name: 'run_tests',
    description: 'Execute the project unit test suite using the detected test runner (e.g. vitest, jest).',
    parameters: {
      type: 'object',
      properties: {},
      required: [],
    },
  },
  {
    name: 'run_build',
    description: 'Execute the workspace build command using the detected package manager.',
    parameters: {
      type: 'object',
      properties: {},
      required: [],
    },
  },
  {
    name: 'codebase_search',
    description: 'Search workspace files for symbols, function definitions, routes, or keywords.',
    parameters: {
      type: 'object',
      properties: {
        query: { type: 'string', description: 'Search term or regex symbol' },
      },
      required: ['query'],
    },
  },
];
