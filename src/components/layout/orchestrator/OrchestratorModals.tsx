import React from 'react';
import { X, Search, FileCode, FileText, Code2 } from 'lucide-react';
import { VirtualFileSystem } from '../../../services/virtualFs';

export interface OrchestratorModalsProps {
  showFilePicker: boolean;
  setShowFilePicker: (show: boolean) => void;
  fileSearchQuery: string;
  setFileSearchQuery: (query: string) => void;
  vfs?: VirtualFileSystem;
  activeFile: string | null;
  handleAttachFile: (filePath: string) => void;

  showLinePicker: boolean;
  setShowLinePicker: (show: boolean) => void;
  selectedFileForLines: string;
  setSelectedFileForLines: (file: string) => void;
  activeFileContent: string;
  lineStartInput: number;
  setLineStartInput: (line: number) => void;
  lineEndInput: number;
  setLineEndInput: (line: number) => void;
  handleAttachLines: (filePath: string, start: number, end: number) => void;

  imageModalUrl: string | null;
  setImageModalUrl: (url: string | null) => void;
}

export const OrchestratorModals: React.FC<OrchestratorModalsProps> = ({
  showFilePicker,
  setShowFilePicker,
  fileSearchQuery,
  setFileSearchQuery,
  vfs,
  activeFile,
  handleAttachFile,

  showLinePicker,
  setShowLinePicker,
  selectedFileForLines,
  setSelectedFileForLines,
  activeFileContent,
  lineStartInput,
  setLineStartInput,
  lineEndInput,
  setLineEndInput,
  handleAttachLines,

  imageModalUrl,
  setImageModalUrl,
}) => {
  return (
    <>
      {/* MODAL: WORKSPACE FILE PICKER */}
      {showFilePicker && (
        <div className="absolute inset-x-2 bottom-12 bg-[#141416] border border-white/10 rounded-xl shadow-2xl overflow-hidden z-40 max-h-80 flex flex-col animate-in fade-in duration-100">
          <div className="p-2.5 border-b border-white/10 flex items-center justify-between bg-black/40">
            <div className="flex items-center gap-1.5 text-xs font-bold text-white">
              <FileText className="w-3.5 h-3.5 text-indigo-400" />
              <span>Attach Workspace File</span>
            </div>
            <button
              type="button"
              onClick={() => setShowFilePicker(false)}
              className="p-1 rounded-md text-slate-400 hover:text-white hover:bg-white/10 cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="p-2 border-b border-white/10">
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-slate-400" />
              <input
                type="text"
                autoFocus
                value={fileSearchQuery}
                onChange={(e) => setFileSearchQuery(e.target.value)}
                placeholder="Filter files by path or name..."
                className="w-full pl-8 pr-3 py-1.5 text-xs bg-white/5 border border-white/10 rounded-lg text-white placeholder:text-slate-500 focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          <div className="overflow-y-auto max-h-52 p-1 space-y-0.5">
            {Array.from((vfs?.getAllFiles()?.keys() as Iterable<string>) || [])
              .filter(
                (filePath) =>
                  !fileSearchQuery || filePath.toLowerCase().includes(fileSearchQuery.toLowerCase())
              )
              .map((filePath) => {
                const fileName = filePath.split('/').pop() || filePath;
                const dirPath = filePath.includes('/')
                  ? filePath.substring(0, filePath.lastIndexOf('/'))
                  : '';
                const isCurrentActive = activeFile === filePath;

                return (
                  <button
                    key={filePath}
                    type="button"
                    onClick={() => handleAttachFile(filePath)}
                    className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-left hover:bg-white/10 group transition cursor-pointer"
                  >
                    <div className="flex items-center gap-2 truncate">
                      <FileCode className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                      <span className="text-xs font-mono font-medium text-slate-200 group-hover:text-indigo-400 truncate">
                        {fileName}
                      </span>
                      {dirPath && (
                        <span className="text-[10px] text-slate-500 truncate font-mono">
                          {dirPath}
                        </span>
                      )}
                    </div>
                    {isCurrentActive && (
                      <span className="text-[9px] px-1.5 py-0.5 rounded bg-cyan-950/80 text-cyan-300 font-mono font-medium shrink-0">
                        Active
                      </span>
                    )}
                  </button>
                );
              })}
          </div>
        </div>
      )}

      {/* MODAL: CODE LINE RANGE REFERENCE PICKER */}
      {showLinePicker && (
        <div className="absolute inset-x-2 bottom-12 bg-[#141416] border border-white/10 rounded-xl shadow-2xl overflow-hidden z-40 max-h-96 flex flex-col animate-in fade-in duration-100">
          <div className="p-2.5 border-b border-white/10 flex items-center justify-between bg-black/40">
            <div className="flex items-center gap-1.5 text-xs font-bold text-white">
              <Code2 className="w-3.5 h-3.5 text-amber-400" />
              <span>Reference Code Lines</span>
            </div>
            <button
              type="button"
              onClick={() => setShowLinePicker(false)}
              className="p-1 rounded-md text-slate-400 hover:text-white hover:bg-white/10 cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="p-3 space-y-3">
            <div>
              <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                Target File
              </label>
              <select
                value={selectedFileForLines || activeFile || 'src/App.tsx'}
                onChange={(e) => setSelectedFileForLines(e.target.value)}
                className="w-full text-xs font-mono bg-white/5 border border-white/10 rounded-lg px-2.5 py-1.5 text-white focus:outline-none focus:border-amber-500"
              >
                {Array.from((vfs?.getAllFiles()?.keys() as Iterable<string>) || []).map((f) => (
                  <option key={f} value={f} className="bg-slate-900 text-white">
                    {f} {f === activeFile ? '(Active)' : ''}
                  </option>
                ))}
              </select>
            </div>

            {(() => {
              const targetFilePath = selectedFileForLines || activeFile || 'src/App.tsx';
              const content =
                (targetFilePath === activeFile
                  ? activeFileContent
                  : vfs?.readFile(targetFilePath)) || '';
              const totalLines = Math.max(1, content ? content.split('\n').length : 1);

              return (
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      Line Range (Total: {totalLines} lines)
                    </label>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <span className="text-[10px] text-slate-400 block mb-0.5">Start Line:</span>
                      <input
                        type="number"
                        min={1}
                        max={totalLines}
                        value={lineStartInput}
                        onChange={(e) =>
                          setLineStartInput(Math.max(1, parseInt(e.target.value, 10) || 1))
                        }
                        className="w-full text-xs font-mono bg-white/5 border border-white/10 rounded-lg px-2.5 py-1 text-white focus:outline-none focus:border-amber-500"
                      />
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block mb-0.5">End Line:</span>
                      <input
                        type="number"
                        min={lineStartInput}
                        max={totalLines}
                        value={lineEndInput}
                        onChange={(e) =>
                          setLineEndInput(
                            Math.min(
                              totalLines,
                              Math.max(
                                lineStartInput,
                                parseInt(e.target.value, 10) || lineStartInput
                              )
                            )
                          )
                        }
                        className="w-full text-xs font-mono bg-white/5 border border-white/10 rounded-lg px-2.5 py-1 text-white focus:outline-none focus:border-amber-500"
                      />
                    </div>
                  </div>

                  <div className="mt-2.5">
                    <span className="text-[10px] text-slate-400 block mb-1">Lines Preview:</span>
                    <pre className="p-2 rounded-lg bg-black/60 text-slate-200 font-mono text-[10px] max-h-28 overflow-y-auto whitespace-pre-wrap border border-white/10 select-text">
                      {content
                        ? content.split('\n').slice(lineStartInput - 1, lineEndInput).join('\n')
                        : '// Empty file'}
                    </pre>
                  </div>

                  <div className="flex items-center justify-end gap-2 mt-3">
                    <button
                      type="button"
                      onClick={() => setShowLinePicker(false)}
                      className="px-2.5 py-1 text-xs text-slate-400 hover:text-white cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        handleAttachLines(targetFilePath, lineStartInput, lineEndInput)
                      }
                      className="px-3 py-1.5 bg-amber-600 hover:bg-amber-500 text-white rounded-lg text-xs font-semibold shadow cursor-pointer"
                    >
                      Attach Lines {lineStartInput}-{lineEndInput}
                    </button>
                  </div>
                </div>
              );
            })()}
          </div>
        </div>
      )}

      {/* MODAL: FULL IMAGE PREVIEW */}
      {imageModalUrl && (
        <div
          onClick={() => setImageModalUrl(null)}
          className="fixed inset-0 bg-black/80 backdrop-blur-xs z-50 flex items-center justify-center p-4"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="relative max-w-2xl max-h-[85vh] bg-slate-900 rounded-xl overflow-hidden border border-slate-800 shadow-2xl flex flex-col"
          >
            <div className="p-2 flex items-center justify-between border-b border-slate-800 bg-slate-950">
              <span className="text-xs text-slate-300 font-medium">Attached Image Preview</span>
              <button
                type="button"
                onClick={() => setImageModalUrl(null)}
                className="p-1 text-slate-400 hover:text-white rounded cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-2 overflow-auto flex items-center justify-center">
              <img
                src={imageModalUrl}
                alt="Preview"
                className="max-w-full max-h-[70vh] object-contain rounded"
              />
            </div>
          </div>
        </div>
      )}
    </>
  );
};
