import React from 'react';
import { RotateCw } from 'lucide-react';
import type { useOperatorConsole } from '../../../hooks/useOperatorConsole';

interface Props {
  nodes: ReturnType<typeof useOperatorConsole>['nodes'];
  routes: ReturnType<typeof useOperatorConsole>['routes'];
  onPingNode: (id: string, name: string) => void;
}

export const OperatorRouterTab: React.FC<Props> = ({ nodes, routes, onPingNode }) => {
  return (
    <div className="max-w-5xl flex flex-col gap-5">
      <div>
        <h2 className="text-sm font-bold text-white">Model Routing & LAN GPU Nodes</h2>
        <p className="text-xs text-slate-400">
          Cost-aware task routing across cloud providers and private local LAN inference hardware.
        </p>
      </div>

      {/* LAN Nodes */}
      <div>
        <h3 className="text-xs font-bold text-white mb-2">Registered LAN Nodes</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {nodes.map(n => (
            <div key={n.id} className="p-3 bg-slate-900 border border-slate-800 rounded-xl flex items-center justify-between text-xs">
              <div>
                <div className="font-bold text-white flex items-center gap-2">
                  <span>{n.name}</span>
                  <span
                    className={`w-2 h-2 rounded-full ${
                      n.status === 'online' ? 'bg-emerald-400' : 'bg-rose-400'
                    }`}
                  />
                </div>
                <div className="text-[10px] text-slate-400 font-mono">
                  {n.host}:{n.port} ({n.type}) | Latency: {n.latencyMs}ms
                </div>
                {n.hardwareInfo && (
                  <div className="text-[9px] text-indigo-300 font-mono mt-0.5">{n.hardwareInfo}</div>
                )}
              </div>

              <button
                onClick={() => onPingNode(n.id, n.name)}
                className="p-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 cursor-pointer"
                title="Ping Node Health"
              >
                <RotateCw className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Task Router Table */}
      <div>
        <h3 className="text-xs font-bold text-white mb-2">Task Routing Rules</h3>
        <div className="space-y-1.5">
          {routes.map(r => (
            <div key={r.category} className="p-2.5 bg-slate-900 border border-slate-800 rounded-lg text-xs flex items-center justify-between font-mono">
              <span className="text-indigo-300 font-bold">{r.category}</span>
              <span className="text-slate-200">
                Primary: {r.primaryProvider}/{r.primaryModel}
              </span>
              <span className="text-slate-400 text-[10px]">Max tokens: {r.maxTokens}</span>
              <span className="text-emerald-400 text-[10px]">${r.costCeilingPerReqUsd} cap</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
