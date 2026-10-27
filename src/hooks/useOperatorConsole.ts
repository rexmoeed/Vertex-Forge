import { useState, useCallback } from 'react';
import { CredentialVaultService } from '../services/credentialVaultService';
import { RulebookEngine } from '../services/rulebookEngine';
import { MultiAiCouncilService } from '../services/multiAiCouncilService';
import { BusinessTrackerService } from '../services/businessTrackerService';
import { ApprovalQueueService } from '../services/approvalQueueService';
import { BackgroundJobScheduler } from '../services/backgroundJobScheduler';
import { ModelRouterService } from '../services/modelRouterService';
import { LocalAiNodeService } from '../services/localAiNodeService';
import { OpsVisibilityService } from '../services/opsVisibilityService';
import { KnowledgeGraphService } from '../services/knowledgeGraphService';
import { SkillSetService } from '../services/skillSetService';
import { VersioningService } from '../services/versioningService';
import { TrackerStatus } from '../types/kos';

export type OperatorConsoleTab =
  | 'approvals'
  | 'rulebook'
  | 'vault'
  | 'council'
  | 'businesses'
  | 'jobs'
  | 'router'
  | 'ops'
  | 'skills';

export function useOperatorConsole() {
  const [activeTab, setActiveTab] = useState<OperatorConsoleTab>('approvals');

  // State slices
  const [approvals, setApprovals] = useState(() => ApprovalQueueService.listAll());
  const [rules, setRules] = useState(() => RulebookEngine.listRules());
  const [violations, setViolations] = useState(() => RulebookEngine.listViolations());
  const [secrets, setSecrets] = useState(() => CredentialVaultService.listSecrets());
  const [councilSessions, setCouncilSessions] = useState(() => MultiAiCouncilService.listSessions());
  const [businesses, setBusinesses] = useState(() => BusinessTrackerService.listBusinesses());
  const [activeBiz, setActiveBiz] = useState(() => BusinessTrackerService.getActiveBusiness());
  const [trackerItems, setTrackerItems] = useState(() => BusinessTrackerService.listTrackerItems());
  const [jobs, setJobs] = useState(() => BackgroundJobScheduler.listJobs());
  const [routes, setRoutes] = useState(() => ModelRouterService.listRoutes());
  const [nodes, setNodes] = useState(() => LocalAiNodeService.listNodes());
  const [opsSnapshot, setOpsSnapshot] = useState(() => OpsVisibilityService.getRealtimeSnapshot());
  const [auditTrail, setAuditTrail] = useState(() => OpsVisibilityService.getUnifiedAuditTrail());
  const [skills, setSkills] = useState(() => SkillSetService.listSkills());
  const [graph, setGraph] = useState(() => KnowledgeGraphService.getGraph());
  const [version, setVersion] = useState(() => VersioningService.getCurrentVersion());

  // Modals & sub-state
  const [isConveningCouncil, setIsConveningCouncil] = useState(false);
  const [councilTopic, setCouncilTopic] = useState('');
  const [newSecretName, setNewSecretName] = useState('');
  const [newSecretVal, setNewSecretVal] = useState('');
  const [newSecretType, setNewSecretType] = useState<'api_key' | 'token' | 'db_credential'>('api_key');
  const [newRuleDesc, setNewRuleDesc] = useState('');
  const [newRulePattern, setNewRulePattern] = useState('');
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const showToast = useCallback((msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3000);
  }, []);

  const handleResolveApproval = useCallback((id: string, decision: 'approved' | 'rejected') => {
    ApprovalQueueService.resolveItem(id, decision);
    setApprovals(ApprovalQueueService.listAll());
    setOpsSnapshot(OpsVisibilityService.getRealtimeSnapshot());
    setAuditTrail(OpsVisibilityService.getUnifiedAuditTrail());
    showToast(`Decision recorded: ${decision.toUpperCase()}`);
  }, [showToast]);

  const handleConveneCouncil = useCallback(async () => {
    if (!councilTopic.trim()) return;
    setIsConveningCouncil(true);
    try {
      await MultiAiCouncilService.conveneCouncil(councilTopic, undefined, 'vote');
      setCouncilSessions(MultiAiCouncilService.listSessions());
      setCouncilTopic('');
      showToast('Multi-AI Council session concluded with verdict.');
    } finally {
      setIsConveningCouncil(false);
    }
  }, [councilTopic, showToast]);

  const handleAddSecret = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    if (!newSecretName.trim() || !newSecretVal.trim()) return;
    CredentialVaultService.addSecret(newSecretName, newSecretVal, newSecretType, 'ask_once_per_session', activeBiz.id);
    setSecrets(CredentialVaultService.listSecrets());
    setNewSecretName('');
    setNewSecretVal('');
    setAuditTrail(OpsVisibilityService.getUnifiedAuditTrail());
    showToast(`Saved secret "${newSecretName}" to encrypted vault.`);
  }, [newSecretName, newSecretVal, newSecretType, activeBiz.id, showToast]);

  const handleToggleRule = useCallback((id: string, enabled: boolean) => {
    RulebookEngine.toggleRule(id, enabled);
    setRules(RulebookEngine.listRules());
    showToast(`Rule ${enabled ? 'enabled' : 'disabled'}`);
  }, [showToast]);

  const handleTriggerJob = useCallback(async (id: string) => {
    const res = await BackgroundJobScheduler.triggerJob(id);
    setJobs(BackgroundJobScheduler.listJobs());
    showToast(`Job finished: ${res.output}`);
  }, [showToast]);

  const handleSwitchBusiness = useCallback((id: string) => {
    BusinessTrackerService.setActiveBusiness(id);
    const b = BusinessTrackerService.getActiveBusiness();
    setActiveBiz(b);
    setTrackerItems(BusinessTrackerService.listTrackerItems(id));
    showToast(`Switched context to "${b.name}"`);
  }, [showToast]);

  const handleMoveTask = useCallback((id: string, status: TrackerStatus) => {
    BusinessTrackerService.moveTrackerItem(id, status);
    setTrackerItems(BusinessTrackerService.listTrackerItems(activeBiz.id));
  }, [activeBiz.id]);

  return {
    activeTab,
    setActiveTab,
    approvals,
    rules,
    violations,
    secrets,
    councilSessions,
    businesses,
    activeBiz,
    trackerItems,
    jobs,
    routes,
    nodes,
    opsSnapshot,
    auditTrail,
    skills,
    graph,
    version,
    isConveningCouncil,
    councilTopic,
    setCouncilTopic,
    newSecretName,
    setNewSecretName,
    newSecretVal,
    setNewSecretVal,
    newSecretType,
    setNewSecretType,
    newRuleDesc,
    setNewRuleDesc,
    newRulePattern,
    setNewRulePattern,
    toastMsg,
    showToast,
    handleResolveApproval,
    handleConveneCouncil,
    handleAddSecret,
    handleToggleRule,
    handleTriggerJob,
    handleSwitchBusiness,
    handleMoveTask,
  };
}
