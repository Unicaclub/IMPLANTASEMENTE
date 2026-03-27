jest.mock('playwright', () => ({
  chromium: {
    launch: jest.fn().mockResolvedValue({
      newPage: jest.fn().mockResolvedValue({
        setContent: jest.fn(),
        pdf: jest.fn().mockResolvedValue(Buffer.from('fake-pdf')),
        close: jest.fn(),
      }),
      close: jest.fn(),
    }),
  },
}));
jest.mock('typeorm', () => {
  const noop = () => () => undefined;
  return {
    Repository: class {}, DataSource: class {},
    Entity: noop, Column: noop, PrimaryGeneratedColumn: noop,
    CreateDateColumn: noop, UpdateDateColumn: noop, DeleteDateColumn: noop,
    ManyToOne: noop, OneToMany: noop, JoinColumn: noop, Unique: noop,
  };
});
jest.mock('@nestjs/typeorm', () => ({
  InjectRepository: () => () => undefined,
  TypeOrmModule: { forFeature: () => ({ module: class {} }) },
}));

import { BrowserSpecsService } from './browser-specs.service';
import type { BrowserSpec } from './browser-specs.service';

function makeRun(overrides: any = {}) {
  return {
    id: 'run-1', targetId: 't-1', status: 'completed', journeyName: 'Test',
    startedAt: new Date(), finishedAt: new Date(), stepsCount: 10, evidencesCount: 5,
    errorMessage: null, target: { name: 'Local', id: 't-1' },
    ...overrides,
  };
}

function makeEvidence(route: string, kind: string) {
  return { id: 'e-' + Math.random(), browserRunId: 'run-1', stepIndex: 1, kind, route, action: 'test', createdAt: new Date() };
}

function makeProblem(route: string, severity: string, type: string) {
  return { id: 'p-' + Math.random(), browserRunId: 'run-1', type, severity, route, summary: 'test problem', fingerprint: 'fp1', createdAt: new Date() };
}

describe('BrowserSpecsService', () => {
  let service: BrowserSpecsService;
  let runRepo: any;
  let evidenceRepo: any;
  let problemRepo: any;
  let problemsService: any;

  beforeEach(() => {
    runRepo = { findOne: jest.fn() };
    evidenceRepo = { find: jest.fn() };
    problemRepo = { find: jest.fn() };
    const specRepo = { create: jest.fn().mockImplementation(d => d), save: jest.fn().mockImplementation(d => d), find: jest.fn().mockResolvedValue([]), findOne: jest.fn() };
    problemsService = { diffRuns: jest.fn(), findByRun: jest.fn() };
    service = new BrowserSpecsService(runRepo, evidenceRepo, problemRepo, specRepo as any, problemsService);
  });

  test('generates spec for run with clean pages', async () => {
    runRepo.findOne.mockResolvedValue(makeRun());
    evidenceRepo.find.mockResolvedValue([
      makeEvidence('/dashboard', 'screenshot'),
      makeEvidence('/dashboard', 'dom'),
      makeEvidence('/settings', 'screenshot'),
    ]);
    problemRepo.find.mockResolvedValue([]);

    const spec: BrowserSpec = await service.generateByRun('run-1');

    expect(spec.runSummary.status).toBe('completed');
    expect(spec.runSummary.problemsCount).toBe(0);
    expect(spec.pageSummaries.length).toBe(2);
    expect(spec.pageSummaries.every(p => p.assessment === 'healthy')).toBe(true);
    expect(spec.problemSummary.total).toBe(0);
    expect(spec.diffSummary).toBeNull();
    expect(spec.truthBoundaries.observedFacts.length).toBeGreaterThan(0);
    expect(spec.truthBoundaries.doNotClaim.length).toBeGreaterThan(0);
  });

  test('generates spec for run with problems', async () => {
    runRepo.findOne.mockResolvedValue(makeRun());
    evidenceRepo.find.mockResolvedValue([
      makeEvidence('/dashboard', 'screenshot'),
      makeEvidence('/api-page', 'screenshot'),
    ]);
    problemRepo.find.mockResolvedValue([
      makeProblem('/api-page', 'high', 'console_error'),
      makeProblem('/api-page', 'medium', 'request_failed'),
    ]);

    const spec = await service.generateByRun('run-1');

    expect(spec.runSummary.problemsCount).toBe(2);
    expect(spec.runSummary.maxSeverity).toBe('high');
    expect(spec.problemSummary.bySeverity.high).toBe(1);
    expect(spec.problemSummary.bySeverity.medium).toBe(1);

    const apiPage = spec.pageSummaries.find(p => p.route === '/api-page');
    expect(apiPage?.assessment).toBe('degraded');
    expect(apiPage?.maxSeverity).toBe('high');
    expect(apiPage?.problemTypes).toContain('console_error');
  });

  test('includes diff when baseRunId provided', async () => {
    runRepo.findOne.mockResolvedValue(makeRun());
    evidenceRepo.find.mockResolvedValue([makeEvidence('/dashboard', 'screenshot')]);
    problemRepo.find.mockResolvedValue([makeProblem('/dashboard', 'medium', 'console_error')]);
    problemsService.diffRuns.mockResolvedValue({
      newProblems: [makeProblem('/new-page', 'high', 'response_5xx')],
      resolvedProblems: [makeProblem('/old-page', 'medium', 'console_error'), makeProblem('/old-page2', 'low', 'request_failed')],
      persistentProblems: [makeProblem('/dashboard', 'medium', 'console_error')],
      summary: { totalA: 3, totalB: 2, new: 1, resolved: 2, persistent: 1 },
    });

    const spec = await service.generateByRun('run-1', 'run-0');

    expect(spec.diffSummary).not.toBeNull();
    expect(spec.diffSummary!.newCount).toBe(1);
    expect(spec.diffSummary!.resolvedCount).toBe(2);
    expect(spec.diffSummary!.assessment).toBe('improved');
    expect(spec.diffSummary!.impactedRoutes.length).toBeGreaterThan(0);
  });

  test('truth boundaries are honest for partial coverage', async () => {
    runRepo.findOne.mockResolvedValue(makeRun());
    evidenceRepo.find.mockResolvedValue([makeEvidence('/dashboard', 'screenshot')]);
    problemRepo.find.mockResolvedValue([]);

    const spec = await service.generateByRun('run-1');

    expect(spec.truthBoundaries.unknowns.some(u => u.includes('paginas foram visitadas'))).toBe(true);
    expect(spec.truthBoundaries.doNotClaim.some(d => d.includes('totalmente saudavel'))).toBe(true);
    expect(spec.truthBoundaries.inferredPoints.some(i => i.includes('nao garante'))).toBe(true);
  });

  test('does not claim broken without critical severity', async () => {
    runRepo.findOne.mockResolvedValue(makeRun());
    evidenceRepo.find.mockResolvedValue([makeEvidence('/page', 'dom')]);
    problemRepo.find.mockResolvedValue([makeProblem('/page', 'low', 'request_failed')]);

    const spec = await service.generateByRun('run-1');

    const pg = spec.pageSummaries.find(p => p.route === '/page');
    expect(pg?.assessment).toBe('warning');
    expect(pg?.assessment).not.toBe('broken');
  });
});
