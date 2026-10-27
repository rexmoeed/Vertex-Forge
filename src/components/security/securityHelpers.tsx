import React from 'react';
import {
  Shield,
  AlertTriangle,
  Lock,
  Key,
  Terminal,
  FileCode,
  AlertCircle,
  Layers,
  Globe,
  Radio,
} from 'lucide-react';
import { SecuritySeverity, SecurityCategory } from '../../types/securityAudit';

export const getScoreColor = (score: number): string => {
  if (score >= 90) return 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10';
  if (score >= 70) return 'text-amber-400 border-amber-500/30 bg-amber-500/10';
  return 'text-rose-400 border-rose-500/30 bg-rose-500/10';
};

export const getSeverityBadge = (severity: SecuritySeverity): React.ReactElement => {
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

export const getCategoryIcon = (category: SecurityCategory): React.ReactElement => {
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
