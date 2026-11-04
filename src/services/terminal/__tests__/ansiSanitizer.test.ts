import { describe, it, expect } from 'vitest';
import { AnsiSanitizer } from '../ansiSanitizer';

describe('AnsiSanitizer & Terminal Output Cleansing', () => {
  it('strips standard ANSI 16-color and 256-color escape codes', () => {
    const colored = '\u001b[31mError:\u001b[39m \u001b[1mFile not found\u001b[22m';
    const plain = AnsiSanitizer.stripAnsi(colored);

    expect(plain).toBe('Error: File not found');
  });

  it('sanitizes terminal stream with control characters and flags presence', () => {
    const raw = '\u001b[32m✔ Build successful\u001b[0m\x07\r\nNext step: npm test';
    const result = AnsiSanitizer.sanitize(raw);

    expect(result.hasColorCodes).toBe(true);
    expect(result.hasControlSequences).toBe(true);
    expect(result.plainText).toBe('✔ Build successful\nNext step: npm test');
    expect(result.lineCount).toBe(2);
  });

  it('handles clean input without modifications', () => {
    const clean = 'Just standard logs\nwith zero formatting';
    const result = AnsiSanitizer.sanitize(clean);

    expect(result.hasColorCodes).toBe(false);
    expect(result.hasControlSequences).toBe(false);
    expect(result.plainText).toBe(clean);
  });

  it('truncates excess lines with a summary marker', () => {
    const longOutput = Array.from({ length: 50 }, (_, i) => `Log line #${i + 1}`).join('\n');
    const truncated = AnsiSanitizer.truncateLines(longOutput, 5);

    expect(truncated).toContain('[... 45 lines truncated ...]');
    expect(truncated).toContain('Log line #50');
    expect(truncated.split('\n').length).toBe(6);
  });

  it('leaves text under maxLines untouched', () => {
    const shortText = 'Line 1\nLine 2';
    expect(AnsiSanitizer.truncateLines(shortText, 5)).toBe(shortText);
  });
});

