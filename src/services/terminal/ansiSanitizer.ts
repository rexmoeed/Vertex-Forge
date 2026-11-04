/**
 * Terminal Output Sanitization & ANSI Escape Sequence Processor
 * Strips terminal control characters, CSI sequences, and OSC title changes for safe UI rendering.
 */

export interface SanitizedTerminalOutput {
  rawText: string;
  plainText: string;
  hasColorCodes: boolean;
  hasControlSequences: boolean;
  lineCount: number;
}

export class AnsiSanitizer {
  // Matches all ANSI Escape Sequences (SGR colors, cursor movements, OSC commands)
  public static readonly ANSI_REGEX =
    /[\u001b\u009b][[()#;?]*(?:[0-9]{1,4}(?:;[0-9]{0,4})*)?[0-9A-ORZcf-nqry=><]/g;

  // Control characters except newline (\n), carriage return (\r), and tab (\t)
  public static readonly CONTROL_CHARS_REGEX = /[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g;

  public static stripAnsi(text: string): string {
    if (!text) return '';
    return text.replace(this.ANSI_REGEX, '');
  }

  public static sanitize(rawText: string): SanitizedTerminalOutput {
    if (!rawText) {
      return {
        rawText: '',
        plainText: '',
        hasColorCodes: false,
        hasControlSequences: false,
        lineCount: 0,
      };
    }

    const hasColorCodes = this.ANSI_REGEX.test(rawText);
    this.ANSI_REGEX.lastIndex = 0; // reset regex state

    const strippedAnsi = rawText.replace(this.ANSI_REGEX, '');
    const hasControlSequences = this.CONTROL_CHARS_REGEX.test(strippedAnsi);
    this.CONTROL_CHARS_REGEX.lastIndex = 0;

    // Normalize carriage returns and remove stray bell/backspace control chars
    const plainText = strippedAnsi
      .replace(this.CONTROL_CHARS_REGEX, '')
      .replace(/\r\n/g, '\n')
      .replace(/\r/g, '\n');

    const lines = plainText.split('\n');

    return {
      rawText,
      plainText,
      hasColorCodes,
      hasControlSequences,
      lineCount: lines.length,
    };
  }

  public static truncateLines(text: string, maxLines: number): string {
    const lines = text.split('\n');
    if (lines.length <= maxLines) {
      return text;
    }
    const truncated = lines.slice(-maxLines);
    return `[... ${lines.length - maxLines} lines truncated ...]\n` + truncated.join('\n');
  }
}

