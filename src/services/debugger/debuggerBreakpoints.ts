import { Breakpoint } from '../../types/debugger';

export class DebuggerBreakpointsManager {
  private breakpoints: Map<string, Breakpoint> = new Map();
  private onBreakpointsChange?: (breakpoints: Breakpoint[]) => void;

  constructor(onChange?: (breakpoints: Breakpoint[]) => void) {
    this.onBreakpointsChange = onChange;
  }

  public setOnChange(onChange?: (breakpoints: Breakpoint[]) => void) {
    this.onBreakpointsChange = onChange;
  }

  public setBreakpoint(filePath: string, line: number, condition?: string): Breakpoint {
    const cleanPath = filePath.replace(/\\/g, '/');
    const id = `bp-${cleanPath}-${line}`;
    const bp: Breakpoint = {
      id,
      filePath: cleanPath,
      line,
      enabled: true,
      condition: condition?.trim() || undefined,
      verified: true,
    };
    this.breakpoints.set(id, bp);
    this.notify();
    return bp;
  }

  public toggleBreakpoint(filePath: string, line: number): boolean {
    const cleanPath = filePath.replace(/\\/g, '/');
    const id = `bp-${cleanPath}-${line}`;
    if (this.breakpoints.has(id)) {
      this.breakpoints.delete(id);
      this.notify();
      return false;
    } else {
      this.setBreakpoint(cleanPath, line);
      return true;
    }
  }

  public removeBreakpoint(id: string) {
    this.breakpoints.delete(id);
    this.notify();
  }

  public setBreakpointEnabled(id: string, enabled: boolean) {
    const bp = this.breakpoints.get(id);
    if (bp) {
      bp.enabled = enabled;
      this.notify();
    }
  }

  public clearAllBreakpoints() {
    this.breakpoints.clear();
    this.notify();
  }

  public getBreakpoints(): Breakpoint[] {
    return Array.from(this.breakpoints.values());
  }

  public getBreakpointsForFile(filePath: string): Breakpoint[] {
    const cleanPath = filePath.replace(/\\/g, '/');
    return Array.from(this.breakpoints.values()).filter(b => b.filePath === cleanPath);
  }

  public hasBreakpointAt(filePath: string, line: number | undefined, currentVars: Record<string, any> = {}): boolean {
    if (!line) return false;
    const cleanPath = filePath.replace(/\\/g, '/');
    const id = `bp-${cleanPath}-${line}`;
    const bp = this.breakpoints.get(id);
    if (!bp || !bp.enabled) return false;

    if (bp.condition) {
      try {
        const fn = new Function(...Object.keys(currentVars), `return Boolean(${bp.condition});`);
        return Boolean(fn(...Object.values(currentVars)));
      } catch {
        return true;
      }
    }

    return true;
  }

  private notify() {
    if (this.onBreakpointsChange) {
      this.onBreakpointsChange(this.getBreakpoints());
    }
  }
}
