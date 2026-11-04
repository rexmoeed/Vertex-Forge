/**
 * Monaco / CodeMirror Syntax Highlighting Language Detector
 * Infers language modes from file extensions, filenames, shebangs, and content magic signatures.
 */

export interface DetectedLanguage {
  id: string;
  name: string;
  category: 'code' | 'markup' | 'data' | 'config' | 'doc';
  monacoLanguageId: string;
}

export class LanguageDetector {
  private static readonly EXTENSION_MAP: Record<string, DetectedLanguage> = {
    ts: { id: 'typescript', name: 'TypeScript', category: 'code', monacoLanguageId: 'typescript' },
    tsx: { id: 'typescriptreact', name: 'TypeScript React', category: 'code', monacoLanguageId: 'typescript' },
    js: { id: 'javascript', name: 'JavaScript', category: 'code', monacoLanguageId: 'javascript' },
    jsx: { id: 'javascriptreact', name: 'JavaScript React', category: 'code', monacoLanguageId: 'javascript' },
    py: { id: 'python', name: 'Python', category: 'code', monacoLanguageId: 'python' },
    rs: { id: 'rust', name: 'Rust', category: 'code', monacoLanguageId: 'rust' },
    go: { id: 'go', name: 'Go', category: 'code', monacoLanguageId: 'go' },
    json: { id: 'json', name: 'JSON', category: 'data', monacoLanguageId: 'json' },
    md: { id: 'markdown', name: 'Markdown', category: 'doc', monacoLanguageId: 'markdown' },
    yaml: { id: 'yaml', name: 'YAML', category: 'config', monacoLanguageId: 'yaml' },
    yml: { id: 'yaml', name: 'YAML', category: 'config', monacoLanguageId: 'yaml' },
    html: { id: 'html', name: 'HTML', category: 'markup', monacoLanguageId: 'html' },
    css: { id: 'css', name: 'CSS', category: 'markup', monacoLanguageId: 'css' },
    sql: { id: 'sql', name: 'SQL', category: 'data', monacoLanguageId: 'sql' },
    sh: { id: 'shell', name: 'Shell', category: 'code', monacoLanguageId: 'shell' },
  };

  private static readonly FILENAME_MAP: Record<string, DetectedLanguage> = {
    dockerfile: { id: 'dockerfile', name: 'Dockerfile', category: 'config', monacoLanguageId: 'dockerfile' },
    makefile: { id: 'makefile', name: 'Makefile', category: 'config', monacoLanguageId: 'makefile' },
    '.gitignore': { id: 'ignore', name: 'Git Ignore', category: 'config', monacoLanguageId: 'plaintext' },
    '.env': { id: 'dotenv', name: 'DotEnv', category: 'config', monacoLanguageId: 'ini' },
  };

  public static detect(filePath: string, contentSnippet = ''): DetectedLanguage {
    const filename = filePath.split(/[/\\]/).pop()?.toLowerCase() || '';

    // 1. Direct filename matches
    if (this.FILENAME_MAP[filename]) {
      return this.FILENAME_MAP[filename];
    }

    // 2. Extension matches
    const parts = filename.split('.');
    if (parts.length > 1) {
      const ext = parts.pop()!;
      if (this.EXTENSION_MAP[ext]) {
        return this.EXTENSION_MAP[ext];
      }
    }

    // 3. Shebang inspection
    if (contentSnippet.startsWith('#!/usr/bin/env node') || contentSnippet.startsWith('#!/bin/node')) {
      return this.EXTENSION_MAP.js;
    }
    if (contentSnippet.startsWith('#!/usr/bin/env python') || contentSnippet.startsWith('#!/bin/python')) {
      return this.EXTENSION_MAP.py;
    }
    if (contentSnippet.startsWith('#!/bin/bash') || contentSnippet.startsWith('#!/bin/sh')) {
      return this.EXTENSION_MAP.sh;
    }

    // Default plaintext fallback
    return {
      id: 'plaintext',
      name: 'Plain Text',
      category: 'doc',
      monacoLanguageId: 'plaintext',
    };
  }
}
