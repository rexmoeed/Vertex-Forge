import React from 'react';
import { AlertTriangle } from 'lucide-react';
import { SecurityFinding } from '../../../types/securityAudit';

interface SecurityApprovalModalProps {
  finding: SecurityFinding;
  onCancel: () => void;
  onApprove: (finding: SecurityFinding) => void;
}

export const SecurityApprovalModal: React.FC<SecurityApprovalModalProps> = ({
  finding,
  onCancel,
  onApprove,
}) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="bg-slate-900 border border-amber-600/60 rounded-xl max-w-md w-full p-5 flex flex-col gap-4 shadow-2xl">
        <div className="flex items-start gap-3">
          <div className="p-2 rounded bg-amber-500/20 text-amber-400">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white">Approval Required: Potentially Breaking Remediation</h3>
            <p className="text-xs text-slate-400 mt-1">{finding.title}</p>
          </div>
        </div>

        <div className="bg-slate-950 rounded border border-slate-800 p-3 text-xs flex flex-col gap-2">
          <div>
            <span className="text-[10px] uppercase font-bold text-slate-500">Proposed Action</span>
            <div className="font-semibold text-indigo-300">{finding.remediation.title}</div>
          </div>
          <div>
            <span className="text-[10px] uppercase font-bold text-amber-400">Breaking Risk Warning</span>
            <p className="text-slate-300 mt-0.5 leading-relaxed">
              {finding.remediation.breakingRiskDetails ||
                'This remediation modifies dependencies or credential references and may require testing or rotation verification.'}
            </p>
          </div>
        </div>

        <div className="flex items-center justify-end gap-2">
          <button
            onClick={onCancel}
            className="px-3 py-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold cursor-pointer"
          >
            Cancel
          </button>
          <button
            onClick={() => onApprove(finding)}
            className="px-4 py-1.5 rounded bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold cursor-pointer shadow"
          >
            Approve & Apply Change
          </button>
        </div>
      </div>
    </div>
  );
};
