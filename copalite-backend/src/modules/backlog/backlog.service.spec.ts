import { BadRequestException, NotFoundException } from '@nestjs/common';
import { BacklogPriority, BacklogStatus, BacklogType, SeverityLevel } from '../../common/enums';
import { BacklogService } from './backlog.service';

describe('BacklogService', () => {
  const repo = {
    create: jest.fn().mockImplementation((d) => d),
    save: jest.fn().mockImplementation((e) => ({ id: 'bl-1', ...e })),
    find: jest.fn(),
    findOne: jest.fn(),
    findAndCount: jest.fn(),
  } as any;

  const compRepo = {
    find: jest.fn(),
  } as any;

  const diffRepo = {
    createQueryBuilder: jest.fn(),
  } as any;

  const notificationsService = {
    notify: jest.fn(),
  } as any;

  const logsService = {
    logRun: jest.fn().mockResolvedValue(undefined),
  } as any;

  const dataSource = {
    getRepository: jest.fn().mockReturnValue({
      findOne: jest.fn().mockResolvedValue(null),
    }),
  } as any;

  const activityHistory = {
    createFromContext: jest.fn().mockResolvedValue(undefined),
  } as any;

  let service: BacklogService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new BacklogService(
      repo,
      compRepo,
      diffRepo,
      notificationsService,
      logsService,
      dataSource,
      activityHistory,
    );
  });

  it('should create a backlog item', async () => {
    const dto = {
      projectId: 'p-1',
      title: 'Missing endpoint',
      description: 'The /users endpoint is not documented',
      backlogType: BacklogType.GAP,
      priority: BacklogPriority.HIGH,
    };

    const result = await service.create(dto as any);

    expect(repo.create).toHaveBeenCalledWith(dto);
    expect(repo.save).toHaveBeenCalled();
    expect(result.title).toBe('Missing endpoint');
  });

  it('should return paginated results for findAllByProject', async () => {
    const items = [{ id: 'bl-1' }, { id: 'bl-2' }];
    repo.findAndCount.mockResolvedValue([items, 2]);

    const result = await service.findAllByProject('p-1', { page: 1, limit: 20 } as any);

    const paginated = result as any;
    expect(paginated).toHaveProperty('data');
    expect(paginated).toHaveProperty('meta');
    expect(paginated.data).toHaveLength(2);
    expect(paginated.meta.total).toBe(2);
  });

  it('should return empty result when generateFromRun finds no comparisons', async () => {
    repo.find.mockResolvedValue([]); // no existing items
    compRepo.find.mockResolvedValue([]); // no comparisons

    const result = await service.generateFromRun('run-1', 'p-1');

    expect(result).toEqual({ created: 0, skipped: 0, items: [] });
  });

  it('should generate backlog items from run diffs', async () => {
    repo.find.mockResolvedValue([]); // no existing items (not idempotent skip)
    compRepo.find.mockResolvedValue([{ id: 'comp-1', projectId: 'p-1' }]);

    const mockDiffs = [
      { id: 'd-1', title: 'Missing field', description: 'Field X not in API', severity: SeverityLevel.HIGH },
      { id: 'd-2', title: 'Extra route', description: null, severity: SeverityLevel.LOW },
    ];
    const qb = { where: jest.fn().mockReturnThis(), getMany: jest.fn().mockResolvedValue(mockDiffs) };
    diffRepo.createQueryBuilder.mockReturnValue(qb);

    // repo.save returns each item with an id
    let saveCount = 0;
    repo.save.mockImplementation((e: any) => ({ id: `bl-${++saveCount}`, ...e }));

    const result = await service.generateFromRun('run-1');

    expect(result.created).toBe(2);
    expect(result.items).toHaveLength(2);
    // Verify priority mapping from severity
    expect(repo.create).toHaveBeenCalledWith(
      expect.objectContaining({
        priority: BacklogPriority.HIGH,
        backlogType: BacklogType.GAP,
        status: BacklogStatus.OPEN,
        sourceType: 'diff',
      }),
    );
    expect(logsService.logRun).toHaveBeenCalled();
  });

  it('should approve a backlog item and set status to TRIAGED', async () => {
    const item = {
      id: 'bl-1',
      projectId: 'p-1',
      title: 'Gap item',
      description: 'Adequate description for approval',
      status: BacklogStatus.OPEN,
      approvedForTask: false,
      approvedByUserId: null,
      approvedAt: null,
    };
    repo.findOne.mockResolvedValue(item);
    repo.save.mockImplementation((e: any) => e);

    const result = await service.approveForTask('bl-1', { approvedForTask: true } as any, 'user-1');

    expect(result.approvedForTask).toBe(true);
    expect(result.approvedByUserId).toBe('user-1');
    expect(result.approvedAt).toBeInstanceOf(Date);
    expect(result.status).toBe(BacklogStatus.TRIAGED);
  });

  it('should throw BadRequestException when approving item with short description', async () => {
    const item = {
      id: 'bl-1',
      projectId: 'p-1',
      title: 'Gap',
      description: 'short',
      status: BacklogStatus.OPEN,
    };
    repo.findOne.mockResolvedValue(item);

    await expect(
      service.approveForTask('bl-1', { approvedForTask: true } as any, 'user-1'),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('should throw NotFoundException when approving nonexistent item', async () => {
    repo.findOne.mockResolvedValue(null);

    await expect(
      service.approveForTask('nonexistent', { approvedForTask: true } as any, 'user-1'),
    ).rejects.toBeInstanceOf(NotFoundException);
  });
});
