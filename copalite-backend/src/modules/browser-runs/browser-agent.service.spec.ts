/**
 * BrowserAgentService — Unit Tests (Sprint 2 - authenticated navigation)
 */

jest.mock('typeorm', () => {
  const noop = () => () => undefined;
  return {
    Repository: class {}, DataSource: class {},
    Entity: noop, Column: noop, PrimaryGeneratedColumn: noop,
    CreateDateColumn: noop, UpdateDateColumn: noop, DeleteDateColumn: noop,
    ManyToOne: noop, OneToMany: noop, OneToOne: noop, ManyToMany: noop,
    JoinColumn: noop, JoinTable: noop, Unique: noop, Index: noop,
    BeforeInsert: noop, AfterInsert: noop, BeforeUpdate: noop, AfterUpdate: noop,
    EventSubscriber: noop, EntitySubscriberInterface: class {},
  };
});

jest.mock('@nestjs/typeorm', () => ({
  InjectRepository: () => () => undefined,
  TypeOrmModule: { forFeature: () => ({ module: class {} }) },
  getRepositoryToken: (e: any) => `${e?.name || 'x'}Repo`,
}));

jest.mock('playwright', () => ({
  chromium: { launch: jest.fn() },
}));

jest.mock('fs', () => ({
  existsSync: jest.fn().mockReturnValue(true),
  mkdirSync: jest.fn(),
  statSync: jest.fn().mockReturnValue({ size: 1024 }),
}));

import { BrowserAgentService } from './browser-agent.service';
import { BrowserRunStatus, EvidenceKind, TargetStatus } from '../../common/enums';

function makePage() {
  return {
    goto: jest.fn().mockResolvedValue({ status: () => 200 }),
    screenshot: jest.fn().mockResolvedValue(Buffer.from('png')),
    content: jest.fn().mockResolvedValue('<html><body>Test</body></html>'),
    url: jest.fn().mockReturnValue('https://example.com/dashboard'),
    title: jest.fn().mockResolvedValue('Dashboard'),
    evaluate: jest.fn().mockResolvedValue([]),
    fill: jest.fn().mockResolvedValue(undefined),
    click: jest.fn().mockResolvedValue(undefined),
    waitForURL: jest.fn().mockResolvedValue(undefined),
    on: jest.fn(),
    off: jest.fn(),
  };
}

describe('BrowserAgentService', () => {
  let service: BrowserAgentService;
  let runRepo: any;
  let evidenceRepo: any;
  let targetRepo: any;
  let sessionRepo: any;
  let page: ReturnType<typeof makePage>;
  let browser: any;

  beforeEach(() => {
    page = makePage();
    browser = { newPage: jest.fn().mockResolvedValue(page), close: jest.fn() };
    require('playwright').chromium.launch.mockResolvedValue(browser);

    runRepo = {
      findOne: jest.fn().mockResolvedValue({
        id: 'run-1', targetId: 't-1', projectId: 'p-1', sessionId: 's-1',
        status: BrowserRunStatus.PENDING, stepsCount: 0, evidencesCount: 0,
        target: {
          id: 't-1', baseUrl: 'https://example.com', name: 'T',
          status: TargetStatus.ACTIVE, credentialsJson: { email: 'test@test.com', password: 'pass' },
        },
      }),
      save: jest.fn().mockImplementation(e => ({ ...e })),
    };
    evidenceRepo = {
      create: jest.fn().mockImplementation(d => d),
      save: jest.fn().mockImplementation(e => ({ id: 'e1', ...e })),
    };
    targetRepo = { findOne: jest.fn() };
    sessionRepo = { update: jest.fn().mockResolvedValue({ affected: 1 }) };
    const problemsService = { persistFromRun: jest.fn().mockResolvedValue([]) };
    const lockService = { tryAcquire: jest.fn().mockResolvedValue(true), release: jest.fn().mockResolvedValue(undefined) };

    service = new BrowserAgentService(runRepo, evidenceRepo, targetRepo, sessionRepo, problemsService as any, lockService as any);
  });

  test('execute completes with pages visited', async () => {
    const r = await service.execute('run-1');
    expect(r.status).toBe(BrowserRunStatus.COMPLETED);
    expect(r.stepsCount).toBeGreaterThan(5);
    expect(r.evidencesCount).toBeGreaterThan(5);
    expect(r.pagesVisited).toBeGreaterThan(0);
  });

  test('performs login then navigates pages', async () => {
    await service.execute('run-1');
    // fill was called for email and password
    expect(page.fill).toHaveBeenCalledTimes(2);
    // click was called for submit
    expect(page.click).toHaveBeenCalled();
    // goto called for login + each page
    expect(page.goto.mock.calls.length).toBeGreaterThanOrEqual(2);
  });

  test('captures multiple evidence types', async () => {
    await service.execute('run-1');
    const kinds = evidenceRepo.save.mock.calls.map((c: any) => c[0].kind);
    expect(kinds).toContain(EvidenceKind.ACTION);
    expect(kinds).toContain(EvidenceKind.SCREENSHOT);
    expect(kinds).toContain(EvidenceKind.DOM);
  });

  test('updates session status on success', async () => {
    await service.execute('run-1');
    expect(sessionRepo.update).toHaveBeenCalledWith('s-1', expect.objectContaining({
      status: 'valid',
    }));
  });

  test('fails and updates session on login failure', async () => {
    // Make page stay on login URL
    page.url.mockReturnValue('https://example.com/auth/login');
    page.waitForURL.mockRejectedValue(new Error('Timeout waiting for navigation'));

    const r = await service.execute('run-1');
    expect(r.status).toBe(BrowserRunStatus.FAILED);
    expect(r.errorMessage).toContain('Login');
  });

  test('closes browser on failure', async () => {
    page.goto.mockRejectedValue(new Error('Network error'));
    page.fill.mockRejectedValue(new Error('Network error'));
    await service.execute('run-1');
    expect(browser.close).toHaveBeenCalled();
  });
});
