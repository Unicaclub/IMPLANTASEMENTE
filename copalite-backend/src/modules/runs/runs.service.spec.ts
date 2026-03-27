import { NotFoundException } from '@nestjs/common';
import { RunStatus } from '../../common/enums';
import { PaginatedResponseDto } from '../../common/pipes/pagination';
import { RunsService } from './runs.service';

describe('RunsService', () => {
  const runRepo = {
    create: jest.fn().mockImplementation((d) => d),
    save: jest.fn().mockImplementation((e) => ({ id: 'run-1', ...e })),
    find: jest.fn(),
    findOne: jest.fn(),
    findAndCount: jest.fn(),
    manager: {
      getRepository: jest.fn().mockReturnValue({
        findOne: jest.fn().mockResolvedValue(null),
      }),
    },
  } as any;

  const stepRepo = {
    create: jest.fn().mockImplementation((d) => d),
    save: jest.fn().mockImplementation((e) => ({ id: 'step-1', ...e })),
    find: jest.fn(),
  } as any;

  const agentRunRepo = {
    find: jest.fn(),
  } as any;

  const agentOutputRepo = {
    find: jest.fn(),
  } as any;

  const activityHistory = {
    createFromContext: jest.fn().mockResolvedValue(undefined),
  } as any;

  const notificationsService = {
    notify: jest.fn(),
  } as any;

  let service: RunsService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new RunsService(
      runRepo,
      stepRepo,
      agentRunRepo,
      agentOutputRepo,
      activityHistory,
      notificationsService,
    );
  });

  it('should create a run with PENDING status', async () => {
    const dto = { projectId: 'p-1', title: 'Discovery run', runType: 'discovery' };

    const result = await service.create(dto as any, 'user-1');

    expect(runRepo.create).toHaveBeenCalledWith(
      expect.objectContaining({
        projectId: 'p-1',
        title: 'Discovery run',
        status: RunStatus.PENDING,
        createdByUserId: 'user-1',
      }),
    );
    expect(runRepo.save).toHaveBeenCalled();
    expect(result.status).toBe(RunStatus.PENDING);
  });

  it('should return paginated results for findAllByProject', async () => {
    const runs = [{ id: 'run-1' }, { id: 'run-2' }];
    runRepo.findAndCount.mockResolvedValue([runs, 2]);

    const result = await service.findAllByProject('p-1', { page: 1, limit: 20 } as any);

    expect(result).toBeInstanceOf(PaginatedResponseDto);
    expect((result as PaginatedResponseDto<any>).data).toHaveLength(2);
    expect((result as PaginatedResponseDto<any>).meta.total).toBe(2);
  });

  it('should throw NotFoundException when run not found', async () => {
    runRepo.findOne.mockResolvedValue(null);

    await expect(service.findById('nonexistent')).rejects.toBeInstanceOf(NotFoundException);
  });

  it('should set startedAt when transitioning to RUNNING', async () => {
    const run = { id: 'run-1', projectId: 'p-1', title: 'Run', status: RunStatus.PENDING, startedAt: null, finishedAt: null };
    runRepo.findOne.mockResolvedValue(run);
    runRepo.save.mockImplementation((e: any) => e);

    const result = await service.updateStatus('run-1', { status: RunStatus.RUNNING } as any);

    expect(result.startedAt).toBeInstanceOf(Date);
    expect(result.finishedAt).toBeNull();
  });

  it('should set finishedAt when transitioning to COMPLETED', async () => {
    const run = { id: 'run-1', projectId: 'p-1', title: 'Run', status: RunStatus.RUNNING, startedAt: new Date(), finishedAt: null };
    runRepo.findOne.mockResolvedValue(run);
    runRepo.save.mockImplementation((e: any) => e);

    const result = await service.updateStatus('run-1', { status: RunStatus.COMPLETED } as any);

    expect(result.finishedAt).toBeInstanceOf(Date);
  });

  it('should return steps with agent output data via listSteps', async () => {
    const steps = [
      { id: 's-1', runId: 'run-1', stepOrder: 1 },
      { id: 's-2', runId: 'run-1', stepOrder: 2 },
    ];
    const agentRuns = [
      { id: 'ar-1', agentId: 'ag-1', status: 'completed', outputSummary: 'ok', confidenceLevel: 0.9, startedAt: new Date(), finishedAt: new Date(), agent: { name: 'Mapper' }, createdAt: new Date() },
    ];
    const outputs = [
      { agentRunId: 'ar-1', structuredDataJson: { key: 'val' }, createdAt: new Date() },
    ];

    stepRepo.find.mockResolvedValue(steps);
    agentRunRepo.find.mockResolvedValue(agentRuns);
    agentOutputRepo.find.mockResolvedValue(outputs);

    const result = await service.listSteps('run-1');

    expect(result).toHaveLength(2);
    expect(result[0].agentOutput).toBeDefined();
    expect(result[0].agentOutput!.structuredDataJson).toEqual({ key: 'val' });
    expect(result[0].agentRun).toBeDefined();
    expect(result[0].agentRun!.agentId).toBe('ag-1');
    // Second step has no matching agent run
    expect(result[1].agentRun).toBeNull();
    expect(result[1].agentOutput).toBeNull();
  });
});
