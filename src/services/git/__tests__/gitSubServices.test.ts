import { describe, it, expect } from 'vitest';
import { GitDiffAndAiService } from '../gitDiffAndAiService';

describe('Git Sub-Services', () => {
  describe('GitDiffAndAiService', () => {
    it('parses unified diff hunks correctly', () => {
      const raw = `@@ -1,4 +1,5 @@
 import React from 'react';
+import { Sparkles } from 'lucide-react';
 const a = 1;
-const b = 2;
+const b = 3;
`;
      const diff = GitDiffAndAiService.parseUnifiedDiff(raw, 'src/sample.ts');
      expect(diff.filePath).toBe('src/sample.ts');
      expect(diff.additions).toBe(2);
      expect(diff.deletions).toBe(1);
      expect(diff.hunks.length).toBe(1);
      expect(diff.hunks[0].lines.length).toBe(6);
    });

    it('returns clean structure on empty diff', () => {
      const diff = GitDiffAndAiService.parseUnifiedDiff('', 'src/sample.ts');
      expect(diff.additions).toBe(0);
      expect(diff.deletions).toBe(0);
      expect(diff.hunks).toEqual([]);
    });
  });
});
