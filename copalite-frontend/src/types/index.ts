// ============================================
// COPALITE FRONTEND — Types
// ============================================

// Auth
export interface LoginRequest { email: string; password: string; }
export interface LoginResponse { accessToken: string; user: { id: string; email: string; fullName: string; }; }
export interface User { id: string; fullName: string; email: string; status: string; lastLoginAt: string | null; createdAt: string; }

// Workspace
export interface Workspace { id: string; name: string; slug: string; description: string | null; status: string; ownerUserId: string; createdAt: string; }
export interface WorkspaceMember { id: string; workspaceId: string; userId: string; memberRole: string; status: string; user?: User; joinedAt: string; }

// Project
export interface Project { id: string; workspaceId: string; name: string; slug: string; description: string | null; domainType: string | null; projectType: string; status: string; createdAt: string; }

// Source
export interface Source { id: string; projectId: string; name: string; sourceType: string; location: string; status: string; authMode: string; createdAt: string; }

// Run
export interface Run { id: string; projectId: string; sourceId: string | null; runType: string; title: string; goal: string; scopeText: string | null; status: string; startedAt: string | null; finishedAt: string | null; createdAt: string; }
export interface RunStep { id: string; runId: string; stepOrder: number; stepName: string; stepType: string; status: string; startedAt: string | null; finishedAt: string | null; notes: string | null; }

// Agent
export interface Agent { id: string; name: string; slug: string; agentType: string; description: string | null; status: string; executionOrder: number | null; }

// Backlog
export interface BacklogItem { id: string; projectId: string; title: string; description: string; backlogType: string; priority: string; status: string; evidenceCount: number; approvedForTask: boolean; approvedAt: string | null; createdAt: string; }

// Task
export interface Task { id: string; projectId: string; backlogItemId: string | null; title: string; description: string; taskType: string; status: string; assignedUserId: string | null; dueAt: string | null; createdAt: string; }

// Evidence
export interface Evidence { id: string; projectId: string; runId: string; evidenceType: string; title: string; contentExcerpt: string; referencePath: string | null; relatedEntityType: string; relatedEntityId: string; confidenceStatus: string; createdAt: string; }

// Dashboard
export interface ProjectDashboard {
  project: { id: string; name: string; slug: string; status: string; projectType: string; };
  sources: { total: number; };
  runs: { total: number; completed: number; running: number; failed: number; recent: Run[]; };
  registries: { modules: number; routes: number; apis: number; schemas: number; uiScreens: number; totalDiscovered: number; };
  evidence: { total: number; };
  backlog: { total: number; open: number; approved: number; };
  tasks: { total: number; done: number; inProgress: number; };
}

// Pipeline
export interface PipelineStatus {
  run: Run;
  steps: (RunStep & { agentRuns?: any[] })[];
  progress: { completed: number; total: number; percentage: number; };
  currentStep: RunStep | null;
}

// Enums
export const RUN_TYPES = ['discovery', 'comparison', 'audit', 'backlog_generation'] as const;
export const RUN_STATUSES = ['pending', 'running', 'completed', 'failed', 'cancelled', 'blocked'] as const;
export const BACKLOG_TYPES = ['bug', 'gap', 'improvement', 'documentation', 'refactor', 'validation'] as const;
export const PRIORITIES = ['low', 'medium', 'high', 'critical'] as const;
export const TASK_STATUSES = ['pending', 'approved', 'in_progress', 'blocked', 'done', 'cancelled'] as const;

// Agent Execution (integration prep)
export const AGENT_TYPES = [
  'orchestrator', 'architect', 'database_builder', 'backend_builder',
  'frontend_builder', 'validator', 'doc_writer', 'devops_agent', 'qa_test_agent',
] as const;
export type AgentType = (typeof AGENT_TYPES)[number];

export interface AgentRun {
  id: string;
  agentId: string;
  runStepId: string;
  status: string;
  inputPayload: Record<string, unknown> | null;
  outputPayload: Record<string, unknown> | null;
  tokenUsage: number | null;
  startedAt: string | null;
  finishedAt: string | null;
  errorMessage: string | null;
}

export interface AgentOutput {
  id: string;
  agentRunId: string;
  outputType: string;
  filePath: string | null;
  content: string | null;
  createdAt: string;
}

export interface AgentExecutionHook {
  beforeRun?: (agent: Agent, context: AgentRunContext) => Promise<void>;
  afterRun?: (agent: Agent, result: AgentRun) => Promise<void>;
  onError?: (agent: Agent, error: Error) => Promise<void>;
}

export interface AgentRunContext {
  runId: string;
  stepId: string;
  projectId: string;
  parameters: Record<string, unknown>;
}
