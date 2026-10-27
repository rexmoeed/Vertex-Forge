import React from 'react';
import { Clock, ArrowRight } from 'lucide-react';
import { JulesSession } from '../../../services/julesService';

interface JulesMissionHistoryTabProps {
  historySessions: JulesSession[];
  onSelectSession: (sess: JulesSession) => void;
  renderStatusBadge: (state?: string) => React.ReactNode;
}

export const JulesMissionHistoryTab: React.FC<JulesMissionHistoryTabProps> = ({
  historySessions,
  onSelectSession,
  renderStatusBadge,
}) => {
  if (historySessions.length === 0) {
    return (
      <div className="text-center py-12 text-slate-400">
        <Clock className="w-10 h-10 mx-auto text-slate-600 stroke-1 mb-2" />
        <p className="text-xs">No previous Jules cloud missions recorded.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {historySessions.map((sess, idx) => (
        <div
          key={idx}
          onClick={() => onSelectSession(sess)}
          style={{ backgroundColor: 'var(--ide-surface-elevated)', borderColor: 'var(--ide-border)' }}
          className="p-3.5 rounded-xl border hover:border-indigo-500/50 cursor-pointer transition-all flex items-center justify-between group"
        >
          <div className="space-y-1 min-w-0 pr-4">
            <div className="flex items-center gap-2">
              <h4 className="text-xs font-bold text-white group-hover:text-indigo-300 transition-colors truncate">
                {sess.title || sess.prompt.slice(0, 45)}
              </h4>
              <span className="text-[10px] font-mono text-slate-500">{sess.id || sess.name}</span>
            </div>
            <p className="text-[11px] text-slate-400 truncate">{sess.prompt}</p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            {renderStatusBadge(sess.state)}
            <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-white group-hover:translate-x-1 transition-transform" />
          </div>
        </div>
      ))}
    </div>
  );
};
