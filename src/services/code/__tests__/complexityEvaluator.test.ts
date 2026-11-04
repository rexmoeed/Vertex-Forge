import { describe, it, expect } from 'vitest';
import { ComplexityEvaluator } from '../complexityEvaluator';

describe('ComplexityEvaluator & Cyclomatic Analysis', () => {
  it('evaluates straight-line code as simple (complexity = 1)', () => {
    const code = `
      const x = 10;
      const y = 20;
      const z = x + y;
      console.log(z);
    `;

    const metrics = ComplexityEvaluator.evaluate(code);
    expect(metrics.cyclomaticComplexity).toBe(1);
    expect(metrics.branchCount).toBe(0);
    expect(metrics.rating).toBe('simple');
  });

  it('detects if-else branches, loops, and logical operators correctly', () => {
    const code = `
      function validate(user) {
        if (user && user.age > 18) {
          for (let i = 0; i < user.roles.length; i++) {
            if (user.roles[i] === 'admin') {
              return true;
            }
          }
        } else {
          return false;
        }
      }
    `;

    const metrics = ComplexityEvaluator.evaluate(code);
    expect(metrics.branchCount).toBeGreaterThanOrEqual(4);
    expect(metrics.cyclomaticComplexity).toBeGreaterThanOrEqual(5);
    expect(metrics.functionCount).toBeGreaterThanOrEqual(1);
  });

  it('ignores branching keywords inside comments and strings', () => {
    const code = `
      // if (fakeBranch) { while (true) {} }
      /* catch (e) { for (;;) {} } */
      const msg = "if (str) { return true; }";
      const total = 42;
    `;

    const metrics = ComplexityEvaluator.evaluate(code);
    expect(metrics.branchCount).toBe(0);
    expect(metrics.cyclomaticComplexity).toBe(1);
  });

  it('flags unmaintainable code with high cyclomatic complexity', () => {
    let unmaintainableCode = 'function monster(x) {\n';
    for (let i = 0; i < 30; i++) {
      unmaintainableCode += `  if (x === ${i}) return ${i};\n`;
    }
    unmaintainableCode += '}\n';

    const metrics = ComplexityEvaluator.evaluate(unmaintainableCode);
    expect(metrics.cyclomaticComplexity).toBeGreaterThan(25);
    expect(metrics.rating).toBe('unmaintainable');
    expect(metrics.recommendation).toContain('Decompose into smaller');
  });
});

