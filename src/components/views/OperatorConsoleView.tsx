import React from 'react';
import {
  ShieldCheck,
  Key,
  Users,
  Briefcase,
  Activity,
  Cpu,
  Clock,
  BookOpen,
  CheckCircle2,
  Radio,
} from 'lucide-react';
import { useOperatorConsole } from '../../hooks/useOperatorConsole';
import { OperatorApprovalsTab } from './operator/OperatorApprovalsTab';
import { OperatorRulebookTab } from './operator/OperatorRulebookTab';
import { OperatorVaultTab } from './operator/OperatorVaultTab';
import { OperatorCouncilTab } from './operator/OperatorCouncilTab';
import { OperatorBusinessTab } from './operator/OperatorBusinessTab';
import { OperatorJobsTab } from './operator/OperatorJobsTab';
import { OperatorRouterTab } from './operator/OperatorRouterTab';
import { OperatorOpsTab } from './operator/OperatorOpsTab';
import { OperatorSkillsTab } from './operator/OperatorSkillsTab';
import { CredentialVaultService } from '../../services/credentialVaultService';
import { LocalAiNodeService } from '../../services/localAiNodeService';
import { BackgroundJobScheduler } from '../../services/backgroundJobScheduler';
import { KnowledgeGraphService } from '../../services/knowledgeGraphService';

export const OperatorConsoleView: React.FC<{ onClose?: () => void }> = () => {
  const op = useOperatorConsole();

  return (
    <div className="flex-1 bg-slate-950 flex flex-col text-slate-100 select-none overflow-hidden h-full">
      {/* 1. Header Bar */}
      <div className="h-14 border-b border-slate-800 bg-slate-900/90 px-6 flex items-center justify-between shrink-0 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-600 via-teal-500 to-cyan-400 flex items-center justify-center text-slate-950 font-black shadow-md shadow-emerald-500/20">
            <ShieldCheck className="w-5 h-5 text-black" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-sm font-bold text-white tracking-wide">Operator Console</h1>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-bold">
                KOS PARITY ACTIVE
              </span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-400">
                v{op.version}
              </span>
            </div>
            <p className="text-[11px] text-slate-400">
              Zero-Trust AI Governance: Vault, Hard Rulebook Gates, Council Deliberation & Ops Control
            </p>
          </div>
        </div>

        {/* Business Selector Pill */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-400">Business Scope:</span>
          <select
            value={op.activeBiz.id}
            onChange={e => op.handleSwitchBusiness(e.target.value)}
            className="bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1 text-xs text-white focus:outline-none focus:border-indigo-500 font-medium"
          >
            {op.businesses.map(b => (
              <option key={b.id} value={b.id}>
                {b.name} (${b.spentBudgetUsd.toFixed(1)} / ${b.monthlyBudgetUsd})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* 2. Horizontal Navigation Tabs */}
      <div className="h-11 border-b border-slate-800 bg-slate-900/50 px-6 flex items-center gap-1 shrink-0 overflow-x-auto">
        {[
          { id: 'approvals', label: 'Owner Approvals', icon: CheckCircle2, badge: op.approvals.filter(a => a.status === 'pending').length },
          { id: 'rulebook', label: 'Rulebook & Gates', icon: BookOpen, badge: op.violations.length },
          { id: 'vault', label: 'Credential Vault', icon: Key, badge: op.secrets.length },
          { id: 'council', label: 'Multi-AI Council', icon: Users, badge: op.councilSessions.length },
          { id: 'businesses', label: 'Business Trackers', icon: Briefcase, badge: op.trackerItems.length },
          { id: 'jobs', label: 'Background Jobs', icon: Clock, badge: op.jobs.filter(j => j.enabled).length },
          { id: 'router', label: 'Model Router & LAN', icon: Radio, badge: op.nodes.filter(n => n.status === 'online').length },
          { id: 'ops', label: 'Ops Visibility & Audit', icon: Activity, badge: op.auditTrail.length },
          { id: 'skills', label: 'Skills & Knowledge', icon: Cpu, badge: op.skills.length },
        ].map(tab => {
          const Icon = tab.icon;
          const isActive = op.activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => op.setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition cursor-pointer shrink-0 ${
                isActive
                  ? 'bg-indigo-600/20 text-indigo-300 border border-indigo-500/40 shadow-xs'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
              {typeof tab.badge === 'number' && tab.badge > 0 && (
                <span
                  className={`text-[9px] font-mono px-1.5 py-0.2 rounded-full ${
                    tab.id === 'approvals' && tab.badge > 0
                      ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                      : 'bg-slate-800 text-slate-300'
                  }`}
                >
                  {tab.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* 3. Main Body */}
      <div className="flex-1 p-6 overflow-y-auto">
        {op.activeTab === 'approvals' && (
          <OperatorApprovalsTab approvals={op.approvals} onResolveApproval={op.handleResolveApproval} />
        )}

        {op.activeTab === 'rulebook' && (
          <OperatorRulebookTab rules={op.rules} violations={op.violations} onToggleRule={op.handleToggleRule} />
        )}

        {op.activeTab === 'vault' && (
          <OperatorVaultTab
            secrets={op.secrets}
            newSecretName={op.newSecretName}
            setNewSecretName={op.setNewSecretName}
            newSecretVal={op.newSecretVal}
            setNewSecretVal={op.setNewSecretVal}
            newSecretType={op.newSecretType}
            setNewSecretType={op.setNewSecretType}
            onAddSecret={op.handleAddSecret}
            onDeleteSecret={(id, name) => {
              CredentialVaultService.deleteSecret(id);
              op.showToast(`Deleted secret ${name}`);
            }}
          />
        )}

        {op.activeTab === 'council' && (
          <OperatorCouncilTab
            councilSessions={op.councilSessions}
            councilTopic={op.councilTopic}
            setCouncilTopic={op.setCouncilTopic}
            isConveningCouncil={op.isConveningCouncil}
            onConveneCouncil={op.handleConveneCouncil}
          />
        )}

        {op.activeTab === 'businesses' && (
          <OperatorBusinessTab
            activeBiz={op.activeBiz}
            trackerItems={op.trackerItems}
            onMoveTask={op.handleMoveTask}
          />
        )}

        {op.activeTab === 'jobs' && (
          <OperatorJobsTab
            jobs={op.jobs}
            onTriggerJob={op.handleTriggerJob}
            onResetCircuitBreaker={id => {
              BackgroundJobScheduler.resetCircuitBreaker(id);
            }}
          />
        )}

        {op.activeTab === 'router' && (
          <OperatorRouterTab
            nodes={op.nodes}
            routes={op.routes}
            onPingNode={async (id, name) => {
              await LocalAiNodeService.pingNode(id);
              op.showToast(`Checked node ${name}`);
            }}
          />
        )}

        {op.activeTab === 'ops' && (
          <OperatorOpsTab opsSnapshot={op.opsSnapshot} auditTrail={op.auditTrail} />
        )}

        {op.activeTab === 'skills' && (
          <OperatorSkillsTab
            graph={op.graph}
            skills={op.skills}
            onSyncGraph={() => {
              KnowledgeGraphService.rebuildGraph([
                'src/App.tsx',
                'src/context/IDEContext.tsx',
                'src/services/aiProviderService.ts',
                'src/services/credentialVaultService.ts',
                'src/services/rulebookEngine.ts',
                'server.ts',
              ]);
              op.showToast('Rebuilt codebase knowledge graph.');
            }}
          />
        )}
      </div>

      {/* Toast */}
      {op.toastMsg && (
        <div className="fixed bottom-10 right-6 px-3.5 py-2 bg-indigo-600 text-white text-xs font-bold rounded-xl shadow-xl animate-in fade-in slide-in-from-bottom-2 duration-150 z-50">
          {op.toastMsg}
        </div>
      )}
    </div>
  );
};
