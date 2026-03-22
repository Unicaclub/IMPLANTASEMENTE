import { AgentType, RunStatus, RunType } from '../../../common/enums';

/**
 * Defines which agents participate in each run type
 * and in what order they execute.
 */
export interface AgentPipelineStep {
  agentType: AgentType;
  stepName: string;
  stepType: string;
  required: boolean;
}

/**
 * Pipeline configuration per run type
 */
export const RUN_PIPELINES: Record<RunType, AgentPipelineStep[]> = {
  [RunType.DISCOVERY]: [
    {
      agentType: AgentType.ORCHESTRATOR,
      stepName: 'Initialize discovery',
      stepType: 'orchestration',
      required: true,
    },
    {
      agentType: AgentType.ARCHITECT,
      stepName: 'Map architecture and modules',
      stepType: 'analysis',
      required: true,
    },
    {
      agentType: AgentType.SCHEMA_MAPPER,
      stepName: 'Map database schemas',
      stepType: 'analysis',
      required: true,
    },
    {
      agentType: AgentType.API_ANALYZER,
      stepName: 'Map APIs and services',
      stepType: 'analysis',
      required: true,
    },
    {
      agentType: AgentType.UI_INSPECTOR,
      stepName: 'Map UI screens and routes',
      stepType: 'analysis',
      required: true,
    },
    {
      agentType: AgentType.EVIDENCE_COLLECTOR,
      stepName: 'Collect technical evidence',
      stepType: 'analysis',
      required: false,
    },
    {
      agentType: AgentType.REPORT_GENERATOR,
      stepName: 'Generate discovery report',
      stepType: 'documentation',
      required: true,
    },
    {
      agentType: AgentType.ORCHESTRATOR,
      stepName: 'Finalize discovery',
      stepType: 'orchestration',
      required: true,
    },
  ],

  [RunType.COMPARISON]: [
    {
      agentType: AgentType.ORCHESTRATOR,
      stepName: 'Initialize comparison',
      stepType: 'orchestration',
      required: true,
    },
    {
      agentType: AgentType.COMPARATOR,
      stepName: 'Cross-reference sources',
      stepType: 'validation',
      required: true,
    },
    {
      agentType: AgentType.REPORT_GENERATOR,
      stepName: 'Generate comparison report',
      stepType: 'documentation',
      required: true,
    },
    {
      agentType: AgentType.ORCHESTRATOR,
      stepName: 'Finalize comparison',
      stepType: 'orchestration',
      required: true,
    },
  ],

  [RunType.AUDIT]: [
    {
      agentType: AgentType.ORCHESTRATOR,
      stepName: 'Initialize audit',
      stepType: 'orchestration',
      required: true,
    },
    {
      agentType: AgentType.CODE_AUDITOR,
      stepName: 'Validate registries',
      stepType: 'validation',
      required: true,
    },
    {
      agentType: AgentType.EVIDENCE_COLLECTOR,
      stepName: 'Collect audit evidence',
      stepType: 'validation',
      required: true,
    },
    {
      agentType: AgentType.REPORT_GENERATOR,
      stepName: 'Generate audit report',
      stepType: 'documentation',
      required: true,
    },
    {
      agentType: AgentType.ORCHESTRATOR,
      stepName: 'Finalize audit',
      stepType: 'orchestration',
      required: true,
    },
  ],

  [RunType.BACKLOG_GENERATION]: [
    {
      agentType: AgentType.ORCHESTRATOR,
      stepName: 'Initialize backlog generation',
      stepType: 'orchestration',
      required: true,
    },
    {
      agentType: AgentType.CODE_AUDITOR,
      stepName: 'Identify gaps and issues',
      stepType: 'validation',
      required: true,
    },
    {
      agentType: AgentType.EVIDENCE_COLLECTOR,
      stepName: 'Collect gap evidence',
      stepType: 'validation',
      required: false,
    },
    {
      agentType: AgentType.REPORT_GENERATOR,
      stepName: 'Generate backlog items',
      stepType: 'generation',
      required: true,
    },
    {
      agentType: AgentType.ORCHESTRATOR,
      stepName: 'Finalize backlog generation',
      stepType: 'orchestration',
      required: true,
    },
  ],
};

/**
 * Result of a single agent step execution
 */
export interface AgentStepResult {
  agentRunId: string;
  success: boolean;
  outputSummary: string | null;
  error?: string;
}

/**
 * Result of a full pipeline execution
 */
export interface PipelineExecutionResult {
  runId: string;
  status: RunStatus;
  stepsCompleted: number;
  stepsTotal: number;
  stepResults: AgentStepResult[];
  startedAt: Date;
  finishedAt: Date | null;
  error?: string;
}

/**
 * Event emitted during orchestration
 */
export interface OrchestrationEvent {
  runId: string;
  stepOrder: number;
  agentType: AgentType;
  event:
    | 'step_started'
    | 'step_completed'
    | 'step_failed'
    | 'step_skipped'
    | 'run_completed'
    | 'run_failed';
  message: string;
  timestamp: Date;
}
