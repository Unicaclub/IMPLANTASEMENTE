import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';

import { AgentOutputEntity } from '../agent-outputs/entities/agent-output.entity';
import { AgentRunEntity } from '../agent-runs/entities/agent-run.entity';
import { AgentEntity } from '../agents/entities/agent.entity';
import { LogEntity } from '../logs/entities/log.entity';
import { RunStepEntity } from '../runs/entities/run-step.entity';
import { RunEntity } from '../runs/entities/run.entity';

import {
  AgentType,
  ConfidenceStatus,
  LogLevel,
  OutputType,
  RunStatus,
  ValidationStatus,
} from '../../common/enums';
import { LlmProviderFactory } from './llm-provider.factory';
import { OutputParserService } from './output-parser.service';
import { PromptBuilderService } from './prompt-builder.service';
import { PopulationContext, RegistryPopulationService } from './registry-population.service';
import { SourceIngestionService } from './source-ingestion.service';

@Injectable()
export class AgentExecutionService {
  private readonly logger = new Logger(AgentExecutionService.name);

  constructor(
    @InjectRepository(AgentEntity)
    private readonly agentRepo: Repository<AgentEntity>,
    @InjectRepository(AgentRunEntity)
    private readonly agentRunRepo: Repository<AgentRunEntity>,
    @InjectRepository(AgentOutputEntity)
    private readonly agentOutputRepo: Repository<AgentOutputEntity>,
    @InjectRepository(LogEntity)
    private readonly logRepo: Repository<LogEntity>,
    @InjectRepository(RunEntity)
    private readonly runRepo: Repository<RunEntity>,
    @InjectRepository(RunStepEntity)
    private readonly stepRepo: Repository<RunStepEntity>,
    private readonly llmFactory: LlmProviderFactory,
    private readonly outputParser: OutputParserService,
    private readonly promptBuilder: PromptBuilderService,
    private readonly registryPopulation: RegistryPopulationService,
    private readonly sourceIngestion: SourceIngestionService,
  ) {}

  /**
   * Execute an agent run: build prompt → call LLM → save output → update status.
   * Returns the completed agent run or throws on critical failure.
   */
  async execute(agentRunId: string): Promise<AgentRunEntity> {
    const agentRun = await this.agentRunRepo.findOne({
      where: { id: agentRunId },
      relations: ['agent'],
    });
    if (!agentRun) throw new Error(`AgentRun ${agentRunId} not found`);

    const agent =
      agentRun.agent || (await this.agentRepo.findOne({ where: { id: agentRun.agentId } }));
    if (!agent) throw new Error(`Agent ${agentRun.agentId} not found`);

    const run = await this.runRepo.findOne({ where: { id: agentRun.runId } });
    if (!run) throw new Error(`Run ${agentRun.runId} not found`);

    // Find the current step for context
    const currentStep = await this.stepRepo.findOne({
      where: { runId: run.id, status: RunStatus.RUNNING },
      order: { stepOrder: 'ASC' },
    });

    await this.log(
      run.projectId,
      run.id,
      agentRun.id,
      LogLevel.INFO,
      `Agent execution started: ${agent.name} (${agent.agentType})`,
    );

    try {
      // 1. Build messages (with source context + previous step outputs for late-pipeline agents)
      const sourceContext = await this.sourceIngestion.getContext(run.projectId);
      const previousOutputsContext = await this.getPreviousStepOutputs(run.id, agent.agentType);
      const fullSourceContext = previousOutputsContext
        ? `${sourceContext}\n\n${previousOutputsContext}`
        : sourceContext;
      const messages = await this.promptBuilder.buildMessages(agent, run, currentStep, agentRun, fullSourceContext);

      // 2. Call LLM
      const llmResponse = await this.llmFactory.chat(messages, agent.config);

      // 3. Parse structured JSON from LLM response
      const parseResult = this.outputParser.parse(llmResponse.content);

      // 4. Save output
      const output = this.agentOutputRepo.create({
        agentRunId: agentRun.id,
        outputType: OutputType.SUMMARY,
        title: `${agent.name}: ${currentStep?.stepName || 'execution'}`,
        contentMarkdown: llmResponse.content,
        structuredDataJson: {
          model: llmResponse.model,
          provider: llmResponse.provider,
          tokenUsage: llmResponse.tokenUsage,
          finishReason: llmResponse.finishReason,
          durationMs: llmResponse.durationMs,
          parsed: parseResult.success,
          parsedData: parseResult.data,
          parseError: parseResult.error ?? null,
        },
        validationStatus: ValidationStatus.PENDING,
      });
      await this.agentOutputRepo.save(output);

      // 5. Populate registry tables from parsed data
      if (parseResult.success && parseResult.data) {
        try {
          const popCtx: PopulationContext = {
            projectId: run.projectId,
            runId: run.id,
            agentRunId: agentRun.id,
            agentType: agent.agentType,
          };
          const populated = await this.registryPopulation.populate(
            popCtx,
            parseResult.data as Record<string, unknown>,
          );
          this.logger.log(`Registry populated: ${populated} entries for ${agent.agentType}`);
        } catch (popErr: unknown) {
          const popMsg = popErr instanceof Error ? popErr.message : String(popErr);
          this.logger.warn(`Registry population error (non-fatal): ${popMsg}`);
        }
      }

      // 6. Mark agent run as completed
      agentRun.status = RunStatus.COMPLETED;
      agentRun.outputSummary = llmResponse.content.substring(0, 2000);
      agentRun.finishedAt = new Date();
      agentRun.confidenceLevel = parseResult.success
        ? ConfidenceStatus.INFERRED
        : ConfidenceStatus.UNVALIDATED;
      await this.agentRunRepo.save(agentRun);

      await this.log(
        run.projectId,
        run.id,
        agentRun.id,
        LogLevel.INFO,
        `Agent execution completed: ${agent.name} — ${llmResponse.tokenUsage.total} tokens, ${llmResponse.durationMs}ms`,
      );

      return agentRun;
    } catch (error: unknown) {
      const errMsg = error instanceof Error ? error.message : String(error);
      this.logger.error(`Agent execution failed: ${agent.name} — ${errMsg}`);

      // Mark run as failed but don't crash the pipeline
      agentRun.status = RunStatus.FAILED;
      agentRun.outputSummary = `Execution error: ${errMsg.substring(0, 500)}`;
      agentRun.finishedAt = new Date();
      agentRun.confidenceLevel = ConfidenceStatus.UNVALIDATED;
      await this.agentRunRepo.save(agentRun);

      await this.log(
        run.projectId,
        run.id,
        agentRun.id,
        LogLevel.ERROR,
        `Agent execution failed: ${agent.name} — ${errMsg}`,
      );

      return agentRun;
    }
  }

  /**
   * For late-pipeline agents (report_generator, orchestrator as finalizer),
   * fetch the outputs from all previous completed steps so they can synthesize findings.
   */
  private async getPreviousStepOutputs(runId: string, agentType: AgentType): Promise<string> {
    // Only inject previous outputs for agents that need to synthesize findings
    const needsPreviousOutputs = [
      AgentType.REPORT_GENERATOR,
      AgentType.EVIDENCE_COLLECTOR,
      AgentType.COMPARATOR,
    ].includes(agentType);

    if (!needsPreviousOutputs) return '';

    try {
      // Get all completed agent runs for this run with their outputs
      const agentRuns = await this.agentRunRepo.find({
        where: { runId, status: RunStatus.COMPLETED },
        relations: ['agent'],
        order: { createdAt: 'ASC' },
      });

      if (agentRuns.length === 0) return '';

      const outputs = await this.agentOutputRepo.find({
        where: { agentRunId: In(agentRuns.map((ar) => ar.id)) },
        order: { createdAt: 'ASC' },
      });

      // Build a context block with previous findings
      const sections: string[] = ['## Previous Agent Findings\n'];
      const MAX_OUTPUT_CHARS = 12_000; // Cap total previous output context
      let totalChars = 0;

      for (const ar of agentRuns) {
        if (totalChars >= MAX_OUTPUT_CHARS) break;

        const arOutputs = outputs.filter((o) => o.agentRunId === ar.id);
        const agentName = ar.agent?.name || ar.agentId;
        const agentType = ar.agent?.agentType || 'unknown';

        sections.push(`### ${agentName} (${agentType})`);

        if (ar.outputSummary) {
          const summary = ar.outputSummary.substring(0, 2000);
          sections.push(summary);
          totalChars += summary.length;
        }

        for (const output of arOutputs) {
          if (totalChars >= MAX_OUTPUT_CHARS) break;

          if (output.structuredDataJson?.parsedData) {
            const jsonStr = JSON.stringify(output.structuredDataJson.parsedData, null, 2);
            const truncated = jsonStr.substring(0, 3000);
            sections.push(`\n**Structured Data:**\n\`\`\`json\n${truncated}\n\`\`\``);
            totalChars += truncated.length;
          }
        }

        sections.push('');
      }

      return sections.join('\n');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      this.logger.warn(`Failed to fetch previous step outputs: ${msg}`);
      return '';
    }
  }

  private async log(
    projectId: string | null,
    runId: string | null,
    agentRunId: string | null,
    level: LogLevel,
    message: string,
  ): Promise<void> {
    try {
      const log = this.logRepo.create({
        projectId,
        runId,
        agentRunId,
        logLevel: level,
        message,
        contextJson: { source: 'agent-execution', timestamp: new Date().toISOString() },
      });
      await this.logRepo.save(log);
    } catch (err) {
      this.logger.error(`Failed to save log: ${message}`, err);
    }
  }
}
