import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';

// Entities
import { RunEntity } from '../runs/entities/run.entity';
import { RunStepEntity } from '../runs/entities/run-step.entity';
import { AgentEntity } from '../agents/entities/agent.entity';
import { AgentRunEntity } from '../agent-runs/entities/agent-run.entity';
import { AgentOutputEntity } from '../agent-outputs/entities/agent-output.entity';
import { LogEntity } from '../logs/entities/log.entity';
import { NotificationsService } from '../notifications/notifications.service';

// Enums
import {
  RunStatus,
  RunType,
  AgentType,
  ConfidenceStatus,
  LogLevel,
  OutputType,
  ValidationStatus,
} from '../../common/enums';

// Interfaces
import {
  RUN_PIPELINES,
  AgentPipelineStep,
  PipelineExecutionResult,
  AgentStepResult,
} from './interfaces';

// DTOs
import { StartPipelineDto, AdvanceStepDto } from './dto';

@Injectable()
export class OrchestrationService {
  private readonly logger = new Logger(OrchestrationService.name);

  constructor(
    @InjectRepository(RunEntity)
    private readonly runRepo: Repository<RunEntity>,
    @InjectRepository(RunStepEntity)
    private readonly stepRepo: Repository<RunStepEntity>,
    @InjectRepository(AgentEntity)
    private readonly agentRepo: Repository<AgentEntity>,
    @InjectRepository(AgentRunEntity)
    private readonly agentRunRepo: Repository<AgentRunEntity>,
    @InjectRepository(AgentOutputEntity)
    private readonly agentOutputRepo: Repository<AgentOutputEntity>,
    @InjectRepository(LogEntity)
    private readonly logRepo: Repository<LogEntity>,
    private readonly dataSource: DataSource,
    private readonly notificationsService: NotificationsService,
  ) {}

  // =========================================
  // 1. START PIPELINE
  // Creates run + all steps + first agent run
  // =========================================

  async startPipeline(dto: StartPipelineDto, userId: string): Promise<{
    run: RunEntity;
    steps: RunStepEntity[];
    firstAgentRun: AgentRunEntity | null;
    pipeline: AgentPipelineStep[];
  }> {
    const pipeline = RUN_PIPELINES[dto.runType];
    if (!pipeline || pipeline.length === 0) {
      throw new BadRequestException(`No pipeline defined for run type: ${dto.runType}`);
    }

    // Create the run
    const run = this.runRepo.create({
      projectId: dto.projectId,
      sourceId: dto.sourceId || null,
      runType: dto.runType,
      title: dto.title,
      goal: dto.goal,
      scopeText: dto.scopeText || null,
      createdByUserId: userId,
      status: RunStatus.PENDING,
    });
    const savedRun = await this.runRepo.save(run);

    await this.log(savedRun.projectId, savedRun.id, null, LogLevel.INFO,
      `Pipeline started: ${dto.runType} — "${dto.title}"`,
    );

    // Create all steps from the pipeline definition
    const steps: RunStepEntity[] = [];
    for (let i = 0; i < pipeline.length; i++) {
      const pStep = pipeline[i];
      const step = this.stepRepo.create({
        runId: savedRun.id,
        stepOrder: i + 1,
        stepName: pStep.stepName,
        stepType: pStep.stepType,
        status: RunStatus.PENDING,
      });
      steps.push(await this.stepRepo.save(step));
    }

    // If not dry run, start the run and first step
    let firstAgentRun: AgentRunEntity | null = null;
    if (!dto.dryRun) {
      savedRun.status = RunStatus.RUNNING;
      savedRun.startedAt = new Date();
      await this.runRepo.save(savedRun);

      firstAgentRun = await this.activateStep(savedRun, steps[0], pipeline[0]);
    }

    // Fire notification (non-blocking)
    this.notifyPipeline(dto.projectId, userId, 'pipeline_started', `Pipeline started: ${dto.title}`);

    return {
      run: savedRun,
      steps,
      firstAgentRun,
      pipeline,
    };
  }

  // =========================================
  // 2. ADVANCE TO NEXT STEP
  // Completes current step, starts next one
  // =========================================

  async advanceStep(
    runId: string,
    dto: AdvanceStepDto,
  ): Promise<{
    completedStep: RunStepEntity;
    completedAgentRun: AgentRunEntity;
    nextStep: RunStepEntity | null;
    nextAgentRun: AgentRunEntity | null;
    pipelineFinished: boolean;
  }> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // Lock the run row to prevent concurrent advances
      const run = await queryRunner.manager.findOne(RunEntity, {
        where: { id: runId },
        lock: { mode: 'pessimistic_write' },
      });
      if (!run) throw new NotFoundException('Run not found');
      if (run.status !== RunStatus.RUNNING) {
        throw new BadRequestException(`Run is not running (current status: ${run.status})`);
      }

      // Find the current active step
      const currentStep = await queryRunner.manager.findOne(RunStepEntity, {
        where: { runId, status: RunStatus.RUNNING },
        order: { stepOrder: 'ASC' },
      });
      if (!currentStep) {
        throw new BadRequestException('No active step found for this run');
      }

      // Find the current agent run
      const currentAgentRun = await queryRunner.manager.findOne(AgentRunEntity, {
        where: { runId, status: RunStatus.RUNNING },
        order: { createdAt: 'DESC' },
      });
      if (!currentAgentRun) {
        throw new BadRequestException('No active agent run found');
      }

      const success = dto.success !== false;

      // Complete the current agent run
      currentAgentRun.status = success ? RunStatus.COMPLETED : RunStatus.FAILED;
      currentAgentRun.outputSummary = dto.outputSummary;
      currentAgentRun.finishedAt = new Date();
      currentAgentRun.confidenceLevel = success
        ? ConfidenceStatus.INFERRED
        : ConfidenceStatus.UNVALIDATED;
      await queryRunner.manager.save(currentAgentRun);

      // Save agent output if provided
      if (dto.structuredData || dto.outputSummary) {
        const output = queryRunner.manager.create(AgentOutputEntity, {
          agentRunId: currentAgentRun.id,
          outputType: OutputType.SUMMARY,
          title: `Output: ${currentStep.stepName}`,
          contentMarkdown: dto.outputSummary || '',
          structuredDataJson: dto.structuredData || null,
          validationStatus: ValidationStatus.PENDING,
        });
        await queryRunner.manager.save(output);
      }

      // Complete the current step
      currentStep.status = success ? RunStatus.COMPLETED : RunStatus.FAILED;
      currentStep.finishedAt = new Date();
      currentStep.notes = success ? null : dto.errorMessage || 'Step failed';
      await queryRunner.manager.save(currentStep);

      // If step failed, decide: block or continue
      if (!success) {
        const pipeline = RUN_PIPELINES[run.runType as RunType];
        const pipelineStep = pipeline[currentStep.stepOrder - 1];

        if (pipelineStep?.required) {
          run.status = RunStatus.FAILED;
          run.finishedAt = new Date();
          await queryRunner.manager.save(run);
          await queryRunner.commitTransaction();

          await this.log(run.projectId, runId, null, LogLevel.ERROR,
            `Pipeline failed: required step "${currentStep.stepName}" failed`,
          );

          this.notifyPipeline(run.projectId, null, 'pipeline_failed', `Pipeline failed: ${run.title} — step "${currentStep.stepName}"`);

          return {
            completedStep: currentStep,
            completedAgentRun: currentAgentRun,
            nextStep: null,
            nextAgentRun: null,
            pipelineFinished: true,
          };
        }
      }

      // Find next step
      const nextStep = await queryRunner.manager.findOne(RunStepEntity, {
        where: { runId, status: RunStatus.PENDING },
        order: { stepOrder: 'ASC' },
      });

      if (!nextStep) {
        run.status = RunStatus.COMPLETED;
        run.finishedAt = new Date();
        await queryRunner.manager.save(run);
        await queryRunner.commitTransaction();

        await this.log(run.projectId, runId, null, LogLevel.INFO,
          `Pipeline completed successfully: ${run.title}`,
        );

        this.notifyPipeline(run.projectId, null, 'pipeline_completed', `Pipeline completed: ${run.title}`);

        return {
          completedStep: currentStep,
          completedAgentRun: currentAgentRun,
          nextStep: null,
          nextAgentRun: null,
          pipelineFinished: true,
        };
      }

      // Activate next step within same transaction
      const agent = await queryRunner.manager.findOne(AgentEntity, {
        where: { agentType: RUN_PIPELINES[run.runType as RunType][nextStep.stepOrder - 1].agentType as any, status: 'active' as any },
      });
      if (!agent) {
        throw new BadRequestException(
          `Agent not found for type: ${RUN_PIPELINES[run.runType as RunType][nextStep.stepOrder - 1].agentType}`,
        );
      }

      nextStep.status = RunStatus.RUNNING;
      nextStep.startedAt = new Date();
      await queryRunner.manager.save(nextStep);

      const nextAgentRun = queryRunner.manager.create(AgentRunEntity, {
        runId: run.id,
        agentId: agent.id,
        status: RunStatus.RUNNING,
        startedAt: new Date(),
        inputSummary: `Step ${nextStep.stepOrder}: ${nextStep.stepName} | Goal: ${run.goal}`,
      });
      const savedNextAgentRun = await queryRunner.manager.save(nextAgentRun);

      await queryRunner.commitTransaction();

      await this.log(run.projectId, runId, currentAgentRun.id,
        success ? LogLevel.INFO : LogLevel.WARN,
        `Step ${currentStep.stepOrder} ${success ? 'completed' : 'failed (optional)'}: ${currentStep.stepName}`,
      );
      await this.log(run.projectId, runId, savedNextAgentRun.id, LogLevel.INFO,
        `Step ${nextStep.stepOrder} started: ${nextStep.stepName} (agent: ${agent.name})`,
      );

      return {
        completedStep: currentStep,
        completedAgentRun: currentAgentRun,
        nextStep,
        nextAgentRun: savedNextAgentRun,
        pipelineFinished: false,
      };
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  // =========================================
  // 3. GET PIPELINE STATUS
  // =========================================

  async getPipelineStatus(runId: string): Promise<{
    run: RunEntity;
    steps: (RunStepEntity & { agentRuns?: AgentRunEntity[] })[];
    progress: { completed: number; total: number; percentage: number };
    currentStep: RunStepEntity | null;
  }> {
    const run = await this.runRepo.findOne({ where: { id: runId } });
    if (!run) throw new NotFoundException('Run not found');

    const steps = await this.stepRepo.find({
      where: { runId },
      order: { stepOrder: 'ASC' },
    });

    // Attach agent runs to each step
    const stepsWithAgentRuns = await Promise.all(
      steps.map(async (step) => {
        const agentRuns = await this.agentRunRepo.find({
          where: { runId },
          relations: ['agent'],
          order: { createdAt: 'ASC' },
        });
        return { ...step, agentRuns: agentRuns.filter(ar =>
          ar.createdAt >= (step.startedAt || new Date(0))
        )};
      }),
    );

    const completed = steps.filter(
      (s) => s.status === RunStatus.COMPLETED || s.status === RunStatus.FAILED,
    ).length;

    const currentStep = steps.find((s) => s.status === RunStatus.RUNNING) || null;

    return {
      run,
      steps: stepsWithAgentRuns,
      progress: {
        completed,
        total: steps.length,
        percentage: steps.length > 0 ? Math.round((completed / steps.length) * 100) : 0,
      },
      currentStep,
    };
  }

  // =========================================
  // 4. CANCEL PIPELINE
  // =========================================

  async cancelPipeline(runId: string): Promise<RunEntity> {
    const run = await this.runRepo.findOne({ where: { id: runId } });
    if (!run) throw new NotFoundException('Run not found');

    if (run.status === RunStatus.COMPLETED || run.status === RunStatus.FAILED) {
      throw new BadRequestException('Cannot cancel a finished run');
    }

    // Cancel all pending/running steps
    await this.stepRepo
      .createQueryBuilder()
      .update(RunStepEntity)
      .set({ status: RunStatus.CANCELLED, finishedAt: new Date() })
      .where('run_id = :runId AND status IN (:...statuses)', {
        runId,
        statuses: [RunStatus.PENDING, RunStatus.RUNNING],
      })
      .execute();

    // Cancel all pending/running agent runs
    await this.agentRunRepo
      .createQueryBuilder()
      .update(AgentRunEntity)
      .set({ status: RunStatus.CANCELLED, finishedAt: new Date() })
      .where('run_id = :runId AND status IN (:...statuses)', {
        runId,
        statuses: [RunStatus.PENDING, RunStatus.RUNNING],
      })
      .execute();

    run.status = RunStatus.CANCELLED;
    run.finishedAt = new Date();
    await this.runRepo.save(run);

    await this.log(run.projectId, runId, null, LogLevel.WARN,
      `Pipeline cancelled: ${run.title}`,
    );

    return run;
  }

  // =========================================
  // 5. RETRY FAILED STEP
  // =========================================

  async retryFailedStep(runId: string): Promise<{
    retriedStep: RunStepEntity;
    agentRun: AgentRunEntity;
  }> {
    const run = await this.runRepo.findOne({ where: { id: runId } });
    if (!run) throw new NotFoundException('Run not found');

    if (run.status !== RunStatus.FAILED) {
      throw new BadRequestException('Can only retry a failed run');
    }

    const failedStep = await this.stepRepo.findOne({
      where: { runId, status: RunStatus.FAILED },
      order: { stepOrder: 'ASC' },
    });
    if (!failedStep) {
      throw new BadRequestException('No failed step found');
    }

    // Reset run to running
    run.status = RunStatus.RUNNING;
    run.finishedAt = null;
    await this.runRepo.save(run);

    // Reactivate the step
    const pipeline = RUN_PIPELINES[run.runType as RunType];
    const pipelineStep = pipeline[failedStep.stepOrder - 1];

    failedStep.status = RunStatus.PENDING;
    failedStep.startedAt = null;
    failedStep.finishedAt = null;
    failedStep.notes = null;
    await this.stepRepo.save(failedStep);

    const agentRun = await this.activateStep(run, failedStep, pipelineStep);

    await this.log(run.projectId, runId, agentRun.id, LogLevel.INFO,
      `Retrying failed step ${failedStep.stepOrder}: ${failedStep.stepName}`,
    );

    return { retriedStep: failedStep, agentRun };
  }

  // =========================================
  // 6. GET AVAILABLE PIPELINES
  // =========================================

  getAvailablePipelines(): Record<RunType, { steps: AgentPipelineStep[]; totalSteps: number }> {
    const result: any = {};
    for (const [runType, steps] of Object.entries(RUN_PIPELINES)) {
      result[runType] = { steps, totalSteps: steps.length };
    }
    return result;
  }

  // =========================================
  // PRIVATE HELPERS
  // =========================================

  private async activateStep(
    run: RunEntity,
    step: RunStepEntity,
    pipelineStep: AgentPipelineStep,
  ): Promise<AgentRunEntity> {
    // Find the agent by type
    const agent = await this.agentRepo.findOne({
      where: { agentType: pipelineStep.agentType, status: 'active' as any },
    });

    if (!agent) {
      this.logger.warn(`Agent not found for type: ${pipelineStep.agentType}`);
      throw new BadRequestException(
        `Agent not found for type: ${pipelineStep.agentType}. Run seed_001_agents.sql first.`,
      );
    }

    // Activate the step
    step.status = RunStatus.RUNNING;
    step.startedAt = new Date();
    await this.stepRepo.save(step);

    // Create agent run
    const agentRun = this.agentRunRepo.create({
      runId: run.id,
      agentId: agent.id,
      status: RunStatus.RUNNING,
      startedAt: new Date(),
      inputSummary: `Step ${step.stepOrder}: ${step.stepName} | Goal: ${run.goal}`,
    });
    const savedAgentRun = await this.agentRunRepo.save(agentRun);

    await this.log(run.projectId, run.id, savedAgentRun.id, LogLevel.INFO,
      `Step ${step.stepOrder} started: ${step.stepName} (agent: ${agent.name})`,
    );

    return savedAgentRun;
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
        contextJson: { source: 'orchestration', timestamp: new Date().toISOString() },
      });
      await this.logRepo.save(log);
    } catch (err) {
      this.logger.error(`Failed to save log: ${message}`, err);
    }
  }

  private notifyPipeline(projectId: string, userId: string | null, type: string, message: string) {
    // Fire and forget — resolve workspaceId from project
    this.dataSource.getRepository('projects').findOne({
      where: { id: projectId },
      select: ['workspaceId'],
    }).then((project: any) => {
      if (project?.workspaceId) {
        this.notificationsService.notify(project.workspaceId, type, message, message, userId || undefined);
      }
    }).catch((err: any) => {
      this.logger.warn(`Failed to send notification: ${err.message}`);
    });
  }
}
