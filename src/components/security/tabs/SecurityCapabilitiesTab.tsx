import React from 'react';
import { CheckCircle2, AlertTriangle } from 'lucide-react';
import { SecurityAuditReport } from '../../../types/securityAudit';

interface SecurityCapabilitiesTabProps {
  report: SecurityAuditReport;
}

export const SecurityCapabilitiesTab: React.FC<SecurityCapabilitiesTabProps> = ({ report }) => {
  return (
    <div className="flex flex-col gap-4">
      <div className="bg-slate-900/60 border border-slate-800 rounded-lg p-4 flex flex-col gap-2">
        <span className="font-bold text-sm text-white">Automated Static Analyzers & Detection Rules</span>
        <p className="text-xs text-slate-400 leading-relaxed">
          The Vertex Forge Security Auditor combines real package-manager audit commands with static syntax-tree inspectors across 12 critical security domains:
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-2">
          {report.auditorCapabilities.map((cap, i) => (
            <div key={i} className="flex items-center gap-2 p-2 rounded bg-slate-950/60 border border-slate-800 text-xs">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span className="text-slate-200">{cap}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Honest Limitations & Disclaimer */}
      <div className="bg-amber-950/20 border border-amber-900/40 rounded-lg p-4 flex items-start gap-3 text-xs">
        <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
        <div>
          <span className="font-bold text-amber-300 block mb-1">Security Disclaimer & Scope Limitations</span>
          <p className="text-slate-300 leading-relaxed">{report.limitationsDisclaimer}</p>
          <p className="text-slate-400 mt-2 text-[11px]">
            Scans are performed locally on the machine without transmitting source code or credentials to external parties.
          </p>
        </div>
      </div>
    </div>
  );
};
