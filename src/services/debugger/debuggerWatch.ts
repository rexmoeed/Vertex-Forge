import { WatchExpression, Variable } from '../../types/debugger';

export class DebuggerWatchManager {
  private watchExpressions: Map<string, WatchExpression> = new Map();
  private onWatchExpressionsChange?: (expressions: WatchExpression[]) => void;

  constructor(onChange?: (expressions: WatchExpression[]) => void) {
    this.onWatchExpressionsChange = onChange;
  }

  public setOnChange(onChange?: (expressions: WatchExpression[]) => void) {
    this.onWatchExpressionsChange = onChange;
  }

  public addWatchExpression(expression: string, currentScopeVars?: Variable[]): WatchExpression {
    const cleanExpr = expression.trim();
    const id = `watch-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const watch: WatchExpression = {
      id,
      expression: cleanExpr,
      updatedAt: Date.now(),
    };
    this.watchExpressions.set(id, watch);
    if (currentScopeVars) {
      this.evaluate(currentScopeVars);
    } else {
      this.notify();
    }
    return watch;
  }

  public removeWatchExpression(id: string) {
    this.watchExpressions.delete(id);
    this.notify();
  }

  public getWatchExpressions(): WatchExpression[] {
    return Array.from(this.watchExpressions.values());
  }

  public evaluate(scopeVars: Variable[]) {
    const context: Record<string, any> = {};
    for (const v of scopeVars) {
      try {
        context[v.name] = JSON.parse(v.value);
      } catch {
        context[v.name] = v.value;
      }
    }

    for (const watch of this.watchExpressions.values()) {
      try {
        const fn = new Function(...Object.keys(context), `return (${watch.expression});`);
        const evaluated = fn(...Object.values(context));
        watch.value = typeof evaluated === 'object' ? JSON.stringify(evaluated) : String(evaluated);
        watch.type = typeof evaluated;
        watch.error = undefined;
      } catch (err: unknown) {
        watch.value = undefined;
        watch.error = err instanceof Error ? err.message : 'Evaluation error';
      }
      watch.updatedAt = Date.now();
    }

    this.notify();
  }

  private notify() {
    if (this.onWatchExpressionsChange) {
      this.onWatchExpressionsChange(this.getWatchExpressions());
    }
  }
}
