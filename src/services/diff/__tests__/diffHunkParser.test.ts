import { describe, it, expect } from 'vitest';
import { DiffHunkParser } from '../diffHunkParser';

describe('DiffHunkParser & Patch Analytics', () => {
  const sampleDiff = `diff --git a/src/App.tsx b/src/App.tsx
index 1234567..abcdefg 100644
--- a/src/App.tsx
+++ b/src/App.tsx
@@ -10,4 +10,5 @@ export function App() {
   const [count, setCount] = useState(0);
-  const title = "Old Title";
+  const title = "New Modern Title";
+  const isModern = true;
   return <div>{title}</div>;
 }`;

  it('parses unified diff patch into file summaries and hunk lines', () => {
    const summaries = DiffHunkParser.parseUnifiedDiff(sampleDiff);

    expect(summaries.length).toBe(1);
    expect(summaries[0].oldPath).toBe('src/App.tsx');
    expect(summaries[0].newPath).toBe('src/App.tsx');
    expect(summaries[0].additions).toBe(2);
    expect(summaries[0].deletions).toBe(1);

    const hunk = summaries[0].hunks[0];
    expect(hunk).toBeDefined();
    expect(hunk.oldStart).toBe(10);
    expect(hunk.newStart).toBe(10);
    expect(hunk.lines.some(l => l.type === 'add' && l.content.includes('New Modern Title'))).toBe(true);
    expect(hunk.lines.some(l => l.type === 'delete' && l.content.includes('Old Title'))).toBe(true);
  });

  it('handles empty string cleanly without crashing', () => {
    const summaries = DiffHunkParser.parseUnifiedDiff('');
    expect(summaries).toEqual([]);
  });

  it('assigns correct incremental line numbers to added and deleted lines', () => {
    const summaries = DiffHunkParser.parseUnifiedDiff(sampleDiff);
    const hunk = summaries[0].hunks[0];

    const added = hunk.lines.filter(l => l.type === 'add');
    expect(added[0].newLineNumber).toBe(11);
    expect(added[1].newLineNumber).toBe(12);

    const deleted = hunk.lines.find(l => l.type === 'delete');
    expect(deleted?.oldLineNumber).toBe(11);
  });
});

