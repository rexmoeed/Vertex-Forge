/**
 * Source Code Cyclomatic Complexity Evaluator
 * Analyzes branching decision points (if, else, while, for, case, catch, ternary) to calculate complexity score.
 */

export interface ComplexityMetrics {
  cyclomaticComplexity: number;
  branchCount: number;
  functionCount: number;
  rating: 'simple' | 'moderate' | 'complex' | 'unmaintainable';
  recommendation: string;
}

export class ComplexityEvaluator {
  private static readonly BRANCHING_KEYWORDS = [
    /\bif\s*\(/g,
    /\belse\s+if\s*\(/g,
    /\bfor\s*\(/g,
    /\bwhile\s*\(/g,
    /\bcase\s+[^:]+:/g,
    /\bcatch\s*\(/g,
    /\?\s*[^:]+\s*:/g, // ternary operator
    /&&/g,
    /\|\|/g,
    /\?\?/g, // nullish coalescing
  ];

  private static readonly FUNCTION_KEYWORDS = [
    /\bfunction\s+[a-zA-Z0-9_$]+\s*\(/g,
    /\bfunction\s*\(/g,
    /=>/g,
  ];

  public static evaluate(code: string): ComplexityMetrics {
    if (!code || code.trim().length === 0) {
      return {
        cyclomaticComplexity: 1,
        branchCount: 0,
        functionCount: 0,
        rating: 'simple',
        recommendation: 'Module is clean and empty.',
      };
    }

    // Strip comments and string literals to prevent false positive keyword matches
    const cleanCode = code
      .replace(/\/\*[\s\S]*?\*\//g, '')
      .replace(/\/\/.*$/gm, '')
      .replace(/"(?:[^"\\]|\\.)*"/g, '""')
      .replace(/'(?:[^'\\]|\\.)*'/g, "''")
      .replace(/`(?:[^`\\]|\\.)*`/g, '``');

    let branchCount = 0;
    for (const pattern of this.BRANCHING_KEYWORDS) {
      const matches = cleanCode.match(pattern);
      if (matches) {
        branchCount += matches.length;
      }
    }

    let functionCount = 0;
    for (const pattern of this.FUNCTION_KEYWORDS) {
      const matches = cleanCode.match(pattern);
      if (matches) {
        functionCount += matches.length;
      }
    }

    // Cyclomatic Complexity formula: V(G) = P + 1 (where P is number of decision points)
    const cyclomaticComplexity = branchCount + 1;

    let rating: ComplexityMetrics['rating'] = 'simple';
    let recommendation = 'Well-structured, easily testable logic.';

    if (cyclomaticComplexity > 25) {
      rating = 'unmaintainable';
      recommendation = 'Critical complexity! Decompose into smaller single-responsibility sub-services immediately.';
    } else if (cyclomaticComplexity > 15) {
      rating = 'complex';
      recommendation = 'High branching logic. Consider refactoring conditional branches into polymorphism or lookup tables.';
    } else if (cyclomaticComplexity > 8) {
      rating = 'moderate';
      recommendation = 'Moderate branching. Ensure comprehensive unit test coverage for edge cases.';
    }

    return {
      cyclomaticComplexity,
      branchCount,
      functionCount,
      rating,
      recommendation,
    };
  }
}

