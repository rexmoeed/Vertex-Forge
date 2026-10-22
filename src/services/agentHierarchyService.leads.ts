import {
  TeamLeadRole,
  SpecialistLeadInfo,
  AgentMessage,
} from '../types/agentHierarchy';

export class AgentLeadsManager {
  private leads: Map<TeamLeadRole, SpecialistLeadInfo> = new Map();
  private messageLog: AgentMessage[] = [];
  private notifyCallback?: () => void;

  constructor(notifyCallback?: () => void) {
    this.notifyCallback = notifyCallback;
    this.initTeamLeads();
  }

  public setNotifyCallback(cb: () => void) {
    this.notifyCallback = cb;
  }

  private notify() {
    if (this.notifyCallback) this.notifyCallback();
  }

  private initTeamLeads() {
    const leadsConfig: SpecialistLeadInfo[] = [
      {
        role: 'ProductDesignLead',
        title: 'Principal Product Designer',
        shortName: 'Product Design',
        icon: '🎯',
        description: 'Transforms requirements into user journeys, product briefs, and acceptance criteria.',
        status: 'idle',
        assignedSubAgents: ['RequirementsAnalyst', 'UserJourneyMapper', 'FeatureScopeAnalyst', 'AcceptanceCriteriaWriter'],
        qualityGatesPassed: 12,
        activeReservations: [],
      },
      {
        role: 'UIDesignLead',
        title: 'World-Class UI Designer',
        shortName: 'UI/UX Design',
        icon: '🎨',
        description: 'Enforces visual hierarchy, typography, tokens, and component specifications.',
        status: 'idle',
        assignedSubAgents: ['WireframeDesigner', 'VisualDesignAssistant', 'DesignTokenSpecialist', 'AccessibilityReviewer', 'DocSyncAgent'],
        qualityGatesPassed: 15,
        activeReservations: [],
      },
      {
        role: 'FrontendLead',
        title: 'Principal Frontend Engineer',
        shortName: 'Frontend Lead',
        icon: '⚛️',
        description: 'Builds reusable, accessible React 19 components and state management.',
        status: 'idle',
        assignedSubAgents: ['ReactComponentBuilder', 'CSSLayoutSpecialist', 'StateManagementAssistant', 'FormsValidationSpecialist'],
        qualityGatesPassed: 24,
        activeReservations: [],
      },
      {
        role: 'BackendLead',
        title: 'Principal Backend Engineer',
        shortName: 'Backend Lead',
        icon: '⚙️',
        description: 'Architects APIs, database schemas, validation, and authentication rules.',
        status: 'idle',
        assignedSubAgents: ['APIEndpointBuilder', 'DatabaseSchemaSpecialist', 'AuthenticationSpecialist', 'BusinessLogicImplementer'],
        qualityGatesPassed: 18,
        activeReservations: [],
      },
      {
        role: 'FullStackLead',
        title: 'Principal Full-Stack Engineer',
        shortName: 'Full-Stack Lead',
        icon: '🌐',
        description: 'Aligns frontend and backend contracts, traces data flow, and end-to-end workflows.',
        status: 'idle',
        assignedSubAgents: ['APIIntegrationAssistant', 'DataFlowTracer', 'EndToEndWorkflowSpecialist', 'PatchSynthesizer'],
        qualityGatesPassed: 14,
        activeReservations: [],
      },
      {
        role: 'ArchitectureLead',
        title: 'Software Architect',
        shortName: 'Architecture Lead',
        icon: '🏛️',
        description: 'Defines module boundaries, analyzes dependencies, and technical risk.',
        status: 'idle',
        assignedSubAgents: ['DependencyMapper', 'ModuleBoundaryReviewer', 'TechnicalDebtAnalyst', 'TypeLintSentry'],
        qualityGatesPassed: 16,
        activeReservations: [],
      },
      {
        role: 'QALead',
        title: 'QA & Test Engineer Lead',
        shortName: 'QA & Testing',
        icon: '🧪',
        description: 'Generates assertion test suites, reproduces bugs, and verifies execution.',
        status: 'idle',
        assignedSubAgents: ['UnitTestWriter', 'IntegrationTestWriter', 'BugReproductionAssistant', 'PerfLeakWatcher', 'TestRunnerDiagnostician'],
        qualityGatesPassed: 21,
        activeReservations: [],
      },
      {
        role: 'SecurityLead',
        title: 'Principal Security Engineer',
        shortName: 'Security Lead',
        icon: '🛡️',
        description: 'Audits AST vulnerabilities, auth validation, secret leaks, and dependencies.',
        status: 'idle',
        assignedSubAgents: ['DependencySecurityReviewer', 'AuthReviewer', 'InputValidationReviewer', 'SecretLeakSniffer'],
        qualityGatesPassed: 19,
        activeReservations: [],
      },
      {
        role: 'DevOpsLead',
        title: 'DevOps & Tooling Lead',
        shortName: 'DevOps Lead',
        icon: '🚀',
        description: 'Configures build pipelines, packages, linting, and development environments.',
        status: 'idle',
        assignedSubAgents: ['BuildConfigurationAssistant', 'DeploymentAssistant', 'EnvSyncAgent'],
        qualityGatesPassed: 8,
        activeReservations: [],
      },
      {
        role: 'ResearchLead',
        title: 'Codebase Research Lead',
        shortName: 'Research Lead',
        icon: '🔍',
        description: 'Symbol searches, import tracer, and context retrieval across the repository.',
        status: 'idle',
        assignedSubAgents: ['SymbolSearchAgent', 'DependencyTracer'],
        qualityGatesPassed: 11,
        activeReservations: [],
      },
    ];

    leadsConfig.forEach(lead => this.leads.set(lead.role, lead));
  }

  public getLeads(): SpecialistLeadInfo[] {
    return Array.from(this.leads.values());
  }


  public getLeadsMap(): Map<TeamLeadRole, SpecialistLeadInfo> {
    return this.leads;
  }

  public getLead(role: TeamLeadRole): SpecialistLeadInfo | undefined {
    return this.leads.get(role);
  }

  public updateLeadStatus(role: TeamLeadRole, status: SpecialistLeadInfo['status']) {
    const lead = this.leads.get(role);
    if (lead) {
      lead.status = status;
      this.notify();
    }
  }

  public incrementGatesPassed(role: TeamLeadRole) {
    const lead = this.leads.get(role);
    if (lead) {
      lead.qualityGatesPassed += 1;
      this.notify();
    }
  }

  public addMessage(msg: AgentMessage) {
    this.messageLog.push(msg);
    this.notify();
  }

  public getMessages(): AgentMessage[] {
    return [...this.messageLog];
  }
}
