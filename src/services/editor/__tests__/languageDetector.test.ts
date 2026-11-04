import { describe, it, expect } from 'vitest';
import { LanguageDetector } from '../languageDetector';

describe('LanguageDetector & Syntax Mapping', () => {
  it('detects language from common file extensions', () => {
    expect(LanguageDetector.detect('src/App.tsx').id).toBe('typescriptreact');
    expect(LanguageDetector.detect('src/server.ts').id).toBe('typescript');
    expect(LanguageDetector.detect('scripts/build.py').id).toBe('python');
    expect(LanguageDetector.detect('main.rs').id).toBe('rust');
    expect(LanguageDetector.detect('config.yaml').id).toBe('yaml');
  });

  it('detects language from special exact filenames', () => {
    expect(LanguageDetector.detect('Dockerfile').id).toBe('dockerfile');
    expect(LanguageDetector.detect('.gitignore').id).toBe('ignore');
    expect(LanguageDetector.detect('.env').id).toBe('dotenv');
  });

  it('infers shell or node language from shebang when extension is missing', () => {
    const nodeScript = LanguageDetector.detect('bin/cli', '#!/usr/bin/env node\nconsole.log("hello");');
    expect(nodeScript.id).toBe('javascript');

    const bashScript = LanguageDetector.detect('bin/run', '#!/bin/bash\necho "hello"');
    expect(bashScript.id).toBe('shell');
  });

  it('falls back to plaintext for unknown files', () => {
    const unknown = LanguageDetector.detect('mystery.xyz', 'some binary payload');
    expect(unknown.id).toBe('plaintext');
    expect(unknown.monacoLanguageId).toBe('plaintext');
  });
});
