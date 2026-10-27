import React from 'react';

interface EditorGutterProps {
  lines: string[];
  activeFile: string;
  debugBreakpoints?: any[];
  debugLocation?: any;
  toggleBreakpoint?: (file: string, line: number) => void;
  gutterRef: React.RefObject<HTMLDivElement | null>;
}

export const EditorGutter: React.FC<EditorGutterProps> = ({
  lines,
  activeFile,
  debugBreakpoints,
  debugLocation,
  toggleBreakpoint,
  gutterRef,
}) => {
  return (
    <div
      ref={gutterRef}
      style={{
        backgroundColor: 'var(--ide-editor-gutter)',
        borderColor: 'var(--ide-border)',
        color: 'var(--ide-text-muted)',
      }}
      className="w-14 py-3 select-none pr-1.5 font-mono text-[11px] border-r shrink-0 overflow-hidden"
    >
      {lines.map((_: string, i: number) => {
        const lineNum = i + 1;
        const bp = debugBreakpoints?.find((b: any) => b.filePath === activeFile && b.line === lineNum);
        const isExecutionLine = debugLocation?.filePath === activeFile && debugLocation?.line === lineNum;

        return (
          <div
            key={i}
            onClick={() => toggleBreakpoint?.(activeFile, lineNum)}
            className={`leading-5 h-5 flex items-center justify-between px-1 cursor-pointer group hover:bg-slate-800/60 rounded-sm transition-colors ${
              isExecutionLine ? 'bg-amber-500/25 text-amber-300 font-bold' : ''
            }`}
            title={
              isExecutionLine
                ? `Current execution position (Line ${lineNum})`
                : bp
                ? `Breakpoint at line ${lineNum} (${bp.enabled ? 'Enabled' : 'Disabled'}${bp.condition ? `, condition: ${bp.condition}` : ''}) - Click to toggle`
                : `Click to set breakpoint at line ${lineNum}`
            }
          >
            {/* Breakpoint / Execution Indicator */}
            <div className="w-3.5 h-3.5 flex items-center justify-center shrink-0">
              {isExecutionLine ? (
                <span className="text-amber-400 font-bold text-xs select-none">▶</span>
              ) : bp ? (
                <span
                  className={`w-2.5 h-2.5 rounded-full inline-block transition-transform hover:scale-125 ${
                    bp.enabled ? 'bg-rose-500 shadow-sm shadow-rose-500/50' : 'border border-rose-500 bg-transparent'
                  } ${bp.condition ? 'ring-1 ring-amber-400' : ''}`}
                />
              ) : (
                <span className="w-2 h-2 rounded-full bg-rose-500/0 group-hover:bg-rose-500/40 transition-colors inline-block" />
              )}
            </div>

            {/* Line Number */}
            <span className={`text-right flex-1 ${isExecutionLine ? 'text-amber-300 font-bold' : ''}`}>
              {lineNum}
            </span>
          </div>
        );
      })}
    </div>
  );
};
