import { NotFoundException } from '@nestjs/common';
import { DashboardService } from './dashboard.service';

describe('DashboardService', () => {
  const mockCount = (val: number) => jest.fn().mockResolvedValue(val);
  const mockCountZero = () => jest.fn().mockResolvedValue(0);

  function buildRepos(opts: { projectExists: boolean; counts?: Record<string, number> }) {
    const projectRepo = {
      findOne: jest.fn().mockResolvedValue(
        opts.projectExists
          ? { id: 'p-1', name: 'Copalite', slug: 'copalite', status: 'active', projectType: 'backend' }
          : null,
      ),
    } as any;

    const c = opts.counts || {};
    const sourceRepo = { count: mockCount(c.sources ?? 0) } as any;
    const runRepo = {
      count: mockCount(c.runs ?? 0),
      find: jest.fn().mockResolvedValue(c.recentRuns ?? []),
    } as any;
    const moduleRepo = { count: mockCount(c.modules ?? 0), find: jest.fn() } as any;
    const routeRepo = { count: mockCount(c.routes ?? 0), find: jest.fn() } as any;
    const apiRepo = { count: mockCount(c.apis ?? 0), find: jest.fn() } as any;
    const schemaRepo = { count: mockCount(c.schemas ?? 0), find: jest.fn() } as any;
    const uiRepo = { count: mockCount(c.ui ?? 0), find: jest.fn() } as any;
    const evidenceRepo = { count: mockCount(c.evidence ?? 0), find: jest.fn() } as any;
    const backlogRepo = { count: mockCount(c.backlog ?? 0), find: jest.fn() } as any;
    const taskRepo = { count: mockCount(c.tasks ?? 0) } as any;

    return {
      projectRepo, sourceRepo, runRepo, moduleRepo, routeRepo,
      apiRepo, schemaRepo, uiRepo, evidenceRepo, backlogRepo, taskRepo,
    };
  }

  it('should return aggregated dashboard data', async () => {
    const recentRun = { id: 'r-1', title: 'Run 1', runType: 'full', status: 'completed', createdAt: new Date() };
    const repos = buildRepos({
      projectExists: true,
      counts: {
        sources: 3,
        runs: 10,
        modules: 5,
        routes: 12,
        apis: 8,
        schemas: 4,
        ui: 2,
        evidence: 7,
        backlog: 6,
        tasks: 4,
        recentRuns: [recentRun] as any,
      },
    });

    // count is called multiple times per repo; set up sequential returns for run/backlog/task repos
    repos.runRepo.count = jest.fn()
      .mockResolvedValueOnce(10)  // runsTotal
      .mockResolvedValueOnce(7)   // runsCompleted
      .mockResolvedValueOnce(1)   // runsRunning
      .mockResolvedValueOnce(2);  // runsFailed

    repos.backlogRepo.count = jest.fn()
      .mockResolvedValueOnce(6)   // backlogTotal
      .mockResolvedValueOnce(3)   // backlogOpen
      .mockResolvedValueOnce(2);  // backlogApproved

    repos.taskRepo.count = jest.fn()
      .mockResolvedValueOnce(4)   // tasksTotal
      .mockResolvedValueOnce(2)   // tasksDone
      .mockResolvedValueOnce(1);  // tasksInProgress

    const service = new DashboardService(
      repos.projectRepo, repos.sourceRepo, repos.runRepo,
      repos.moduleRepo, repos.routeRepo, repos.apiRepo,
      repos.schemaRepo, repos.uiRepo, repos.evidenceRepo,
      repos.backlogRepo, repos.taskRepo,
    );

    const result = await service.getProjectDashboard('p-1');

    expect(result.project.name).toBe('Copalite');
    expect(result.sources.total).toBe(3);
    expect(result.runs.total).toBe(10);
    expect(result.runs.completed).toBe(7);
    expect(result.runs.running).toBe(1);
    expect(result.runs.failed).toBe(2);
    expect(result.runs.recent).toHaveLength(1);
    expect(result.registries.modules).toBe(5);
    expect(result.registries.totalDiscovered).toBe(5 + 12 + 8 + 4 + 2);
    expect(result.evidence.total).toBe(7);
    expect(result.backlog.total).toBe(6);
    expect(result.backlog.open).toBe(3);
    expect(result.tasks.total).toBe(4);
    expect(result.tasks.done).toBe(2);
  });

  it('should handle empty project with zero counts', async () => {
    const repos = buildRepos({ projectExists: true });

    repos.runRepo.count = jest.fn().mockResolvedValue(0);
    repos.backlogRepo.count = jest.fn().mockResolvedValue(0);
    repos.taskRepo.count = jest.fn().mockResolvedValue(0);
    repos.runRepo.find = jest.fn().mockResolvedValue([]);

    const service = new DashboardService(
      repos.projectRepo, repos.sourceRepo, repos.runRepo,
      repos.moduleRepo, repos.routeRepo, repos.apiRepo,
      repos.schemaRepo, repos.uiRepo, repos.evidenceRepo,
      repos.backlogRepo, repos.taskRepo,
    );

    const result = await service.getProjectDashboard('p-1');

    expect(result.project.name).toBe('Copalite');
    expect(result.sources.total).toBe(0);
    expect(result.runs.total).toBe(0);
    expect(result.runs.recent).toEqual([]);
    expect(result.registries.totalDiscovered).toBe(0);
    expect(result.backlog.total).toBe(0);
    expect(result.tasks.total).toBe(0);
  });

  it('should throw NotFoundException when project does not exist', async () => {
    const repos = buildRepos({ projectExists: false });

    const service = new DashboardService(
      repos.projectRepo, repos.sourceRepo, repos.runRepo,
      repos.moduleRepo, repos.routeRepo, repos.apiRepo,
      repos.schemaRepo, repos.uiRepo, repos.evidenceRepo,
      repos.backlogRepo, repos.taskRepo,
    );

    await expect(service.getProjectDashboard('nonexistent')).rejects.toBeInstanceOf(NotFoundException);
  });
});
