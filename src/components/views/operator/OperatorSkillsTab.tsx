import React from 'react';
import { ExecutableSkill, KnowledgeGraphSnapshot } from '../../types/kos';

interface Props {
  graph: KnowledgeGraphSnapshot;
  skills: ExecutableSkill[];
  onSyncGraph: () => void;
}

export const OperatorSkillsTab: React.FC<Props> = ({ graph, skills, onSyncGraph }) => {
  return (
    <div className="max-w-5xl flex flex-col gap-5">
      <div>
        <h2 className="text-sm font-bold text-white">Skills Registry & Codebase Knowledge Graph</h2>
        <p className="text-xs text-slate-400">
          Executable skill definitions and symbol relationship graphs built for context generation.
        </p>
      </div>

      {/* Knowledge Graph Stats */}
      <div className="p-3.5 bg-slate-900 border border-slate-800 rounded-xl flex items-center justify-between">
        <div>
          <span className="font-bold text-xs text-white">Symbol & Dependency Graph</span>
          <p className="text-[10px] text-slate-400 font-mono mt-0.5">
            {graph.nodeCount} nodes indexed, {graph.edgeCount} relationships verified
          </p>
        </div>
        <button
          onClick={onSyncGraph}
          className="px-3 py-1 bg-indigo-600 hover:bg-indigo-500 text-white rounded text-xs font-bold cursor-pointer"
        >
          Sync Graph
        </button>
      </div>

      {/* Skills List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {skills.map(skill => (
          <div key={skill.id} className="p-3 bg-slate-900 border border-slate-800 rounded-xl flex flex-col justify-between gap-2 text-xs">
            <div>
              <div className="flex items-center justify-between">
                <span className="font-bold text-white">/{skill.name}</span>
                <span className="text-[10px] font-mono text-slate-400">v{skill.version}</span>
              </div>
              <p className="text-[11px] text-slate-300 mt-1">{skill.description}</p>
            </div>
            <div className="pt-2 border-t border-slate-800 text-[10px] text-slate-400 font-mono">
              Allowed tools: {skill.allowedTools.join(', ')}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
