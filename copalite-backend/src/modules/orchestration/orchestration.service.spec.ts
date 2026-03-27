import { BadRequestException, NotFoundException } from '@nestjs/common';
import { OrchestrationService } from './orchestration.service';
import { RUN_PIPELINES } from './interfaces';
import { RunStatus, RunType, StatusBase } from '../../common/enums';

describe('OrchestrationService', () => {
  // ── Repositories ──────────────────────────────────────────────
  const runRepo = {
    create: jest.fn().mockImplementation((d) => d),
    save: jest.fn().mockImplementation((e) => ({ id: 'run-1', ...e })),
    findOne: jest.fn(),
  } as any;

  const stepRepo = {
    create: jest.fn().mockImplementation((d) => d),
    save: jest.fn().mockImplementation((e) => ({ id: `step-${e.stepOrder}`, ...e })),
    find: jest.fn(),
    findOne: jest.fn(),
    createQueryBuilder: jest.fn().mockReturnValue({
      update: jest.fn().mockReturnThis(),
      set: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      execute: jest.fn().mockResolvedValue({ affected: 1 }),
    }),
  } as any;

  const agentRepo = {
    findOne: jest.fn(),
  } as any;

  const agentRunRepo = {
    create: jest.fn().mockImplementation((d) => d),
    save: jest.fn().mockImplementation((e) => ({ id: 'ar-1', ...e })),
    findOne: jest.fn(),
    find: jest.fn().mockResolvedValue([]),
    createQueryBuilder: jest.fn().mockReturnValue({
      update: jest.fn().mockReturnThis(),
      set: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      execute: jest.fn().mockResolvedValue({ affected: 1 }),
    }),
  } as any;

  const agentOutputRepo = {
    create: jest.fn().mockImplementation((d) => d),
    save: jest.fn(),
  } as any;

  const logRepo = {
    create: jest.fn().mockImplementation((d) => d),
    save: jest.fn().mockResolvedValue({}),
  } as any;

  // ── DataSource with QueryRunner ───────────────────────────────
  const mockManager = {
    findOne: jest.fn(),
    save: jest.fn().mockImplementation((e) => e),
    create: jest.fn().mockImplementation((_Entity, d) => d),
  };

  const mockQueryRunner = {
    connect: jest.fn(),
    startTransaction: jest.fn(),
    commitTransaction: jest.fn(),
    rollbackTransaction: jest.fn(),
    release: jest.fn(),
    manager: mockManager,
  };

  const dataSource = {
    createQueryRunner: jest.fn().mockReturnValue(mockQueryRunner),
    getRepository: jest.fn().mockReturnValue({
      findOne: jest.fn().mockResolvedValue({ workspaceId: 'ws-1' }),
    }),
  } as any;

  // ── Services ──────────────────────────────────────────────────
  const notificationsService = {
    notify: jest.fn(),
  } as any;

  const agentExecutionService = {
    execute: jest.fn(),
  } as any;

  const llmProviderFactory = {
    getAvailableProviders: jest.fn().mockReturnValue(['openai']),
  } as any;

  const sourceIngestionService = {
    cleanup: jest.fn(),
  } as any;

  const configService = {
    get: jest.fn().mockReturnValue('false'),
  } as any;

  const backlogService = {
    generateFromRun: jest.fn().mockResolvedValue({}),
  } as any;

  const auditsService = {
    generateFromRun: jest.fn().mockResolvedValue({}),
  } as any;

  const reportsService = {
    generateFromRun: jest.fn().mockResolvedValue({}),
  } as any;

  let service: OrchestrationService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new OrchestrationService(
      runRepo,
      stepRepo,
      agentRepo,
      agentRunRepo,
      agentOutputRepo,
      logRepo,
      dataSource,
      notificationsService,
      agentExecutionService,
      llmProviderFactory,
      sourceIngestionService,
      configService,
      backlogService,
      auditsService,
      reportsService,
    );
  });

  // ─────────────────────────────────────────────────────────────
  // 1. startPipeline — dryRun creates run + steps without running
  // ─────────────────────────────────────────────────────────────
  it('should create run and steps in dryRun mode without activating', async () => {
    agentRepo.findOne.mockResolvedValue({ id: 'agent-1', name: 'Orchestrator' });

    const result = await service.startPipeline(
      {
        projectId: 'proj-1',
        runType: RunType.DISCOVERY,
        title: 'Test discovery',
        goal: 'Map everything',
        dryRun: true,
      },
      'user-1',
    );

    expect(result.run).toBeDefined();
    expect(result.run.status).toBe(RunStatus.PENDING);
    expect(result.steps.length).toBe(RUN_PIPELINES[RunType.DISCOVERY].length);
    expect(result.firstAgentRun).toBeNull();
    expect(result.pipeline).toEqual(RUN_PIPELINES[RunType.DISCOVERY]);
  });

  // ─────────────────────────────────────────────────────────────
  // 2. startPipeline — real run activates first step
  // ─────────────────────────────────────────────────────────────
  it('should activate first step and create agent run when not dryRun', async () => {
    agentRepo.findOne.mockResolvedValue({ id: 'agent-1', name: 'Orchestrator', status: StatusBase.ACTIVE });

    const result = await service.startPipeline(
      {
        projectId: 'proj-1',
        runType: RunType.COMPARISON,
        title: 'Test comparison',
        goal: 'Compare docs vs code',
      },
      'user-1',
    );

    expect(result.run.status).toBe(RunStatus.RUNNING);
    expect(result.firstAgentRun).toBeDefined();
    expect(result.firstAgentRun!.status).toBe(RunStatus.RUNNING);
    expect(agentRepo.findOne).toHaveBeenCalled();
  });

  // ─────────────────────────────────────────────────────────────
  // 3. startPipeline — unknown runType throws BadRequestException
  // ─────────────────────────────────────────────────────────────
  it('should throw BadRequestException for unknown runType', async () => {
    await expect(
      service.startPipeline(
        {
          projectId: 'proj-1',
          runType: 'nonexistent_type' as RunType,
          title: 'Bad run',
          goal: 'Should fail',
        },
        'user-1',
      ),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  // ─────────────────────────────────────────────────────────────
  // 4. advanceStep — completes current step and activates next
  // ─────────────────────────────────────────────────────────────
  it('should complete current step and activate next step', async () => {
    const run = { id: 'run-1', runType: RunType.COMPARISON, status: RunStatus.RUNNING, projectId: 'proj-1', createdByUserId: 'user-1', title: 'Test', goal: 'G' };
    const currentStep = { id: 'step-1', runId: 'run-1', stepOrder: 1, stepName: 'Init', status: RunStatus.RUNNING };
    const nextStep = { id: 'step-2', runId: 'run-1', stepOrder: 2, stepName: 'Cross-ref', status: RunStatus.PENDING };
    const currentAgentRun = { id: 'ar-1', runId: 'run-1', status: RunStatus.RUNNING };
    const agent = { id: 'agent-2', name: 'Comparator', status: StatusBase.ACTIVE };

    // manager.findOne calls in order:
    // 1. RunEntity (locked)
    // 2. RunStepEntity (current running step)
    // 3. AgentRunEntity (running)
    // 4. AgentOutputEntity (existing check) — null
    // 5. RunStepEntity (next pending)
    // 6. AgentEntity (for next step)
    mockManager.findOne
      .mockResolvedValueOnce(run)            // run
      .mockResolvedValueOnce(currentStep)    // current step
      .mockResolvedValueOnce(currentAgentRun) // current agent run (running)
      .mockResolvedValueOnce(null)           // no existing output
      .mockResolvedValueOnce(nextStep)       // next step
      .mockResolvedValueOnce(agent);         // agent for next step

    const result = await service.advanceStep('run-1', {
      outputSummary: 'Step 1 done',
      success: true,
    });

    expect(result.completedStep.status).toBe(RunStatus.COMPLETED);
    expect(result.nextStep).not.toBeNull();
    expect(result.nextAgentRun).toBeDefined();
    expect(result.pipelineFinished).toBe(false);
    expect(mockQueryRunner.commitTransaction).toHaveBeenCalled();
    expect(mockQueryRunner.release).toHaveBeenCalled();
  });

  // ─────────────────────────────────────────────────────────────
  // 5. advanceStep — finishes pipeline when no next step
  // ─────────────────────────────────────────────────────────────
  it('should finish pipeline when no pending steps remain', async () => {
    const run = { id: 'run-1', runType: RunType.COMPARISON, status: RunStatus.RUNNING, projectId: 'proj-1', createdByUserId: 'user-1', title: 'Test' };
    const lastStep = { id: 'step-4', runId: 'run-1', stepOrder: 4, stepName: 'Finalize', status: RunStatus.RUNNING };
    const lastAgentRun = { id: 'ar-4', runId: 'run-1', status: RunStatus.RUNNING };

    mockManager.findOne
      .mockResolvedValueOnce(run)            // run
      .mockResolvedValueOnce(lastStep)       // current step
      .mockResolvedValueOnce(lastAgentRun)   // agent run
      .mockResolvedValueOnce(null)           // no existing output
      .mockResolvedValueOnce(null);          // no next step

    const result = await service.advanceStep('run-1', {
      outputSummary: 'Final step done',
      success: true,
    });

    expect(result.pipelineFinished).toBe(true);
    expect(result.nextStep).toBeNull();
    expect(result.nextAgentRun).toBeNull();
    expect(run.status).toBe(RunStatus.COMPLETED);
    expect(mockQueryRunner.commitTransaction).toHaveBeenCalled();
  });

  // ─────────────────────────────────────────────────────────────
  // 6. cancelPipeline — sets run and steps to cancelled
  // ─────────────────────────────────────────────────────────────
  it('should cancel a running pipeline and all pending/running steps', async () => {
    runRepo.findOne.mockResolvedValue({
      id: 'run-1',
      projectId: 'proj-1',
      status: RunStatus.RUNNING,
      title: 'Test run',
    });

    const result = await service.cancelPipeline('run-1');

    expect(result.status).toBe(RunStatus.CANCELLED);
    expect(result.finishedAt).toBeDefined();
    expect(stepRepo.createQueryBuilder).toHaveBeenCalled();
    expect(agentRunRepo.createQueryBuilder).toHaveBeenCalled();
    expect(runRepo.save).toHaveBeenCalled();
  });

  // ─────────────────────────────────────────────────────────────
  // 7. cancelPipeline — rejects cancelling a finished run
  // ─────────────────────────────────────────────────────────────
  it('should throw BadRequestException when cancelling a completed run', async () => {
    runRepo.findOne.mockResolvedValue({
      id: 'run-1',
      status: RunStatus.COMPLETED,
    });

    await expect(service.cancelPipeline('run-1')).rejects.toBeInstanceOf(BadRequestException);
  });

  // ─────────────────────────────────────────────────────────────
  // 8. retryFailedStep — resets failed step and reactivates
  // ─────────────────────────────────────────────────────────────
  it('should retry a failed step by resetting it and creating new agent run', async () => {
    const run = { id: 'run-1', projectId: 'proj-1', status: RunStatus.FAILED, runType: RunType.AUDIT, goal: 'Audit all', finishedAt: new Date() };
    const failedStep = { id: 'step-2', runId: 'run-1', stepOrder: 2, stepName: 'Validate registries', status: RunStatus.FAILED };

    runRepo.findOne.mockResolvedValue(run);
    stepRepo.findOne.mockResolvedValue(failedStep);
    agentRepo.findOne.mockResolvedValue({ id: 'agent-3', name: 'Code Auditor', status: StatusBase.ACTIVE });

    const result = await service.retryFailedStep('run-1');

    expect(run.status).toBe(RunStatus.RUNNING);
    expect(run.finishedAt).toBeNull();
    // activateStep resets to PENDING then immediately sets to RUNNING
    expect(failedStep.status).toBe(RunStatus.RUNNING);
    expect(result.retriedStep).toBeDefined();
    expect(result.agentRun).toBeDefined();
    expect(result.agentRun.status).toBe(RunStatus.RUNNING);
  });

  // ─────────────────────────────────────────────────────────────
  // 9. getPipelineStatus — returns correct progress calculation
  // ─────────────────────────────────────────────────────────────
  it('should return correct progress percentage for pipeline status', async () => {
    runRepo.findOne.mockResolvedValue({ id: 'run-1' });
    stepRepo.find.mockResolvedValue([
      { id: 's1', stepOrder: 1, status: RunStatus.COMPLETED, startedAt: new Date('2025-01-01') },
      { id: 's2', stepOrder: 2, status: RunStatus.COMPLETED, startedAt: new Date('2025-01-02') },
      { id: 's3', stepOrder: 3, status: RunStatus.RUNNING, startedAt: new Date('2025-01-03') },
      { id: 's4', stepOrder: 4, status: RunStatus.PENDING, startedAt: null },
    ]);
    agentRunRepo.find.mockResolvedValue([]);

    const result = await service.getPipelineStatus('run-1');

    expect(result.progress.completed).toBe(2);
    expect(result.progress.total).toBe(4);
    expect(result.progress.percentage).toBe(50);
    expect(result.currentStep).toEqual(
      expect.objectContaining({ id: 's3', status: RunStatus.RUNNING }),
    );
  });

  // ─────────────────────────────────────────────────────────────
  // 10. getAvailablePipelines — returns all pipeline definitions
  // ─────────────────────────────────────────────────────────────
  it('should return all pipeline definitions with step counts', () => {
    const result = service.getAvailablePipelines();

    expect(result[RunType.DISCOVERY]).toBeDefined();
    expect(result[RunType.DISCOVERY].totalSteps).toBe(RUN_PIPELINES[RunType.DISCOVERY].length);
    expect(result[RunType.COMPARISON].totalSteps).toBe(RUN_PIPELINES[RunType.COMPARISON].length);
    expect(result[RunType.AUDIT].totalSteps).toBe(RUN_PIPELINES[RunType.AUDIT].length);
    expect(result[RunType.BACKLOG_GENERATION].totalSteps).toBe(
      RUN_PIPELINES[RunType.BACKLOG_GENERATION].length,
    );

    // Each entry has a steps array matching the pipeline definition
    for (const runType of Object.values(RunType)) {
      expect(result[runType].steps).toEqual(RUN_PIPELINES[runType]);
    }
  });
});
