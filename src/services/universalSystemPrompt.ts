/**
 * Universal Intelligent AI System Prompt & Project Understanding Engine
 * Operates with ANY configured LLM (OpenAI, Claude, Gemini, DeepSeek, Mistral, Groq, Ollama, Local, Custom)
 * 
 * Core Rule: Never guess project facts. Inspect manifests, code, terminal, and Git.
 */

import { VirtualFileSystem } from './virtualFs';
import { ProjectProfile } from '../types/project';
import { SkillSetService } from './skillSetService';
import { ProviderId } from '../types/aiProvider';
import { AVAILABLE_TOOLS, ToolDefinition } from './prompt/universalToolsDefinition';
import { UniversalToolExecutor, ToolCallResult, EvidenceCategory } from './prompt/universalToolExecutor';

export type { EvidenceCategory, ToolDefinition, ToolCallResult };

export interface VerifiedEvidenceItem {
  category: EvidenceCategory;
  fact: string;
  sourceFileOrCommand?: string;
  detail?: string;
}

export interface PromptContextOptions {
  userPrompt: string;
  vfs?: VirtualFileSystem;
  projectProfile?: ProjectProfile | null;
  activeFile?: string;
  activeFileContent?: string;
  hasUnsavedChanges?: boolean;
  selectedText?: string;
  agentRole?: string;
  providerId?: ProviderId;
  modelId?: string;
  terminalContext?: {
    lastCommand?: string;
    lastExitCode?: number;
    recentOutput?: string[];
    runningProcess?: string;
    workingDir?: string;
  };
  gitContext?: {
    branch?: string;
    modifiedFiles?: string[];
    stagedFiles?: string[];
    untrackedFiles?: string[];
    diffSnippet?: string;
  };
  projectInstructions?: string[];
  includeTools?: boolean;
  maxContextTokens?: number;
}

export interface ToolCallRequest {
  id: string;
  toolName: string;
  arguments: Record<string, any>;
}

export class UniversalSystemPromptBuilder {
  public static readonly AVAILABLE_TOOLS: ToolDefinition[] = AVAILABLE_TOOLS;

  /**
   * Compile Verified Evidence Items from the current workspace
   */
  public static extractVerifiedEvidence(opts: PromptContextOptions): VerifiedEvidenceItem[] {
    const items: VerifiedEvidenceItem[] = [];
    const prof = opts.projectProfile;

    if (prof) {
      if (prof.name) {
        items.push({
          category: 'VERIFIED',
          fact: `Project Name: ${prof.name}`,
          sourceFileOrCommand: 'package.json or workspace metadata',
        });
      }

      if (prof.packageManager) {
        items.push({
          category: 'VERIFIED',
          fact: `Package Manager: ${prof.packageManager}`,
          sourceFileOrCommand: `${prof.packageManager}-lock file or package.json packageManager field`,
          detail: `Execute commands using "${prof.packageManager} run <script>" rather than other package managers.`,
        });
      }

      if (prof.languages && prof.languages.length > 0) {
        items.push({
          category: 'VERIFIED',
          fact: `Detected Languages: ${prof.languages.join(', ')}`,
          sourceFileOrCommand: 'File extensions and compiler config',
        });
      }

      if (prof.technologies && prof.technologies.length > 0) {
        items.push({
          category: 'VERIFIED',
          fact: `Primary Frameworks: ${prof.technologies.map(t => t.name).join(', ')}`,
          sourceFileOrCommand: 'package.json dependencies',
        });
      }

      if (prof.architecture) {
        items.push({
          category: 'INFERRED',
          fact: `Architecture Pattern: ${prof.architecture}`,
          detail: 'Based on folder layout and component hierarchy',
        });
      }
    } else {
      items.push({
        category: 'UNKNOWN',
        fact: 'Project profile has not yet been fully indexed',
        detail: 'Inspect root directory or run project detection to verify stack.',
      });
    }

    if (opts.activeFile) {
      items.push({
        category: 'VERIFIED',
        fact: `User currently has open file: ${opts.activeFile}`,
        sourceFileOrCommand: opts.activeFile,
        detail: opts.hasUnsavedChanges
          ? 'Has unsaved modifications in Monaco buffer — prioritize the buffer over disk content.'
          : 'Clean file on disk.',
      });
    }

    if (opts.terminalContext?.lastExitCode !== undefined) {
      items.push({
        category: 'VERIFIED',
        fact: `Last terminal command "${opts.terminalContext.lastCommand || ''}" exited with code ${opts.terminalContext.lastExitCode}`,
        sourceFileOrCommand: 'Terminal process runner',
      });
    }

    if (opts.gitContext?.branch) {
      items.push({
        category: 'VERIFIED',
        fact: `Git branch: ${opts.gitContext.branch}`,
        sourceFileOrCommand: 'git status',
      });
    }

    return items;
  }

  /**
   * Build Dynamic Model-Agnostic System Prompt
   */
  public static buildSystemPrompt(opts: PromptContextOptions): string {
    const role = opts.agentRole || 'Autonomous Software Engineering Lead';
    const evidence = this.extractVerifiedEvidence(opts);
    const prof = opts.projectProfile;

    const verifiedFacts = evidence.filter(e => e.category === 'VERIFIED');
    const inferredFacts = evidence.filter(e => e.category === 'INFERRED');
    const unknowns = evidence.filter(e => e.category === 'UNKNOWN');

    const sections: string[] = [];

    // 1. Identity & Operating Boundary
    sections.push(
`# Vertex Forge Autonomous Engineering Agent
Role: ${role}

You are an expert AI software engineering partner operating directly inside Vertex Forge desktop environment.
You have real-time access to the user's workspace, filesystem, terminal, test runners, and source control via authorized tools.

## Operating Principles:
1. INSPECT BEFORE ASSUMING: Never guess the language, framework, dependencies, or file contents. Inspect the project first.
2. EVIDENCE CLASSIFICATION:
   - VERIFIED: Directly proven by source files, package manifests, git diff, or terminal outputs.
   - INFERRED: Probable conclusions derived from architectural patterns. Clearly note when something is inferred.
   - UNKNOWN: When evidence is absent, state that it is unknown and offer to inspect the relevant files.
3. UNSAVED CODE PRIORITY: If the user has unsaved modifications in Monaco, always treat the editor buffer as current over disk.
4. PRESERVE PROJECT CONVENTIONS: Follow the project's detected formatting, naming conventions, and dependency patterns.
5. NO FAKE OUTPUTS: Never claim you ran a command, fixed a bug, or modified a file unless you actually executed the tool.`
    );

    // 2. Project Profile Section
    if (prof) {
      sections.push(
`# Verified Project Profile
• Project Name: ${prof.name || 'Workspace'}
• Languages: ${prof.languages?.join(', ') || 'Auto-detecting'}
• Package Manager: ${prof.packageManager || 'npm'} (Always use "${prof.packageManager || 'npm'}" for script runs and dependency additions)
• Frameworks: ${prof.technologies?.map(t => t.name).join(', ') || 'Detected from dependencies'}
• Entry Points: ${prof.technologies?.map(t => t.entryPoint).filter(Boolean).join(', ') || 'Auto-detecting'}
• Scripts: ${prof.scripts ? Object.entries(prof.scripts).map(([k, v]) => `"${k}": "${v}"`).join(', ') : 'None'}`
      );
    }

    // 3. Evidence Breakdown
    sections.push(
`# Current Workspace Evidence State
${verifiedFacts.map(f => `[VERIFIED] ${f.fact} (Source: ${f.sourceFileOrCommand || 'Project Engine'})`).join('\n')}
${inferredFacts.map(f => `[INFERRED] ${f.fact} (${f.detail || ''})`).join('\n')}
${unknowns.map(f => `[UNKNOWN] ${f.fact}`).join('\n')}`
    );

    // 4. Active File & Unsaved Buffer Context
    if (opts.activeFile) {
      sections.push(
`# Active Editor Context
• File Path: ${opts.activeFile}
• Status: ${opts.hasUnsavedChanges ? '⚠️ UNSAVED CHANGES IN MONACO (Prioritize this buffer over disk)' : 'Clean'}
${opts.selectedText ? `• Selected Code Snippet:\n\`\`\`\n${opts.selectedText}\n\`\`\`` : ''}
${opts.activeFileContent ? `• Active Buffer Content:\n\`\`\`\n${opts.activeFileContent.slice(0, 4000)}\n\`\`\`` : ''}`
      );
    }

    // 5. Terminal Context
    if (opts.terminalContext) {
      const tc = opts.terminalContext;
      sections.push(
`# Terminal State
• Working Directory: ${tc.workingDir || 'Project Root'}
• Last Command: ${tc.lastCommand || 'None'}
• Exit Code: ${tc.lastExitCode !== undefined ? tc.lastExitCode : 'N/A'}
${tc.runningProcess ? `• Running Process: ${tc.runningProcess}` : ''}
${tc.recentOutput && tc.recentOutput.length > 0 ? `• Recent Output:\n\`\`\`\n${tc.recentOutput.slice(-15).join('\n')}\n\`\`\`` : ''}`
      );
    }

    // 6. Git Context
    if (opts.gitContext) {
      const gc = opts.gitContext;
      sections.push(
`# Git Repository Context
• Branch: ${gc.branch || 'main'}
• Modified Files: ${gc.modifiedFiles?.join(', ') || 'Clean'}
• Staged Files: ${gc.stagedFiles?.join(', ') || 'None'}
${gc.diffSnippet ? `• Recent Diff:\n\`\`\`diff\n${gc.diffSnippet.slice(0, 1500)}\n\`\`\`` : ''}`
      );
    }

    // 7. Project Instructions
    if (opts.projectInstructions && opts.projectInstructions.length > 0) {
      sections.push(
`# Project-Specific Instructions & Guidelines
${opts.projectInstructions.join('\n\n')}`
      );
    }

    // 8. Specialized Coding Skill Activation
    const matchedSkill = SkillSetService.findMatchingSkill(opts.userPrompt);
    if (matchedSkill) {
      sections.push(
`# Active Specialized Coding Skill: /${matchedSkill.name} (v${matchedSkill.version})
• Objective: ${matchedSkill.description}
• Core Execution Directives:
${matchedSkill.instructions}
• Skill Allowlisted Tools: ${matchedSkill.allowedTools.join(', ')}
You MUST adhere strictly to these specialized coding directives.`
      );
    }

    // 9. Tool Calling Protocol
    if (opts.includeTools) {
      sections.push(
`# Available Tools
You have access to the following real tools. When you need to inspect files, execute terminal commands, or review Git state, generate a tool call:
${this.AVAILABLE_TOOLS.map(t => `- **${t.name}**: ${t.description}`).join('\n')}

Format tool calls clearly. Once tool results are returned to you, integrate the verified data into your follow-up answer.`
      );
    }

    return sections.join('\n\n');
  }

  /**
   * Execute a tool against the real system / VFS
   */
  public static async executeTool(
    toolName: string,
    args: Record<string, any>,
    vfs?: VirtualFileSystem
  ): Promise<ToolCallResult> {
    return UniversalToolExecutor.executeTool(toolName, args, vfs);
  }
}
