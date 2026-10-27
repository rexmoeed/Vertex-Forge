import { logger } from '../../services/logger';
import React, { useState, useEffect, useMemo } from 'react';
import {
  ShieldAlert,
  CheckCircle2,
  XCircle,
  RefreshCw,
  Download,
  Search,
  Sparkles,
  Info,
} from 'lucide-react';
import { useIDE } from '../../context/IDEContext';
import {
  SecurityAuditReport,
  SecurityFinding,
} from '../../types/securityAudit';
import { SecurityAuditService } from '../../services/securityAuditService';
import { SecurityFindingsTab } from './tabs/SecurityFindingsTab';
import { SecurityDependenciesTab } from './tabs/SecurityDependenciesTab';
import { SecurityCapabilitiesTab } from './tabs/SecurityCapabilitiesTab';
import { SecurityApprovalModal } from './modals/SecurityApprovalModal';
import { getScoreColor, getSeverityBadge, getCategoryIcon } from './securityHelpers';

export const SecurityAuditorPanel: React.FC = () => {
  const { openFile } = useIDE();

  const [report, setReport] = useState<SecurityAuditReport | null>(null);
  const [loading, setLoading] = useState(false);
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [severityFilter, setSeverityFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showResolved, setShowResolved] = useState(false);
  const [activeTab, setActiveTab] = useState<'findings' | 'dependencies' | 'capabilities'>('findings');

  // Remediation approval state
  const [pendingApprovalFinding, setPendingApprovalFinding] = useState<SecurityFinding | null>(null);
  const [remediatingId, setRemediatingId] = useState<string | null>(null);
  const [verifyingId, setVerifyingId] = useState<string | null>(null);
  const [actionNotice, setActionNotice] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);

  // Initial audit run on mount
  useEffect(() => {
    runAudit();
  }, []);

  const runAudit = async (customPath?: string) => {
    setLoading(true);
    setActionNotice(null);
    try {
      const data = await SecurityAuditService.runAudit(customPath);
      setReport(data);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      logger.error({ err }, `Audit run failed: ${msg}`);
      setActionNotice({ message: `Audit failed: ${msg}`, type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleLoadVulnerableFixture = async () => {
    setLoading(true);
    setActionNotice({ message: 'Creating deliberately vulnerable test fixture...', type: 'info' });
    try {
      const res = await SecurityAuditService.createVulnerableFixture();
      if (res.success) {
        setActionNotice({
          message: 'Loaded deliberate test fixture (sample-projects/security-fixtures). Auditing now...',
          type: 'success',
        });
        await runAudit(res.fixturePath);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      logger.error({ err }, `Failed to load fixture: ${msg}`);
      setActionNotice({ message: `Failed to load fixture: ${msg}`, type: 'error' });
      setLoading(false);
    }
  };

  const handleApplyRemediation = async (finding: SecurityFinding, forceApprove: boolean = false) => {
    if (finding.remediation.requiresApproval && !forceApprove) {
      setPendingApprovalFinding(finding);
      return;
    }

    setRemediatingId(finding.id);
    setPendingApprovalFinding(null);
    try {
      const result = await SecurityAuditService.applyRemediation(finding, report?.projectPath);
      if (result.success) {
        setActionNotice({ message: result.message, type: 'success' });
        if (report) {
          setReport({
            ...report,
            findings: report.findings.map(f =>
              f.id === finding.id ? { ...f, resolved: true, resolvedAt: new Date().toLocaleTimeString() } : f
            ),
          });
        }
      } else {
        setActionNotice({ message: result.message, type: 'error' });
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      logger.error({ err, findingId: finding.id }, `Remediation failed: ${msg}`);
      setActionNotice({ message: `Remediation failed: ${msg}`, type: 'error' });
    } finally {
      setRemediatingId(null);
    }
  };

  const handleVerifyFinding = async (finding: SecurityFinding) => {
    setVerifyingId(finding.id);
    try {
      const result = await SecurityAuditService.verifyResolution(finding, report?.projectPath);
      if (result.resolved) {
        setActionNotice({ message: result.message, type: 'success' });
        if (report) {
          setReport({
            ...report,
            findings: report.findings.map(f =>
              f.id === finding.id ? { ...f, resolved: true, resolvedAt: new Date().toLocaleTimeString() } : f
            ),
          });
        }
      } else {
        setActionNotice({ message: result.message, type: 'error' });
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      logger.error({ err, findingId: finding.id }, `Verification failed: ${msg}`);
      setActionNotice({ message: `Verification failed: ${msg}`, type: 'error' });
    } finally {
      setVerifyingId(null);
    }
  };

  const handleExport = (format: 'markdown' | 'json') => {
    if (!report) return;
    const content = SecurityAuditService.exportReport(report, format);
    const blob = new Blob([content], { type: format === 'json' ? 'application/json' : 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `security-audit-${Date.now()}.${format === 'json' ? 'json' : 'md'}`;
    a.click();
    URL.revokeObjectURL(url);
    setActionNotice({ message: `Exported audit report as ${format.toUpperCase()}`, type: 'success' });
  };

  const filteredFindings = useMemo(() => {
    if (!report) return [];
    return report.findings.filter(f => {
      if (!showResolved && f.resolved) return false;
      if (activeCategory !== 'all' && f.category !== activeCategory) return false;
      if (severityFilter === 'critical' && f.severity !== 'critical') return false;
      if (severityFilter === 'high+' && f.severity !== 'critical' && f.severity !== 'high') return false;
      if (severityFilter === 'medium+' && f.severity === 'low') return false;

      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchesTitle = f.title.toLowerCase().includes(query);
        const matchesFile = f.filePath.toLowerCase().includes(query);
        const matchesRule = f.ruleId.toLowerCase().includes(query);
        const matchesEvidence = f.evidence.toLowerCase().includes(query);
        if (!matchesTitle && !matchesFile && !matchesRule && !matchesEvidence) return false;
      }

      return true;
    });
  }, [report, activeCategory, severityFilter, searchQuery, showResolved]);



  return (
    <div className="h-full flex flex-col bg-slate-950 text-slate-200 select-none overflow-hidden font-sans">
      {/* 1. TOP HEADER & AUDIT METRICS BANNER */}
      <div className="border-b border-slate-800 bg-slate-900/90 px-4 py-3 flex flex-wrap items-center justify-between gap-3 shrink-0">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-indigo-500/10 border border-indigo-500/30 text-indigo-400">
            <ShieldAlert className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-bold text-white tracking-wide">Security & Dependency Auditor</h2>
              {report && (
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                  report.status === 'clean' ? 'bg-emerald-950 text-emerald-300 border-emerald-600' :
                  report.status === 'scan_partial' ? 'bg-amber-950 text-amber-300 border-amber-600' :
                  report.status === 'scan_failed' ? 'bg-rose-950 text-rose-300 border-rose-600' :
                  'bg-rose-950/80 text-rose-300 border-rose-700'
                }`}>
                  {report.status.toUpperCase().replace('_', ' ')}
                </span>
              )}
            </div>
            <p className="text-[11px] text-slate-400">
              Live AST static analysis, package manifest & lockfile advisory audits, credential leak redactor.
            </p>
          </div>
        </div>

        {/* Global Action Buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => runAudit()}
            disabled={loading}
            className="px-3 py-1.5 rounded bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-semibold flex items-center gap-1.5 shadow transition-all cursor-pointer"
            title="Scan current project workspace"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>{loading ? 'Auditing...' : 'Run Full Audit'}</span>
          </button>

          <button
            onClick={handleLoadVulnerableFixture}
            disabled={loading}
            className="px-3 py-1.5 rounded bg-amber-600/20 hover:bg-amber-600/30 border border-amber-500/40 text-amber-300 text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer"
            title="Audit deliberately vulnerable fixture (sample-projects/security-fixtures)"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>Audit Test Fixtures</span>
          </button>

          <div className="relative group">
            <button
              onClick={() => handleExport('markdown')}
              className="p-1.5 rounded bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 text-xs flex items-center gap-1 cursor-pointer"
              title="Export report as Markdown"
            >
              <Download className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Action Notice Banner */}
      {actionNotice && (
        <div className={`px-4 py-2 text-xs flex items-center justify-between border-b ${
          actionNotice.type === 'success' ? 'bg-emerald-950/80 text-emerald-300 border-emerald-800' :
          actionNotice.type === 'error' ? 'bg-rose-950/80 text-rose-300 border-rose-800' :
          'bg-indigo-950/80 text-indigo-300 border-indigo-800'
        }`}>
          <div className="flex items-center gap-2">
            {actionNotice.type === 'success' ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> :
             actionNotice.type === 'error' ? <XCircle className="w-4 h-4 text-rose-400" /> :
             <Info className="w-4 h-4 text-indigo-400" />}
            <span>{actionNotice.message}</span>
          </div>
          <button onClick={() => setActionNotice(null)} className="text-slate-400 hover:text-white">✕</button>
        </div>
      )}

      {/* 2. STATS & OVERVIEW STRIP */}
      {report && (
        <div className="border-b border-slate-800 bg-slate-900/50 px-4 py-2.5 flex flex-wrap items-center justify-between gap-4 shrink-0 text-xs">
          <div className="flex items-center gap-3">
            <div className={`px-3 py-1.5 rounded-lg border font-black text-lg flex items-center gap-1.5 ${getScoreColor(report.securityScore)}`}>
              <span>{report.securityScore}</span>
              <span className="text-[10px] font-normal text-slate-400">/100</span>
            </div>
            <div>
              <div className="text-[11px] font-bold text-slate-300">Security Health Score</div>
              <div className="text-[10px] text-slate-400">
                {report.scannedFilesCount} files analyzed in {report.durationMs}ms
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="px-2.5 py-1 rounded bg-rose-950/60 border border-rose-700/60 flex items-center gap-1.5">
              <span className="text-[10px] font-bold text-rose-400">CRITICAL</span>
              <span className="font-mono font-bold text-rose-200">{report.counts.critical}</span>
            </div>
            <div className="px-2.5 py-1 rounded bg-orange-950/60 border border-orange-700/60 flex items-center gap-1.5">
              <span className="text-[10px] font-bold text-orange-400">HIGH</span>
              <span className="font-mono font-bold text-orange-200">{report.counts.high}</span>
            </div>
            <div className="px-2.5 py-1 rounded bg-amber-950/60 border border-amber-700/60 flex items-center gap-1.5">
              <span className="text-[10px] font-bold text-amber-400">MEDIUM</span>
              <span className="font-mono font-bold text-amber-200">{report.counts.medium}</span>
            </div>
            <div className="px-2.5 py-1 rounded bg-blue-950/60 border border-blue-700/60 flex items-center gap-1.5">
              <span className="text-[10px] font-bold text-blue-400">LOW</span>
              <span className="font-mono font-bold text-blue-200">{report.counts.low}</span>
            </div>
            <div className="px-2.5 py-1 rounded bg-slate-800 border border-slate-700 flex items-center gap-1.5">
              <span className="text-[10px] font-bold text-slate-400">DEPS VULN</span>
              <span className="font-mono font-bold text-indigo-300">{report.dependencies.length}</span>
            </div>
          </div>

          <div className="flex items-center bg-slate-800/80 p-0.5 rounded-lg border border-slate-700/80">
            <button
              onClick={() => setActiveTab('findings')}
              className={`px-3 py-1 rounded text-xs font-semibold transition-all cursor-pointer ${
                activeTab === 'findings' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-white'
              }`}
            >
              Code & Rule Findings ({report.findings.length})
            </button>
            <button
              onClick={() => setActiveTab('dependencies')}
              className={`px-3 py-1 rounded text-xs font-semibold transition-all cursor-pointer ${
                activeTab === 'dependencies' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-white'
              }`}
            >
              Dependencies ({report.dependencies.length})
            </button>
            <button
              onClick={() => setActiveTab('capabilities')}
              className={`px-3 py-1 rounded text-xs font-semibold transition-all cursor-pointer ${
                activeTab === 'capabilities' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-white'
              }`}
            >
              Auditor Engines
            </button>
          </div>
        </div>
      )}

      {/* 3. FILTER BAR */}
      {activeTab === 'findings' && report && (
        <div className="border-b border-slate-800 bg-slate-900/30 px-4 py-2 flex flex-wrap items-center justify-between gap-2 shrink-0 text-xs">
          <div className="flex items-center gap-1 overflow-x-auto py-0.5">
            {[
              { id: 'all', label: 'All', count: report.findings.length },
              { id: 'dependency', label: 'Dependencies', count: report.categoryCounts.dependency },
              { id: 'secret', label: 'Secrets', count: report.categoryCounts.secret },
              { id: 'shell_injection', label: 'Shell Injection', count: report.categoryCounts.shell_injection },
              { id: 'path_traversal', label: 'Path Traversal', count: report.categoryCounts.path_traversal },
              { id: 'code_injection', label: 'Code Injection & XSS', count: report.categoryCounts.code_injection },
              { id: 'env_config', label: 'Environment', count: report.categoryCounts.env_config },
              { id: 'network_cors', label: 'Network & CORS', count: report.categoryCounts.network_cors },
              { id: 'auth_rbac', label: 'Auth & RBAC', count: report.categoryCounts.auth_rbac },
              { id: 'electron_ipc', label: 'Electron & IPC', count: report.categoryCounts.electron_ipc },
            ].map(cat => (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className={`px-2.5 py-1 rounded text-[11px] font-medium transition-all shrink-0 cursor-pointer ${
                  activeCategory === cat.id
                    ? 'bg-indigo-600/30 text-indigo-300 border border-indigo-500/50'
                    : 'bg-slate-800/60 text-slate-400 hover:text-slate-200 border border-slate-700/40'
                }`}
              >
                <span>{cat.label}</span>
                {cat.count > 0 && (
                  <span className="ml-1.5 px-1 py-0.2 rounded-full text-[9px] font-bold bg-slate-900 text-slate-300">
                    {cat.count}
                  </span>
                )}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-2 top-2 text-slate-500" />
              <input
                type="text"
                placeholder="Search rule, file, snippet..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="bg-slate-800 border border-slate-700 rounded pl-7 pr-2.5 py-1 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 w-44"
              />
            </div>

            <select
              value={severityFilter}
              onChange={e => setSeverityFilter(e.target.value)}
              className="bg-slate-800 border border-slate-700 rounded px-2 py-1 text-xs text-white focus:outline-none focus:border-indigo-500"
            >
              <option value="all">All Severities</option>
              <option value="critical">Critical Only</option>
              <option value="high+">High & Critical</option>
              <option value="medium+">Medium+</option>
            </select>

            <label className="flex items-center gap-1.5 text-[11px] text-slate-400 cursor-pointer">
              <input
                type="checkbox"
                checked={showResolved}
                onChange={e => setShowResolved(e.target.checked)}
                className="rounded border-slate-700 bg-slate-800 text-indigo-600"
              />
              <span>Show Resolved</span>
            </label>
          </div>
        </div>
      )}

      {/* 4. MAIN CONTENT AREA */}
      <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3">
        {loading && (
          <div className="flex flex-col items-center justify-center h-48 gap-3 text-slate-400">
            <RefreshCw className="w-8 h-8 animate-spin text-indigo-400" />
            <span className="text-sm font-semibold">Running multi-layer AST and dependency security audit...</span>
          </div>
        )}

        {!loading && report && activeTab === 'findings' && (
          <SecurityFindingsTab
            report={report}
            filteredFindings={filteredFindings}
            remediatingId={remediatingId}
            verifyingId={verifyingId}
            onOpenFindingFile={openFile}
            onApplyRemediation={handleApplyRemediation}
            onVerifyFinding={handleVerifyFinding}
            onLoadVulnerableFixture={handleLoadVulnerableFixture}
            renderCategoryIcon={getCategoryIcon}
            renderSeverityBadge={getSeverityBadge}
          />
        )}

        {!loading && report && activeTab === 'dependencies' && (
          <SecurityDependenciesTab
            report={report}
            onApplyRemediation={handleApplyRemediation}
            onNotifyAction={setActionNotice}
            renderSeverityBadge={getSeverityBadge}
          />
        )}

        {!loading && report && activeTab === 'capabilities' && (
          <SecurityCapabilitiesTab report={report} />
        )}
      </div>

      {/* 5. APPROVAL MODAL FOR POTENTIALLY BREAKING CHANGES */}
      {pendingApprovalFinding && (
        <SecurityApprovalModal
          finding={pendingApprovalFinding}
          onCancel={() => setPendingApprovalFinding(null)}
          onApprove={f => handleApplyRemediation(f, true)}
        />
      )}
    </div>
  );
};
