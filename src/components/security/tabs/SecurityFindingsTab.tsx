import React from 'react';
import {
  ShieldCheck,
  Check,
  FileCode,
  ChevronRight,
  RefreshCw,
  Sparkles,
  AlertTriangle,
} from 'lucide-react';
import { SecurityFinding, SecurityAuditReport } from '../../../types/securityAudit';

interface SecurityFindingsTabProps {
  report: SecurityAuditReport;
  filteredFindings: SecurityFinding[];
  remediatingId: string | null;
  verifyingId: string | null;
  onOpenFindingFile: (filePath: string) => void;
  onApplyRemediation: (finding: SecurityFinding) => void;
  onVerifyFinding: (finding: SecurityFinding) => void;
  onLoadVulnerableFixture: () => void;
  renderCategoryIcon: (cat: any) => React.ReactNode;
  renderSeverityBadge: (sev: any) => React.ReactNode;
}

export const SecurityFindingsTab: React.FC<SecurityFindingsTabProps> = ({
  report,
  filteredFindings,
  remediatingId,
  verifyingId,
  onOpenFindingFile,
  onApplyRemediation,
  onVerifyFinding,
  onLoadVulnerableFixture,
  renderCategoryIcon,
  renderSeverityBadge,
}) => {
  if (filteredFindings.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-48 gap-3 text-slate-400 bg-slate-900/40 rounded-xl border border-slate-800/80 p-6 text-center">
        <ShieldCheck className="w-12 h-12 text-emerald-400" />
        <div className="text-sm font-bold text-white">No security findings matching current filters</div>
        <p className="text-xs text-slate-400 max-w-md">
          {report.findings.length > 0
            ? 'All findings were filtered out by the active category or severity filter.'
            : 'The project passed static analysis and dependency audits with zero detected vulnerabilities.'}
        </p>
        <button
          onClick={onLoadVulnerableFixture}
          className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded text-xs font-semibold cursor-pointer"
        >
          Load Deliberately Vulnerable Fixture to Test All Analyzers
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {filteredFindings.map(finding => (
        <div
          key={finding.id}
          className={`rounded-lg border p-4 flex flex-col gap-3 transition-all ${
            finding.resolved
              ? 'bg-slate-900/40 border-emerald-900/60 opacity-75'
              : finding.severity === 'critical'
              ? 'bg-rose-950/20 border-rose-800/60 shadow-sm'
              : finding.severity === 'high'
              ? 'bg-orange-950/20 border-orange-800/60'
              : 'bg-slate-900/80 border-slate-800'
          }`}
        >
          {/* Header Row */}
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-2.5">
              <div className="mt-0.5">{renderCategoryIcon(finding.category)}</div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-bold text-sm text-white">{finding.title}</span>
                  {renderSeverityBadge(finding.severity)}
                  <span className="px-1.5 py-0.2 rounded text-[10px] font-mono bg-slate-800 text-slate-400 border border-slate-700">
                    {finding.ruleId}
                  </span>
                  {finding.resolved && (
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-950 text-emerald-300 border border-emerald-600 flex items-center gap-1">
                      <Check className="w-3 h-3" /> RESOLVED ({finding.resolvedAt})
                    </span>
                  )}
                </div>

                {/* File Location */}
                <button
                  onClick={() => onOpenFindingFile(finding.filePath)}
                  className="mt-1 text-xs font-mono text-indigo-400 hover:text-indigo-300 flex items-center gap-1 cursor-pointer group"
                  title="Open file at line in editor"
                >
                  <FileCode className="w-3.5 h-3.5 text-slate-400 group-hover:text-indigo-300" />
                  <span className="underline underline-offset-2">{finding.filePath}:{finding.lineStart}</span>
                  <ChevronRight className="w-3 h-3 text-slate-500 group-hover:translate-x-0.5 transition-transform" />
                </button>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2 shrink-0">
              {!finding.resolved && (
                <button
                  onClick={() => onApplyRemediation(finding)}
                  disabled={remediatingId === finding.id}
                  className="px-2.5 py-1.5 rounded bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-xs font-semibold flex items-center gap-1.5 cursor-pointer shadow"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>{remediatingId === finding.id ? 'Applying...' : 'Apply Fix'}</span>
                </button>
              )}

              <button
                onClick={() => onVerifyFinding(finding)}
                disabled={verifyingId === finding.id}
                className="px-2.5 py-1.5 rounded bg-slate-800 hover:bg-slate-700 border border-slate-700 disabled:opacity-50 text-slate-300 text-xs font-medium flex items-center gap-1.5 cursor-pointer"
              >
                <RefreshCw className={`w-3 h-3 ${verifyingId === finding.id ? 'animate-spin' : ''}`} />
                <span>Verify</span>
              </button>
            </div>
          </div>

          {/* Evidence Code Box */}
          <div className="bg-slate-950 rounded border border-slate-800/80 p-2.5 flex flex-col gap-1">
            <div className="flex items-center justify-between text-[10px] text-slate-500 font-mono">
              <span>Evidence Snippet (Secrets Strictly Redacted)</span>
              <span>Line {finding.lineStart}</span>
            </div>
            <pre className="text-xs font-mono text-amber-300 whitespace-pre-wrap break-all select-text">
              {finding.evidence}
            </pre>
          </div>

          {/* Explanation & Attack Vector */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs bg-slate-950/40 p-3 rounded border border-slate-800/50">
            <div>
              <span className="text-[10px] uppercase tracking-wider font-bold text-slate-400 block mb-1">
                Vulnerability Explanation
              </span>
              <p className="text-slate-300 leading-relaxed">{finding.explanation}</p>
            </div>
            <div>
              <span className="text-[10px] uppercase tracking-wider font-bold text-rose-400 block mb-1">
                Potential Attack Vector
              </span>
              <p className="text-slate-300 leading-relaxed">{finding.attackVector}</p>
            </div>
          </div>

          {/* Confidence & Limitations */}
          <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-400 border-t border-slate-800/60 pt-2">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-slate-300">Confidence:</span>
              <span className={`font-mono uppercase font-bold ${
                finding.confidence === 'high' ? 'text-emerald-400' : 'text-amber-400'
              }`}>
                {finding.confidence}
              </span>
              <span className="text-slate-500">({finding.confidenceReason})</span>
            </div>
            <div className="text-slate-500 italic max-w-md truncate" title={finding.limitations}>
              Limitations: {finding.limitations}
            </div>
          </div>

          {/* Remediation Details */}
          <div className="bg-indigo-950/20 border border-indigo-900/40 rounded p-2.5 flex items-start justify-between gap-3 text-xs">
            <div className="flex items-start gap-2">
              <Sparkles className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
              <div>
                <div className="font-semibold text-indigo-300">{finding.remediation.title}</div>
                <p className="text-slate-400 text-[11px] mt-0.5">{finding.recommendedFix}</p>
                {finding.remediation.isBreaking && (
                  <div className="mt-1 text-[11px] text-amber-300 font-semibold flex items-center gap-1">
                    <AlertTriangle className="w-3.5 h-3.5" />
                    <span>Requires human approval: Major dependency upgrade carries breaking change risk.</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};
