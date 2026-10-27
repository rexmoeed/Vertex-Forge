import React from 'react';
import {
  CheckCircle2,
  ExternalLink,
  AlertTriangle,
  Check,
} from 'lucide-react';
import { SecurityAuditReport, SecurityFinding } from '../../../types/securityAudit';

interface SecurityDependenciesTabProps {
  report: SecurityAuditReport;
  onApplyRemediation: (finding: SecurityFinding) => void;
  onNotifyAction: (msg: { message: string; type: 'success' | 'error' | 'info' }) => void;
  renderSeverityBadge: (sev: any) => React.ReactNode;
}

export const SecurityDependenciesTab: React.FC<SecurityDependenciesTabProps> = ({
  report,
  onApplyRemediation,
  onNotifyAction,
  renderSeverityBadge,
}) => {
  return (
    <div className="flex flex-col gap-3">
      <div className="bg-slate-900/60 border border-slate-800 rounded-lg p-3 text-xs flex items-center justify-between">
        <div>
          <span className="font-bold text-white block">Manifest & Lockfile Dependency Audit</span>
          <span className="text-[11px] text-slate-400">
            Real npm audit analysis cross-referenced with GitHub Advisory Database (GHSA) and CVE registries.
          </span>
        </div>
        <span className="px-2.5 py-1 rounded bg-indigo-500/10 border border-indigo-500/30 text-indigo-300 font-bold">
          {report.dependencies.length} Vulnerabilities Found
        </span>
      </div>

      {report.dependencies.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-48 gap-2 text-slate-400 bg-slate-900/30 rounded-lg border border-slate-800 p-6">
          <CheckCircle2 className="w-10 h-10 text-emerald-400" />
          <span className="text-sm font-bold text-white">All Installed Dependencies Are Clean</span>
          <span className="text-xs text-slate-400">Zero known vulnerability advisories for declared packages.</span>
        </div>
      ) : (
        <div className="border border-slate-800 rounded-lg overflow-hidden">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-900 border-b border-slate-800 text-slate-400 font-semibold text-[11px]">
              <tr>
                <th className="p-3">Package</th>
                <th className="p-3">Severity</th>
                <th className="p-3">Current</th>
                <th className="p-3">Patched</th>
                <th className="p-3">Advisory Details</th>
                <th className="p-3">Risk Assessment</th>
                <th className="p-3 text-right">Remediation</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 bg-slate-950/60 font-mono text-[11px]">
              {report.dependencies.map((dep, idx) => (
                <tr key={idx} className="hover:bg-slate-900/40">
                  <td className="p-3 font-bold text-indigo-300">{dep.packageName}</td>
                  <td className="p-3">{renderSeverityBadge(dep.severity)}</td>
                  <td className="p-3 text-slate-400">{dep.currentVersion}</td>
                  <td className="p-3 text-emerald-400 font-semibold">{dep.fixedVersion}</td>
                  <td className="p-3 font-sans text-xs max-w-xs">
                    <a
                      href={dep.advisoryUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-slate-300 hover:text-indigo-300 flex items-center gap-1 group"
                    >
                      <span className="line-clamp-1">{dep.advisoryTitle}</span>
                      <ExternalLink className="w-3 h-3 text-slate-500 shrink-0" />
                    </a>
                  </td>
                  <td className="p-3 font-sans text-xs">
                    {dep.isBreaking ? (
                      <span className="text-amber-400 flex items-center gap-1" title={dep.breakingExplanation}>
                        <AlertTriangle className="w-3.5 h-3.5 shrink-0" /> Major bump (Requires Approval)
                      </span>
                    ) : (
                      <span className="text-emerald-400 flex items-center gap-1">
                        <Check className="w-3.5 h-3.5 shrink-0" /> Safe Patch/Minor Upgrade
                      </span>
                    )}
                  </td>
                  <td className="p-3 text-right font-sans">
                    <button
                      onClick={() => {
                        const matchFinding = report.findings.find(f => f.title.includes(dep.packageName));
                        if (matchFinding) {
                          onApplyRemediation(matchFinding);
                        } else {
                          onNotifyAction({
                            message: `Run: npm install ${dep.packageName}@${dep.fixedVersion}`,
                            type: 'info',
                          });
                        }
                      }}
                      className="px-2.5 py-1 rounded bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs cursor-pointer"
                    >
                      Upgrade
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
