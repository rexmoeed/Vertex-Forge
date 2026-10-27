import React from 'react';
import {
  Cloud,
  CheckCircle2,
  AlertCircle,
  Clock,
  Play,
  Sparkles,
  Shield,
  X,
  Terminal,
} from 'lucide-react';
import { useJulesCloudMission } from '../../hooks/useJulesCloudMission';
import { JulesMissionCreateTab } from './jules/JulesMissionCreateTab';
import { JulesMissionMonitorTab } from './jules/JulesMissionMonitorTab';
import { JulesMissionHistoryTab } from './jules/JulesMissionHistoryTab';

interface JulesCloudMissionModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialPrompt?: string;
}

export const JulesCloudMissionModal: React.FC<JulesCloudMissionModalProps> = ({
  isOpen,
  onClose,
  initialPrompt = '',
}) => {
  const {
    activeTab,
    setActiveTab,
    sources,
    selectedSource,
    setSelectedSource,
    selectedBranch,
    setSelectedBranch,
    missionPrompt,
    setMissionPrompt,
    missionTitle,
    setMissionTitle,
    requireApproval,
    setRequireApproval,
    isLoading,
    error,
    copiedPr,
    currentSession,
    setCurrentSession,
    activities,
    historySessions,
    isApproving,
    QUICK_TEMPLATES,
    handleLaunchMission,
    handleApprovePlan,
    copyToClipboard,
  } = useJulesCloudMission({ isOpen, initialPrompt });

  if (!isOpen) return null;

  const getStatusBadge = (state?: string) => {
    switch (state) {
      case 'PLANNING':
      case 'INITIALIZING':
        return (
          <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/30">
            <Clock className="w-3.5 h-3.5 animate-spin" /> Planning Cloud Mission
          </span>
        );
      case 'AWAITING_PLAN_APPROVAL':
        return (
          <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 animate-pulse">
            <Sparkles className="w-3.5 h-3.5 text-indigo-400" /> Awaiting Plan Approval
          </span>
        );
      case 'EXECUTING':
        return (
          <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-cyan-500/15 text-cyan-300 border border-cyan-500/30">
            <Play className="w-3.5 h-3.5 animate-pulse text-cyan-400" /> Executing & Generating PR
          </span>
        );
      case 'COMPLETED':
        return (
          <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
            <CheckCircle2 className="w-3.5 h-3.5" /> Pull Request Created
          </span>
        );
      case 'FAILED':
        return (
          <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-500/15 text-rose-400 border border-rose-500/30">
            <AlertCircle className="w-3.5 h-3.5" /> Mission Failed
          </span>
        );
      default:
        return (
          <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-800 text-slate-300 border border-slate-700">
            Ready
          </span>
        );
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-fadeIn">
      <div
        style={{ backgroundColor: 'var(--ide-surface)', borderColor: 'var(--ide-border)' }}
        className="w-full max-w-4xl max-h-[90vh] flex flex-col rounded-2xl border shadow-2xl overflow-hidden"
      >
        {/* Header */}
        <div
          style={{ backgroundColor: 'var(--ide-surface-elevated)', borderColor: 'var(--ide-border)' }}
          className="px-6 py-4 border-b flex items-center justify-between shrink-0"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-purple-600 to-pink-500 flex items-center justify-center shadow-lg shadow-indigo-500/20">
              <Cloud className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-white tracking-wide">Google Jules</h2>
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-gradient-to-r from-indigo-500/30 to-purple-500/30 text-indigo-300 border border-indigo-500/40">
                  Autonomous Cloud PR Agent
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Delegate background refactoring, bug fixes, and testing to Google's cloud coding engine.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {currentSession && getStatusBadge(currentSession.state)}
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div
          style={{ backgroundColor: 'var(--ide-bg)', borderColor: 'var(--ide-border)' }}
          className="px-6 py-2 border-b flex items-center justify-between text-xs shrink-0"
        >
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab('create')}
              className={`px-3.5 py-1.5 rounded-lg font-medium transition-all flex items-center gap-2 cursor-pointer ${
                activeTab === 'create'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" /> Launch Mission
            </button>
            <button
              onClick={() => setActiveTab('monitor')}
              className={`px-3.5 py-1.5 rounded-lg font-medium transition-all flex items-center gap-2 cursor-pointer ${
                activeTab === 'monitor'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <Terminal className="w-3.5 h-3.5" /> Active Session
              {currentSession && <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />}
            </button>
            <button
              onClick={() => setActiveTab('history')}
              className={`px-3.5 py-1.5 rounded-lg font-medium transition-all flex items-center gap-2 cursor-pointer ${
                activeTab === 'history'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <Clock className="w-3.5 h-3.5" /> Session History ({historySessions.length})
            </button>
          </div>

          <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
            <Shield className="w-3.5 h-3.5 text-emerald-400" />
            <span>Encrypted Cloud VM Sandbox</span>
          </div>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {error && (
            <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2.5">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
              <span>{error}</span>
            </div>
          )}

          {activeTab === 'create' && (
            <JulesMissionCreateTab
              sources={sources}
              selectedSource={selectedSource}
              setSelectedSource={setSelectedSource}
              selectedBranch={selectedBranch}
              setSelectedBranch={setSelectedBranch}
              missionTitle={missionTitle}
              setMissionTitle={setMissionTitle}
              missionPrompt={missionPrompt}
              setMissionPrompt={setMissionPrompt}
              requireApproval={requireApproval}
              setRequireApproval={setRequireApproval}
              isLoading={isLoading}
              quickTemplates={QUICK_TEMPLATES}
              onSubmit={handleLaunchMission}
              onClose={onClose}
            />
          )}

          {activeTab === 'monitor' && (
            <JulesMissionMonitorTab
              currentSession={currentSession}
              activities={activities}
              copiedPr={copiedPr}
              isApproving={isApproving}
              onApprovePlan={handleApprovePlan}
              onCopyToClipboard={copyToClipboard}
              onSwitchToCreate={() => setActiveTab('create')}
              renderStatusBadge={getStatusBadge}
            />
          )}

          {activeTab === 'history' && (
            <JulesMissionHistoryTab
              historySessions={historySessions}
              onSelectSession={sess => {
                setCurrentSession(sess);
                setActiveTab('monitor');
              }}
              renderStatusBadge={getStatusBadge}
            />
          )}
        </div>
      </div>
    </div>
  );
};
