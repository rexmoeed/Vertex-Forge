import { logger } from '../../services/logger';
import React, { useState, useEffect, useMemo } from 'react';
import {
  Shield,
  ShieldCheck,
  ShieldAlert,
  AlertTriangle,
  Lock,
  Key,
  Terminal,
  ExternalLink,
  CheckCircle2,
  XCircle,
  RefreshCw,
  Download,
  Filter,
  Search,
  FileCode,
  Check,
  AlertCircle,
  Sparkles,
  ChevronRight,
  Info,
  Layers,
  Globe,
  Radio,
  FileText,
} from 'lucide-react';
import { useIDE } from '../../context/IDEContext';
import {
  SecurityAuditReport,
  SecurityFinding,
  DependencyAuditItem,
  SecuritySeverity,
  SecurityCategory,
} from '../../types/securityAudit';
import { SecurityAuditService } from '../../services/securityAuditService';

export const SecurityAuditorPanel: React.FC = () => {
  const { openFile, activeProject } = useIDE() as any;

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
    } catch (err: any) {
      logger.error('Audit run error:', err);
      setActionNotice({ message: `Audit failed: ${err.message}`, type: 'error' });
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
    } catch (err: any) {
      setActionNotice({ message: `Failed to load fixture: ${err.message}`, type: 'error' });
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
        // Mark finding as locally resolved
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
    } catch (err: any) {
      setActionNotice({ message: `Remediation failed: ${err.message}`, type: 'error' });
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
    } catch (err: any) {
      setActionNotice({ message: `Verification failed: ${err.message}`, type: 'error' });
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

  // Filtered findings list
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

  // Score color helper
  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10';
    if (score >= 70) return 'text-amber-400 border-amber-500/30 bg-amber-500/10';
    return 'text-rose-400 border-rose-500/30 bg-rose-500/10';
  };

  const getSeverityBadge = (severity: SecuritySeverity) => {
    switch (severity) {
      case 'critical':
        return <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase bg-rose-950 text-rose-300 border border-rose-600">CRITICAL</span>;
      case 'high':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-orange-950 text-orange-300 border border-orange-600">HIGH</span>;
      case 'medium':
        return <span className="px-2 py-0.5 rounded text-[10px] font-semibold uppercase bg-amber-950 text-amber-300 border border-amber-600">MEDIUM</span>;
      case 'low':
        return <span className="px-2 py-0.5 rounded text-[10px] font-medium uppercase bg-blue-950 text-blue-300 border border-blue-600">LOW</span>;
      default:
        return <span className="px-2 py-0.5 rounded text-[10px] uppercase bg-slate-800 text-slate-300 border border-slate-700">INFO</span>;
    }
  };

  const getCategoryIcon = (category: SecurityCategory) => {
    switch (category) {
      case 'dependency':
        return <Layers className="w-3.5 h-3.5 text-indigo-400" />;
      case 'secret':
        return <Key className="w-3.5 h-3.5 text-rose-400" />;
      case 'shell_injection':
        return <Terminal className="w-3.5 h-3.5 text-orange-400" />;
      case 'path_traversal':
        return <FileCode className="w-3.5 h-3.5 text-amber-400" />;
      case 'code_injection':
        return <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />;
      case 'env_config':
        return <Lock className="w-3.5 h-3.5 text-cyan-400" />;
      case 'network_cors':
        return <Globe className="w-3.5 h-3.5 text-blue-400" />;
      case 'auth_rbac':
        return <Shield className="w-3.5 h-3.5 text-emerald-400" />;
      case 'electron_ipc':
        return <Radio className="w-3.5 h-3.5 text-purple-400" />;
      default:
        return <AlertCircle className="w-3.5 h-3.5 text-slate-400" />;
    }
  };

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
          {/* Security Score Badge */}
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

          {/* Severity Counters */}
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

          {/* Subview Nav Tabs */}
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
          {/* Category Chips */}
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

          {/* Search & Severity Dropdown */}
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
          <>
            {filteredFindings.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-48 gap-3 text-slate-400 bg-slate-900/40 rounded-xl border border-slate-800/80 p-6 text-center">
                <ShieldCheck className="w-12 h-12 text-emerald-400" />
                <div className="text-sm font-bold text-white">No security findings matching current filters</div>
                <p className="text-xs text-slate-400 max-w-md">
                  {report.findings.length > 0
                    ? 'All findings were filtered out by the active category or severity filter.'
                    : 'The project passed static analysis and dependency audits with zero detected vulnerabilities.'}
                </p>
                <button
                  onClick={handleLoadVulnerableFixture}
                  className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded text-xs font-semibold cursor-pointer"
                >
                  Load Deliberately Vulnerable Fixture to Test All Analyzers
                </button>
              </div>
            ) : (
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
                        <div className="mt-0.5">{getCategoryIcon(finding.category)}</div>
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-bold text-sm text-white">{finding.title}</span>
                            {getSeverityBadge(finding.severity)}
                            <span className="px-1.5 py-0.2 rounded text-[10px] font-mono bg-slate-800 text-slate-400 border border-slate-700">
                              {finding.ruleId}
                            </span>
                            {finding.resolved && (
                              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-950 text-emerald-300 border border-emerald-600 flex items-center gap-1">
                                <Check className="w-3 h-3" /> RESOLVED ({finding.resolvedAt})
                              </span>
                            )}
                          </div>

                          {/* File Location (Clickable to Navigate in IDE Editor) */}
                          <button
                            onClick={() => openFile(finding.filePath)}
                            className="mt-1 text-xs font-mono text-indigo-400 hover:text-indigo-300 flex items-center gap-1 cursor-pointer group"
                            title="Open file at line in editor"
                          >
                            <FileCode className="w-3.5 h-3.5 text-slate-400 group-hover:text-indigo-300" />
                            <span className="underline underline-offset-2">{finding.filePath}:{finding.lineStart}</span>
                            <ChevronRight className="w-3 h-3 text-slate-500 group-hover:translate-x-0.5 transition-transform" />
                          </button>
                        </div>
                      </div>

                      {/* Remediation Action Buttons */}
                      <div className="flex items-center gap-2 shrink-0">
                        {!finding.resolved && (
                          <button
                            onClick={() => handleApplyRemediation(finding)}
                            disabled={remediatingId === finding.id}
                            className="px-2.5 py-1.5 rounded bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-xs font-semibold flex items-center gap-1.5 cursor-pointer shadow"
                          >
                            <Check className="w-3.5 h-3.5" />
                            <span>{remediatingId === finding.id ? 'Applying...' : 'Apply Fix'}</span>
                          </button>
                        )}

                        <button
                          onClick={() => handleVerifyFinding(finding)}
                          disabled={verifyingId === finding.id}
                          className="px-2.5 py-1.5 rounded bg-slate-800 hover:bg-slate-700 border border-slate-700 disabled:opacity-50 text-slate-300 text-xs font-medium flex items-center gap-1.5 cursor-pointer"
                        >
                          <RefreshCw className={`w-3 h-3 ${verifyingId === finding.id ? 'animate-spin' : ''}`} />
                          <span>Verify</span>
                        </button>
                      </div>
                    </div>

                    {/* Strictly Redacted Evidence Code Box */}
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

                    {/* Remediation Details Box */}
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
            )}
          </>
        )}

        {/* SUBVIEW 2: DEPENDENCY AUDITOR TABLE */}
        {!loading && report && activeTab === 'dependencies' && (
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
                        <td className="p-3">{getSeverityBadge(dep.severity)}</td>
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
                                handleApplyRemediation(matchFinding);
                              } else {
                                setActionNotice({
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
        )}

        {/* SUBVIEW 3: AUDITOR ENGINE CAPABILITIES & DISCLAIMERS */}
        {!loading && report && activeTab === 'capabilities' && (
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
        )}
      </div>

      {/* 5. APPROVAL MODAL FOR POTENTIALLY BREAKING CHANGES */}
      {pendingApprovalFinding && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-amber-600/60 rounded-xl max-w-md w-full p-5 flex flex-col gap-4 shadow-2xl">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded bg-amber-500/20 text-amber-400">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">Approval Required: Potentially Breaking Remediation</h3>
                <p className="text-xs text-slate-400 mt-1">{pendingApprovalFinding.title}</p>
              </div>
            </div>

            <div className="bg-slate-950 rounded border border-slate-800 p-3 text-xs flex flex-col gap-2">
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-500">Proposed Action</span>
                <div className="font-semibold text-indigo-300">{pendingApprovalFinding.remediation.title}</div>
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-amber-400">Breaking Risk Warning</span>
                <p className="text-slate-300 mt-0.5 leading-relaxed">
                  {pendingApprovalFinding.remediation.breakingRiskDetails ||
                    'This remediation modifies dependencies or credential references and may require testing or rotation verification.'}
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2">
              <button
                onClick={() => setPendingApprovalFinding(null)}
                className="px-3 py-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={() => handleApplyRemediation(pendingApprovalFinding, true)}
                className="px-4 py-1.5 rounded bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold cursor-pointer shadow"
              >
                Approve & Apply Change
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
