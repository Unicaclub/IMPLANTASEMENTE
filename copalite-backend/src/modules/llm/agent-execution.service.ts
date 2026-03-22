import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { AgentOutputEntity } from '../agent-outputs/entities/agent-output.entity';
import { AgentRunEntity } from '../agent-runs/entities/agent-run.entity';
import { AgentEntity } from '../agents/entities/agent.entity';
import { LogEntity } from '../logs/entities/log.entity';
import { PromptEntity } from '../prompts/entities/prompt.entity';
import { RunStepEntity } from '../runs/entities/run-step.entity';
import { RunEntity } from '../runs/entities/run.entity';

import {
  ConfidenceStatus,
  LogLevel,
  OutputType,
  RunStatus,
  StatusBase,
  ValidationStatus,
} from '../../common/enums';

import { LlmMessage } from './interfaces';
import { LlmProviderFactory } from './llm-provider.factory';
import { OutputParserService } from './output-parser.service';
import { RegistryPopulationService, PopulationContext } from './registry-population.service';
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
    @InjectRepository(PromptEntity)
    private readonly promptRepo: Repository<PromptEntity>,
    @InjectRepository(RunEntity)
    private readonly runRepo: Repository<RunEntity>,
    @InjectRepository(RunStepEntity)
    private readonly stepRepo: Repository<RunStepEntity>,
    private readonly llmFactory: LlmProviderFactory,
    private readonly outputParser: OutputParserService,
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
      // 1. Build messages (with source context)
      const sourceContext = await this.sourceIngestion.getContext(run.projectId);
      const messages = await this.buildMessages(agent, run, currentStep, agentRun, sourceContext);

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
          const populated = await this.registryPopulation.populate(popCtx, parseResult.data as Record<string, unknown>);
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
   * Build the message array for the LLM call.
   */
  private async buildMessages(
    agent: AgentEntity,
    run: RunEntity,
    step: RunStepEntity | null,
    agentRun: AgentRunEntity,
    sourceContext?: string,
  ): Promise<LlmMessage[]> {
    const messages: LlmMessage[] = [];

    // System prompt: prefer agent.systemPrompt, then prompts table, then default
    const prompt = await this.promptRepo.findOne({
      where: { agentId: agent.id, status: StatusBase.ACTIVE },
      order: { version: 'DESC' },
    });

    const systemPrompt =
      agent.systemPrompt || prompt?.contentMarkdown || this.getDefaultSystemPrompt(agent);
    messages.push({ role: 'system', content: systemPrompt });

    // User message with context
    const userContent = [
      `## Task Context`,
      `- **Run Type**: ${run.runType}`,
      `- **Run Goal**: ${run.goal}`,
      step ? `- **Current Step**: Step ${step.stepOrder} — ${step.stepName}` : '',
      step ? `- **Step Type**: ${step.stepType}` : '',
      agentRun.inputSummary ? `- **Input Summary**: ${agentRun.inputSummary}` : '',
      '',
      `## Instructions`,
      `Execute your role as the **${agent.name}** agent.`,
      agent.description ? `Agent description: ${agent.description}` : '',
      '',
      `Provide your output in Markdown format with structured sections.`,
      `Include a summary section at the end.`,
      sourceContext ? '' : '',
      sourceContext || '',
    ]
      .filter(Boolean)
      .join('\n');

    messages.push({ role: 'user', content: userContent });

    return messages;
  }

  /**
   * Default system prompt when no prompt template is configured.
   */
  private getDefaultSystemPrompt(agent: AgentEntity): string {
    return [
      `You are the ${agent.name} agent in the Copalite platform.`,
      `Your agent type is: ${agent.agentType}.`,
      agent.description ? `Your role: ${agent.description}` : '',
      '',
      'Follow these rules:',
      '1. Analyze the provided context carefully.',
      '2. Execute your specific role within the pipeline.',
      '3. Output structured Markdown with clear sections.',
      '4. Include a "## Summary" section at the end.',
      '5. Be precise, technical, and actionable.',
    ]
      .filter(Boolean)
      .join('\n');
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
