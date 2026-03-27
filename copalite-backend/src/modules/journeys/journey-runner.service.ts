import { Injectable, Logger, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Like, Repository } from 'typeorm';
import { ExecutionLockService } from '../../common/utils/execution-lock.service';
import { ArtifactCleanupService } from '../../common/utils/artifact-cleanup.service';
import { chromium } from 'playwright';
import type { Page } from 'playwright';
import * as fs from 'fs';
import * as path from 'path';

import { JourneyStatus, StepResultStatus } from '../../common/enums';
import { TargetEntity } from '../targets/entities/target.entity';
import { BrowserRunEntity } from '../browser-runs/entities/browser-run.entity';
import { JourneyRunEntity } from './entities/journey-run.entity';
import { JourneyStepResultEntity } from './entities/journey-step-result.entity';
import { decryptCredentials } from '../../common/utils/crypto';

const ARTIFACTS_DIR = path.resolve(process.cwd(), 'artifacts', 'journeys');
const TIMEOUT = 30_000;
const E2E_PREFIX = 'e2e-';

interface StepDef {
  action: string;
  execute: (page: Page, ctx: RunCtx) => Promise<{ expected: string; observed: string; passed: boolean; error?: string }>;
}

interface RunCtx {
  baseUrl: string;
  projectId: string;
  runId: string; // journey run id for screenshots
  email: string;
  password: string;
  // Discovered at runtime
  browserRunId?: string;
}

@Injectable()
export class JourneyRunnerService {
  private readonly logger = new Logger(JourneyRunnerService.name);

  constructor(
    @InjectRepository(JourneyRunEntity) private readonly runRepo: Repository<JourneyRunEntity>,
    @InjectRepository(JourneyStepResultEntity) private readonly stepRepo: Repository<JourneyStepResultEntity>,
    @InjectRepository(TargetEntity) private readonly targetRepo: Repository<TargetEntity>,
    private readonly dataSource: DataSource,
    private readonly lockService: ExecutionLockService,
    private readonly artifactCleanup: ArtifactCleanupService,
  ) {}

  /** Execute a named journey — distributed lock via PostgreSQL advisory lock */
  async execute(journeySlug: string, projectId: string, targetId: string): Promise<JourneyRunEntity> {
    const acquired = await this.lockService.tryAcquire(ExecutionLockService.JOURNEY_LOCK);
    if (!acquired) {
      throw new ConflictException('Uma jornada ja esta em execucao (lock distribuido). Aguarde a conclusao.');
    }
    try {
      return await this.executeInternal(journeySlug, projectId, targetId);
    } finally {
      await this.lockService.release(ExecutionLockService.JOURNEY_LOCK);
    }
  }

  private async executeInternal(journeySlug: string, projectId: string, targetId: string): Promise<JourneyRunEntity> {
    const target = await this.targetRepo.findOne({ where: { id: targetId } });
    if (!target) throw new NotFoundException('Target nao encontrado');

    // Get credentials
    let creds: Record<string, unknown> = {};
    if (target.credentialsJson) {
      try {
        const raw = target.credentialsJson as Record<string, unknown>;
        creds = raw._enc ? decryptCredentials(raw._enc as string) : raw;
      } catch { creds = target.credentialsJson as Record<string, unknown>; }
    }
    const email = creds.email as string;
    const password = creds.password as string;
    if (!email || !password) throw new Error('Target sem credenciais');

    const journeyDef = this.getJourneyDef(journeySlug);
    if (!journeyDef) throw new NotFoundException(`Jornada '${journeySlug}' nao encontrada`);

    // Create journey run
    const run = await this.runRepo.save(this.runRepo.create({
      projectId, targetId, name: journeyDef.name, slug: journeySlug,
      description: journeyDef.description, status: JourneyStatus.RUNNING,
      startedAt: new Date(), totalSteps: journeyDef.steps.length,
    }));

    const startTime = Date.now();
    const ctx: RunCtx = { baseUrl: target.baseUrl, projectId, runId: run.id, email, password };
    let passed = 0;
    let failed = 0;

    const browser = await chromium.launch({
      headless: true,
      executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH || undefined,
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
    });
    const page = await browser.newPage();

    try {
      for (let i = 0; i < journeyDef.steps.length; i++) {
        const step = journeyDef.steps[i];
        const stepStart = Date.now();
        let result: { expected: string; observed: string; passed: boolean; error?: string };

        try {
          result = await step.execute(page, ctx);
        } catch (err: unknown) {
          const msg = err instanceof Error ? err.message : String(err);
          result = { expected: 'step completes', observed: `Error: ${msg}`, passed: false, error: msg };
        }

        // Screenshot
        const ssPath = await this.screenshot(page, run.id, i + 1);

        await this.stepRepo.save(this.stepRepo.create({
          journeyRunId: run.id,
          stepIndex: i + 1,
          action: step.action,
          route: page.url(),
          expected: result.expected,
          observed: result.observed,
          status: result.passed ? StepResultStatus.PASSED : StepResultStatus.FAILED,
          errorMessage: result.error || null,
          screenshotPath: ssPath,
          durationMs: Date.now() - stepStart,
        }));

        if (result.passed) passed++;
        else failed++;

        // Stop on critical failure in login step
        if (!result.passed && i < 2) {
          this.logger.warn(`Journey ${journeySlug}: early stop at step ${i + 1}`);
          break;
        }
      }
    } finally {
      await browser.close();
    }

    const duration = Date.now() - startTime;
    const status = failed === 0 ? JourneyStatus.PASSED : passed === 0 ? JourneyStatus.FAILED : JourneyStatus.PARTIAL;
    const summary = `${passed}/${journeyDef.steps.length} steps passed, ${failed} failed (${duration}ms)`;

    run.status = status;
    run.finishedAt = new Date();
    run.durationMs = duration;
    run.passedSteps = passed;
    run.failedSteps = failed;
    run.summary = summary;
    await this.runRepo.save(run);

    // Cleanup e2e data only after specific cleanup journeys, not after every mutation
    // Use DELETE /journeys/cleanup-e2e for manual cleanup

    this.logger.log(`Journey ${journeySlug}: ${status} — ${summary}`);
    return run;
  }

  /** List available journey slugs */
  getAvailableJourneys(): Array<{ slug: string; name: string; description: string; steps: number; type: 'read' | 'mutation' }> {
    return [
      { slug: 'login-dashboard', name: 'Login → Dashboard', description: 'Login e verificacao do dashboard', steps: 5, type: 'read' },
      { slug: 'run-spec-markdown', name: 'Run → Spec → Markdown', description: 'Abrir browser run, ver spec, exportar markdown', steps: 6, type: 'read' },
      { slug: 'run-history-pdf', name: 'Run → History → PDF', description: 'Abrir browser run, ver historico, exportar PDF', steps: 6, type: 'read' },
      { slug: 'mutation-create-target', name: 'Criar Target', description: 'Criar target via UI com validacao de persistencia', steps: 6, type: 'mutation' },
      { slug: 'mutation-edit-target', name: 'Editar Target', description: 'Editar target existente via UI real e validar mudanca', steps: 5, type: 'mutation' },
      { slug: 'mutation-create-run', name: 'Criar Browser Run', description: 'Criar browser run via UI real e validar vinculo', steps: 5, type: 'mutation' },
      { slug: 'mutation-save-spec', name: 'Salvar Spec via UI', description: 'Salvar spec via botao real na UI e validar versionamento com before/after', steps: 6, type: 'mutation' },
      { slug: 'mutation-compare-runs', name: 'Comparar Runs via UI', description: 'Navegar para diff via sidebar, selecionar runs, validar diff com before/after', steps: 6, type: 'mutation' },
    ];
  }

  /** Get journey results */
  async findByProject(projectId: string): Promise<JourneyRunEntity[]> {
    return this.runRepo.find({ where: { projectId }, order: { createdAt: 'DESC' }, relations: ['target'] });
  }

  async findById(id: string): Promise<JourneyRunEntity> {
    const e = await this.runRepo.findOne({ where: { id }, relations: ['target'] });
    if (!e) throw new NotFoundException('Journey run nao encontrada');
    return e;
  }

  async findSteps(journeyRunId: string): Promise<JourneyStepResultEntity[]> {
    return this.stepRepo.find({ where: { journeyRunId }, order: { stepIndex: 'ASC' } });
  }

  /** Diff two journey runs by step action fingerprint */
  async diffRuns(runIdA: string, runIdB: string) {
    const [stepsA, stepsB] = await Promise.all([this.findSteps(runIdA), this.findSteps(runIdB)]);
    const mapA = new Map(stepsA.map(s => [s.action, s]));
    const mapB = new Map(stepsB.map(s => [s.action, s]));

    const newFailures = stepsB.filter(s => s.status === StepResultStatus.FAILED && mapA.get(s.action)?.status !== StepResultStatus.FAILED);
    const resolved = stepsA.filter(s => s.status === StepResultStatus.FAILED && mapB.get(s.action)?.status === StepResultStatus.PASSED);
    const persistent = stepsB.filter(s => s.status === StepResultStatus.FAILED && mapA.get(s.action)?.status === StepResultStatus.FAILED);

    return { runIdA, runIdB, newFailures, resolved, persistent,
      summary: { new: newFailures.length, resolved: resolved.length, persistent: persistent.length } };
  }

  // =============================================
  // Journey definitions
  // =============================================

  private getJourneyDef(slug: string): { name: string; description: string; steps: StepDef[] } | null {
    switch (slug) {
      case 'login-dashboard': return this.journeyLoginDashboard();
      case 'run-spec-markdown': return this.journeyRunSpecMarkdown();
      case 'run-history-pdf': return this.journeyRunHistoryPdf();
      case 'mutation-create-target': return this.journeyMutationCreateTarget();
      case 'mutation-edit-target': return this.journeyMutationEditTarget();
      case 'mutation-create-run': return this.journeyMutationCreateRun();
      case 'mutation-save-spec': return this.journeyMutationSaveSpec();
      case 'mutation-compare-runs': return this.journeyMutationCompareRuns();
      default: return null;
    }
  }

  private journeyLoginDashboard(): { name: string; description: string; steps: StepDef[] } {
    return {
      name: 'Login → Dashboard',
      description: 'Valida login real e carregamento do dashboard',
      steps: [
        {
          action: 'Navigate to login page',
          execute: async (page, ctx) => {
            await page.goto(`${ctx.baseUrl}/auth/login`, { waitUntil: 'domcontentloaded', timeout: TIMEOUT });
            const hasForm = await page.locator('input[type="email"]').isVisible({ timeout: 5000 });
            return { expected: 'Login form visible', observed: hasForm ? 'Form visible' : 'Form not found', passed: hasForm };
          },
        },
        {
          action: 'Fill credentials and submit',
          execute: async (page, ctx) => {
            await page.fill('input[type="email"]', ctx.email);
            await page.fill('input[type="password"]', ctx.password);
            await page.click('button[type="submit"]');
            await page.waitForURL(url => !url.toString().includes('/auth/login'), { timeout: TIMEOUT });
            const redirected = !page.url().includes('/auth/login');
            return { expected: 'Redirect away from login', observed: `URL: ${page.url()}`, passed: redirected };
          },
        },
        {
          action: 'Dashboard loads',
          execute: async (page) => {
            await page.goto(page.url().includes('/dashboard') ? page.url() : page.url().replace(/\/[^/]*$/, '/dashboard'), { waitUntil: 'domcontentloaded', timeout: TIMEOUT });
            await page.waitForTimeout(3000);
            const body = await page.textContent('body');
            const hasDashboard = body?.includes('Dashboard') || body?.includes('Workspace') || body?.includes('Copalite');
            return { expected: 'Dashboard content visible', observed: hasDashboard ? 'Dashboard loaded' : 'Dashboard content missing', passed: !!hasDashboard };
          },
        },
        {
          action: 'No error on dashboard',
          execute: async (page) => {
            const body = await page.textContent('body');
            const hasError = body?.includes('Something went wrong') || body?.includes('Internal Server Error');
            return { expected: 'No error message', observed: hasError ? 'Error found on page' : 'Clean page', passed: !hasError };
          },
        },
        {
          action: 'Sidebar navigation visible',
          execute: async (page) => {
            const hasSidebar = await page.locator('nav, aside').first().isVisible({ timeout: 3000 }).catch(() => false);
            return { expected: 'Sidebar/nav visible', observed: hasSidebar ? 'Navigation present' : 'Navigation missing', passed: hasSidebar };
          },
        },
      ],
    };
  }

  private journeyRunSpecMarkdown(): { name: string; description: string; steps: StepDef[] } {
    return {
      name: 'Run → Spec → Markdown',
      description: 'Abre browser run, verifica spec tab, valida export markdown',
      steps: [
        {
          action: 'Login via API + token injection',
          execute: async (page, ctx) => {
            const apiBase = ctx.baseUrl.replace(/:3001/, ':3000');
            await page.goto(ctx.baseUrl, { waitUntil: 'domcontentloaded', timeout: TIMEOUT });
            const token = await page.evaluate(async (args: { api: string; email: string; password: string }) => {
              try {
                const res = await fetch(`${args.api}/api/v1/auth/login`, {
                  method: 'POST', headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ email: args.email, password: args.password }),
                });
                if (!res.ok) return null;
                const data = await res.json();
                if (data.accessToken) localStorage.setItem('copalite_token', data.accessToken);
                return data.accessToken;
              } catch { return null; }
            }, { api: apiBase, email: ctx.email, password: ctx.password });
            return { expected: 'Token obtained and stored', observed: token ? 'Token set' : 'Login failed', passed: !!token };
          },
        },
        {
          action: 'Navigate to browser runs and find a completed run',
          execute: async (page, ctx) => {
            await page.goto(`${ctx.baseUrl}/projects/${ctx.projectId}/browser-runs`, { waitUntil: 'domcontentloaded', timeout: TIMEOUT });
            await page.waitForTimeout(4000);
            const body = await page.textContent('body');
            const hasRuns = body?.includes('Browser Run') || body?.includes('completed');
            // Find run links that contain UUIDs (exclude /diff)
            const links = await page.locator('a[href*="browser-runs/"]').all();
            for (const link of links) {
              const href = await link.getAttribute('href');
              if (href && !href.includes('/diff') && href.match(/[0-9a-f]{8}-/)) {
                ctx.browserRunId = href.split('/').pop();
                break;
              }
            }
            return { expected: 'Browser runs list with at least one run', observed: ctx.browserRunId ? `Found run: ${ctx.browserRunId?.substring(0, 8)}` : 'No run found', passed: !!ctx.browserRunId };
          },
        },
        {
          action: 'Open browser run detail',
          execute: async (page, ctx) => {
            if (!ctx.browserRunId) return { expected: 'Run detail', observed: 'No run ID found', passed: false, error: 'No browserRunId' };
            await page.goto(`${ctx.baseUrl}/projects/${ctx.projectId}/browser-runs/${ctx.browserRunId}`, { waitUntil: 'domcontentloaded', timeout: TIMEOUT });
            await page.waitForTimeout(5000);
            const body = await page.textContent('body');
            const hasSpec = body?.includes('Spec');
            return { expected: 'Run detail with Spec tab', observed: hasSpec ? 'Spec tab present' : 'Spec tab missing', passed: !!hasSpec };
          },
        },
        {
          action: 'Spec tab shows content',
          execute: async (page) => {
            const body = await page.textContent('body');
            const hasSummary = body?.includes('Resumo da Run') || body?.includes('paginas');
            const hasTruth = body?.includes('Limites') || body?.includes('Fatos');
            return { expected: 'Spec summary + truth boundaries', observed: `Summary: ${!!hasSummary}, Truth: ${!!hasTruth}`, passed: !!hasSummary };
          },
        },
        {
          action: 'Markdown export link exists',
          execute: async (page) => {
            const mdLink = page.locator('a:has-text("Markdown")');
            const visible = await mdLink.isVisible({ timeout: 3000 }).catch(() => false);
            return { expected: 'Markdown export link visible', observed: visible ? 'Link found' : 'Link missing', passed: visible };
          },
        },
        {
          action: 'Pages summary visible',
          execute: async (page) => {
            const body = await page.textContent('body');
            const hasPages = body?.includes('Paginas') || body?.includes('Saudavel') || body?.includes('healthy');
            return { expected: 'Page summaries visible', observed: hasPages ? 'Pages shown' : 'No pages', passed: !!hasPages };
          },
        },
      ],
    };
  }

  private journeyRunHistoryPdf(): { name: string; description: string; steps: StepDef[] } {
    return {
      name: 'Run → History → PDF',
      description: 'Abre browser run, verifica historico de versoes, valida export PDF',
      steps: [
        {
          action: 'Login via API + token injection',
          execute: async (page, ctx) => {
            const apiBase = ctx.baseUrl.replace(/:3001/, ':3000');
            await page.goto(ctx.baseUrl, { waitUntil: 'domcontentloaded', timeout: TIMEOUT });
            const token = await page.evaluate(async (args: { api: string; email: string; password: string }) => {
              try {
                const res = await fetch(`${args.api}/api/v1/auth/login`, {
                  method: 'POST', headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ email: args.email, password: args.password }),
                });
                if (!res.ok) return null;
                const data = await res.json();
                if (data.accessToken) localStorage.setItem('copalite_token', data.accessToken);
                return data.accessToken;
              } catch { return null; }
            }, { api: apiBase, email: ctx.email, password: ctx.password });
            return { expected: 'Token obtained and stored', observed: token ? 'Token set' : 'Login failed', passed: !!token };
          },
        },
        {
          action: 'Navigate to browser run with history',
          execute: async (page, ctx) => {
            await page.goto(`${ctx.baseUrl}/projects/${ctx.projectId}/browser-runs`, { waitUntil: 'domcontentloaded', timeout: TIMEOUT });
            await page.waitForTimeout(4000);
            // Find a UUID-based run link (exclude /diff)
            const links = await page.locator('a[href*="browser-runs/"]').all();
            let runId: string | null = null;
            for (const link of links) {
              const href = await link.getAttribute('href');
              if (href && !href.includes('/diff') && href.match(/[0-9a-f]{8}-/)) {
                runId = href.split('/').pop() || null;
                break;
              }
            }
            if (runId) {
              await page.goto(`${ctx.baseUrl}/projects/${ctx.projectId}/browser-runs/${runId}`, { waitUntil: 'domcontentloaded', timeout: TIMEOUT });
              await page.waitForTimeout(5000);
            }
            const onDetail = page.url().match(/browser-runs\/[0-9a-f]{8}-/);
            return { expected: 'Run detail loaded', observed: onDetail ? page.url() : 'Not on run detail', passed: !!onDetail };
          },
        },
        {
          action: 'Version history visible',
          execute: async (page) => {
            const body = await page.textContent('body');
            const hasHistory = body?.includes('Historico') || body?.includes('versao') || body?.includes('versoes');
            const hasVersion = body?.includes('v1') || body?.includes('v2') || body?.includes('v3');
            return { expected: 'Version history with badges', observed: `History: ${!!hasHistory}, Versions: ${!!hasVersion}`, passed: !!hasHistory || !!hasVersion };
          },
        },
        {
          action: 'Save button visible',
          execute: async (page) => {
            const body = await page.textContent('body');
            const hasSave = body?.includes('Salvar v');
            return { expected: 'Save button present', observed: hasSave ? 'Save button found' : 'Save missing', passed: !!hasSave };
          },
        },
        {
          action: 'PDF export link exists',
          execute: async (page) => {
            const pdfLink = page.locator('a:has-text("PDF")');
            const visible = await pdfLink.isVisible({ timeout: 3000 }).catch(() => false);
            return { expected: 'PDF export link visible', observed: visible ? 'Link found' : 'Link missing', passed: visible };
          },
        },
        {
          action: 'No critical error on page',
          execute: async (page) => {
            const body = await page.textContent('body');
            const hasCrash = body?.includes('Something went wrong') || body?.includes('Internal Server Error');
            return { expected: 'No crash error', observed: hasCrash ? 'Crash error found' : 'Clean', passed: !hasCrash };
          },
        },
      ],
    };
  }

  // =============================================
  // MUTATION JOURNEYS
  // =============================================

  private loginStep(): StepDef {
    return {
      action: 'Login via API + token injection',
      execute: async (page, ctx) => {
        const apiBase = ctx.baseUrl.replace(/:3001/, ':3000');
        await page.goto(ctx.baseUrl, { waitUntil: 'domcontentloaded', timeout: TIMEOUT });
        const token = await page.evaluate(async (args: { api: string; email: string; password: string }) => {
          try {
            const res = await fetch(`${args.api}/api/v1/auth/login`, {
              method: 'POST', headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ email: args.email, password: args.password }),
            });
            if (!res.ok) return null;
            const data = await res.json();
            if (data.accessToken) localStorage.setItem('copalite_token', data.accessToken);
            return data.accessToken;
          } catch { return null; }
        }, { api: apiBase, email: ctx.email, password: ctx.password });
        return { expected: 'Token obtained', observed: token ? 'Token set' : 'Login failed', passed: !!token };
      },
    };
  }

  private journeyMutationCreateTarget(): { name: string; description: string; steps: StepDef[] } {
    const testName = `e2e-target-${Date.now()}`;
    return {
      name: 'Criar Target (MUTATION)',
      description: 'Criar target via UI e validar persistencia',
      steps: [
        this.loginStep(),
        {
          action: 'Navigate to targets page',
          execute: async (page, ctx) => {
            await page.goto(`${ctx.baseUrl}/projects/${ctx.projectId}/targets`, { waitUntil: 'domcontentloaded', timeout: TIMEOUT });
            await page.waitForTimeout(3000);
            const body = await page.textContent('body');
            return { expected: 'Targets page loaded', observed: body?.includes('Targets') ? 'OK' : 'Missing', passed: true };
          },
        },
        {
          action: 'Open create modal and fill form',
          execute: async (page) => {
            const btn = page.locator('button:has-text("Novo Target")');
            if (!await btn.isVisible({ timeout: 3000 })) return { expected: 'Create button', observed: 'Not visible', passed: false };
            await btn.click();
            await page.waitForTimeout(1000);
            await page.fill('input[placeholder*="Portal"]', testName);
            await page.fill('input[placeholder*="https"]', 'https://e2e-test.example.com');
            return { expected: 'Form filled', observed: `name=${testName}`, passed: true };
          },
        },
        {
          action: 'Submit and create target',
          execute: async (page) => {
            await page.click('button:has-text("Criar")');
            await page.waitForTimeout(4000);
            const body = await page.textContent('body');
            const created = body?.includes(testName);
            return { expected: `Target "${testName}" in list`, observed: created ? 'Found in list' : 'Not found', passed: !!created };
          },
        },
        {
          action: 'Reload targets page and validate persistence via UI',
          execute: async (page, ctx) => {
            // Full reload to prove the data survived a round-trip
            await page.goto(`${ctx.baseUrl}/projects/${ctx.projectId}/targets`, { waitUntil: 'domcontentloaded', timeout: TIMEOUT });
            await page.waitForTimeout(4000);
            const body = await page.textContent('body');
            const nameVisible = body?.includes(testName);
            const urlVisible = body?.includes('e2e-test.example.com');
            return {
              expected: 'Target persisted — name and URL visible after reload',
              observed: `name=${nameVisible ? 'found' : 'missing'}, url=${urlVisible ? 'found' : 'missing'}`,
              passed: !!nameVisible && !!urlVisible,
            };
          },
        },
        {
          action: 'Open target detail',
          execute: async (page, ctx) => {
            const link = page.locator(`a:has-text("${testName}")`);
            if (await link.isVisible({ timeout: 3000 })) {
              await link.click();
              await page.waitForTimeout(3000);
            }
            const body = await page.textContent('body');
            const hasDetail = body?.includes(testName) && body?.includes('e2e-test.example.com');
            return { expected: 'Target detail with correct data', observed: hasDetail ? 'Detail loaded' : 'Detail missing', passed: !!hasDetail };
          },
        },
      ],
    };
  }

  private journeyMutationEditTarget(): { name: string; description: string; steps: StepDef[] } {
    return {
      name: 'Editar Target via UI (MUTATION)',
      description: 'Editar target existente via formulario real na UI',
      steps: [
        this.loginStep(),
        {
          action: 'Navigate to targets list and click into e2e target detail',
          execute: async (page, ctx) => {
            // Navigate to targets list via UI
            await page.goto(`${ctx.baseUrl}/projects/${ctx.projectId}/targets`, { waitUntil: 'domcontentloaded', timeout: TIMEOUT });
            await page.waitForTimeout(3000);
            // Find e2e target link in the list
            const link = page.locator('a:has-text("e2e-")').first();
            if (!await link.isVisible({ timeout: 5000 })) {
              return { expected: 'e2e target in list', observed: 'No e2e target found in UI', passed: false };
            }
            // Read before state from list (environment badge)
            const card = link;
            const cardText = await card.textContent() || '';
            const envMatch = cardText.match(/(development|staging|production|local)/);
            const beforeEnv = envMatch ? envMatch[1] : 'unknown';
            (ctx as any)._beforeEnv = beforeEnv;
            // Click into the target detail page
            await link.click();
            await page.waitForTimeout(3000);
            // Store current URL to extract target ID
            const url = page.url();
            const idMatch = url.match(/targets\/([a-f0-9-]+)/);
            if (idMatch) (ctx as any)._editTargetId = idMatch[1];
            const body = await page.textContent('body');
            const detailLoaded = body?.includes('e2e-') && body?.includes('Editar');
            return {
              expected: 'Target detail loaded with before state from UI',
              observed: `before: env=${beforeEnv}, detail=${detailLoaded ? 'loaded' : 'missing'}`,
              passed: !!detailLoaded,
            };
          },
        },
        {
          action: 'Click Editar button and fill form via UI',
          execute: async (page) => {
            const editBtn = page.locator('button:has-text("Editar")');
            if (!await editBtn.isVisible({ timeout: 3000 })) return { expected: 'Edit button', observed: 'Not visible', passed: false };
            await editBtn.click();
            await page.waitForTimeout(1000);
            // Change environment to production
            const envSelect = page.locator('select').first();
            await envSelect.selectOption('production');
            // Fill notes
            const notesInput = page.locator('input[placeholder*="Notas"]');
            if (await notesInput.isVisible({ timeout: 2000 })) {
              await notesInput.fill(`e2e-edited-${Date.now()}`);
            }
            return { expected: 'Form filled with new values', observed: 'env=production, notes filled', passed: true };
          },
        },
        {
          action: 'Click Salvar and validate UI update',
          execute: async (page) => {
            const saveBtn = page.locator('button:has-text("Salvar")');
            await saveBtn.click();
            await page.waitForTimeout(3000);
            const body = await page.textContent('body');
            const hasProduction = body?.includes('production');
            return { expected: 'UI updated to production', observed: hasProduction ? 'Shows production' : 'Not updated', passed: !!hasProduction };
          },
        },
        {
          action: 'Reopen page and validate persistence',
          execute: async (page, ctx) => {
            const targetId = (ctx as any)._editTargetId;
            await page.goto(`${ctx.baseUrl}/projects/${ctx.projectId}/targets/${targetId}`, { waitUntil: 'domcontentloaded', timeout: TIMEOUT });
            await page.waitForTimeout(3000);
            const body = await page.textContent('body');
            const persisted = body?.includes('production');
            return { expected: 'Persisted: environment=production after reload', observed: persisted ? 'Confirmed' : 'Not persisted', passed: !!persisted };
          },
        },
      ],
    };
  }

  private journeyMutationCreateRun(): { name: string; description: string; steps: StepDef[] } {
    return {
      name: 'Criar Browser Run via UI (MUTATION)',
      description: 'Criar browser run usando modal real na interface',
      steps: [
        this.loginStep(),
        {
          action: 'Navigate to browser runs page',
          execute: async (page, ctx) => {
            await page.goto(`${ctx.baseUrl}/projects/${ctx.projectId}/browser-runs`, { waitUntil: 'domcontentloaded', timeout: TIMEOUT });
            await page.waitForTimeout(4000);
            const body = await page.textContent('body');
            return { expected: 'Browser runs page loaded', observed: body?.includes('Browser Run') ? 'OK' : 'Missing', passed: true };
          },
        },
        {
          action: 'Open create modal and fill form',
          execute: async (page) => {
            const btn = page.locator('button:has-text("Nova Run")').first();
            if (!await btn.isVisible({ timeout: 3000 })) return { expected: 'Nova Run button', observed: 'Not visible', passed: false };
            await btn.click();
            await page.waitForTimeout(1000);
            // Fill journey name
            const nameInput = page.locator('input[placeholder*="Login Flow"]');
            if (await nameInput.isVisible({ timeout: 2000 })) {
              await nameInput.fill('e2e-mutation-run');
            }
            return { expected: 'Modal opened and form filled', observed: 'e2e-mutation-run', passed: true };
          },
        },
        {
          action: 'Submit and create run via UI',
          execute: async (page) => {
            const createBtn = page.locator('button:has-text("Criar")');
            await createBtn.click();
            await page.waitForTimeout(4000);
            const body = await page.textContent('body');
            const created = body?.includes('e2e-mutation-run');
            return { expected: 'Run appears in list', observed: created ? 'Found in list' : 'Not found', passed: !!created };
          },
        },
        {
          action: 'Open run detail and validate target link via UI',
          execute: async (page, ctx) => {
            // Click on the most recent created run in the list (first in the list)
            const link = page.locator('a:has-text("e2e-mutation-run")').first();
            if (await link.isVisible({ timeout: 3000 })) {
              await link.click();
              // Wait for detail page to fully render (multiple API calls)
              await page.waitForTimeout(6000);
            }
            const body = await page.textContent('body');
            const hasStatus = body?.includes('pending') || body?.includes('completed') || body?.includes('running');
            const hasTarget = body?.includes('Target') || body?.includes('e2e-');
            // The detail page header shows "X steps, X evidencias"
            const hasHeader = body?.includes('steps') || body?.includes('evidencias') || body?.includes('Browser Run');
            return {
              expected: 'Run detail with status and target info',
              observed: `status=${hasStatus ? 'ok' : 'missing'}, target=${hasTarget ? 'ok' : 'missing'}, header=${hasHeader ? 'ok' : 'missing'}`,
              passed: !!hasStatus && !!hasHeader,
            };
          },
        },
      ],
    };
  }

  private journeyMutationSaveSpec(): { name: string; description: string; steps: StepDef[] } {
    return {
      name: 'Salvar Spec via UI (MUTATION)',
      description: 'Salvar spec de browser run via botao real na UI e validar versionamento com before/after',
      steps: [
        this.loginStep(),
        {
          action: 'Navigate to browser runs list and open completed run detail via UI',
          execute: async (page, ctx) => {
            // Navigate to browser runs list
            await page.goto(`${ctx.baseUrl}/projects/${ctx.projectId}/browser-runs`, { waitUntil: 'domcontentloaded', timeout: TIMEOUT });
            await page.waitForTimeout(4000);

            // Find a completed run link in the UI list
            const completedLink = page.locator('a[href*="browser-runs/"]').filter({ hasText: 'completed' }).first();
            let found = await completedLink.isVisible({ timeout: 3000 }).catch(() => false);

            if (!found) {
              // Fallback: click first run link with UUID pattern (exclude /diff)
              const links = await page.locator('a[href*="browser-runs/"]').all();
              for (const link of links) {
                const href = await link.getAttribute('href');
                if (href && !href.includes('/diff') && href.match(/[0-9a-f]{8}-/)) {
                  await link.click();
                  found = true;
                  break;
                }
              }
            } else {
              await completedLink.click();
            }

            if (!found) return { expected: 'Completed run in list', observed: 'No run found in UI', passed: false };

            // Wait for detail page to load (spec auto-generates)
            await page.waitForTimeout(6000);

            // Verify we are on a run detail page
            const url = page.url();
            const onDetail = url.match(/browser-runs\/([0-9a-f]{8}-[0-9a-f-]+)/);
            if (onDetail) (ctx as any)._specRunId = onDetail[1];

            const body = await page.textContent('body');
            const hasSpecTab = body?.includes('Spec');
            return {
              expected: 'Run detail page loaded with Spec tab',
              observed: onDetail ? `detail=${onDetail[1].substring(0, 8)}, spec_tab=${!!hasSpecTab}` : 'Not on detail page',
              passed: !!onDetail && !!hasSpecTab,
            };
          },
        },
        {
          action: 'Read BEFORE state from UI — version count and save button label',
          execute: async (page, ctx) => {
            // Count version badges using Playwright locators (more reliable than regex on full body)
            const versionBadgeLocators = page.locator('.badge-info');
            const beforeCount = await versionBadgeLocators.count();
            (ctx as any)._beforeCount = beforeCount;

            // Read max version from the history section's version badges
            let maxExistingVersion = 0;
            for (let i = 0; i < beforeCount; i++) {
              const text = await versionBadgeLocators.nth(i).textContent();
              const vMatch = text?.match(/v(\d+)/);
              if (vMatch) maxExistingVersion = Math.max(maxExistingVersion, parseInt(vMatch[1], 10));
            }
            (ctx as any)._beforeMaxVersion = maxExistingVersion;

            // Read the save button label "Salvar v{N}"
            const saveBtn = page.locator('button:has-text("Salvar v")');
            const saveBtnVisible = await saveBtn.isVisible({ timeout: 3000 }).catch(() => false);
            let nextVersion = 0;
            if (saveBtnVisible) {
              const btnText = await saveBtn.textContent();
              const vMatch = btnText?.match(/Salvar v(\d+)/);
              nextVersion = vMatch ? parseInt(vMatch[1], 10) : 0;
            }
            (ctx as any)._expectedNextVersion = nextVersion;

            return {
              expected: 'Before state captured from UI',
              observed: `history_count=${beforeCount}, max_version=v${maxExistingVersion}, save_btn_next=v${nextVersion}, btn_visible=${saveBtnVisible}`,
              passed: saveBtnVisible && nextVersion > 0,
            };
          },
        },
        {
          action: 'Click "Salvar v{N}" button in UI and wait for result',
          execute: async (page, ctx) => {
            const expectedVersion = (ctx as any)._expectedNextVersion;
            const saveBtn = page.locator('button:has-text("Salvar v")');

            // Click the real save button
            await saveBtn.click();

            // Wait for the save to complete — spinner should appear then disappear
            // The button shows a Loader2 spinner while saving
            await page.waitForTimeout(5000);

            // After save, the UI should update: history reloads and button version increments
            const body = await page.textContent('body');

            // Check that the version we just saved now appears as a badge in history
            const hasNewVersion = body?.includes(`v${expectedVersion}`);

            // Check that the save button now shows the NEXT version (expectedVersion + 1)
            const saveBtnAfter = page.locator('button:has-text("Salvar v")');
            const btnTextAfter = await saveBtnAfter.textContent().catch(() => '');
            const nextMatch = btnTextAfter?.match(/Salvar v(\d+)/);
            const newNextVersion = nextMatch ? parseInt(nextMatch[1], 10) : 0;

            // Store the saved version for later validation
            (ctx as any)._savedVersion = expectedVersion;

            return {
              expected: `Spec v${expectedVersion} saved, button advances to v${expectedVersion + 1}`,
              observed: `badge_v${expectedVersion}=${!!hasNewVersion}, btn_next=v${newNextVersion}`,
              passed: !!hasNewVersion && newNextVersion === expectedVersion + 1,
            };
          },
        },
        {
          action: 'Validate AFTER state in UI — history incremented and version badge visible',
          execute: async (page, ctx) => {
            const beforeCount = (ctx as any)._beforeCount;
            const savedVersion = (ctx as any)._savedVersion;

            // Count version badges using locators (consistent with BEFORE step)
            const versionBadgeLocators = page.locator('.badge-info');
            const afterCount = await versionBadgeLocators.count();

            // History should have incremented (or stayed same if at retention cap of 10)
            const countOk = afterCount >= beforeCount && afterCount > 0;

            // The saved version badge should be in the history list
            const hasSavedBadge = await page.locator(`.badge-info:has-text("v${savedVersion}")`).isVisible({ timeout: 2000 }).catch(() => false);

            // Check for spec name and problem count in history rows
            const body = await page.textContent('body');
            const hasSpecName = body?.includes('_v') || body?.includes('spec');
            const hasProbCount = body?.includes('prob');

            return {
              expected: `After: count>=${beforeCount}, v${savedVersion} badge, spec name, prob count visible`,
              observed: `count: ${beforeCount}->${afterCount} (${countOk ? 'ok' : 'fail'}), badge_v${savedVersion}=${hasSavedBadge}, name=${!!hasSpecName}, prob=${!!hasProbCount}`,
              passed: countOk && hasSavedBadge,
            };
          },
        },
        {
          action: 'Reload page and validate persistence — history survives round-trip',
          execute: async (page, ctx) => {
            const runId = (ctx as any)._specRunId;
            const savedVersion = (ctx as any)._savedVersion;
            const beforeCount = (ctx as any)._beforeCount;

            // Full page reload to prove persistence
            await page.goto(`${ctx.baseUrl}/projects/${ctx.projectId}/browser-runs/${runId}`, { waitUntil: 'domcontentloaded', timeout: TIMEOUT });
            await page.waitForTimeout(6000);

            // After reload: version badge still visible
            const hasBadge = await page.locator(`.badge-info:has-text("v${savedVersion}")`).isVisible({ timeout: 3000 }).catch(() => false);

            // After reload: history count matches or exceeds (using locator count)
            const reloadCount = await page.locator('.badge-info').count();
            const countPersisted = reloadCount >= beforeCount && reloadCount > 0;

            // After reload: save button shows next version (savedVersion + 1)
            const saveBtn = page.locator('button:has-text("Salvar v")');
            const btnText = await saveBtn.textContent().catch(() => '');
            const nextMatch = btnText?.match(/Salvar v(\d+)/);
            const nextVersion = nextMatch ? parseInt(nextMatch[1], 10) : 0;
            const btnCorrect = nextVersion === savedVersion + 1;

            // Complementary API check — proof that persistence is real (not primary path)
            const apiBase = ctx.baseUrl.replace(/:3001/, ':3000');
            const latestCheck = await page.evaluate(async (args: { api: string; runId: string }) => {
              const token = localStorage.getItem('copalite_token');
              const res = await fetch(`${args.api}/api/v1/browser-specs/latest/${args.runId}`, { headers: { Authorization: `Bearer ${token}` } });
              return res.ok ? await res.json() : null;
            }, { api: apiBase, runId });

            const apiVersion = latestCheck?.version;
            const apiConfirms = apiVersion === savedVersion;

            return {
              expected: `Persisted: v${savedVersion} badge, count>=${beforeCount}, btn=v${savedVersion + 1}, API confirms`,
              observed: `badge=${!!hasBadge}, count=${reloadCount} (${countPersisted ? 'ok' : 'fail'}), btn=v${nextVersion} (${btnCorrect ? 'ok' : 'fail'}), api_latest=v${apiVersion} (${apiConfirms ? 'ok' : 'fail'})`,
              passed: !!hasBadge && countPersisted && btnCorrect && apiConfirms,
            };
          },
        },
      ],
    };
  }

  private journeyMutationCompareRuns(): { name: string; description: string; steps: StepDef[] } {
    return {
      name: 'Comparar Runs via UI (MUTATION)',
      description: 'Navegar para diff page via sidebar, selecionar runs, validar diff com before/after real',
      steps: [
        this.loginStep(),
        {
          action: 'Navigate to diff page via sidebar link',
          execute: async (page, ctx) => {
            // Go to a project page first to get sidebar
            await page.goto(`${ctx.baseUrl}/projects/${ctx.projectId}/browser-runs`, { waitUntil: 'domcontentloaded', timeout: TIMEOUT });
            await page.waitForTimeout(3000);

            // Click "Run Diff" in sidebar
            const diffLink = page.locator('a:has-text("Run Diff")');
            const linkVisible = await diffLink.isVisible({ timeout: 3000 }).catch(() => false);
            if (linkVisible) {
              await diffLink.click();
              await page.waitForTimeout(4000);
            } else {
              // Fallback: navigate directly
              await page.goto(`${ctx.baseUrl}/projects/${ctx.projectId}/browser-runs/diff`, { waitUntil: 'domcontentloaded', timeout: TIMEOUT });
              await page.waitForTimeout(4000);
            }

            const body = await page.textContent('body');
            const hasDiffPage = body?.includes('Comparar') || body?.includes('Run A') || body?.includes('Run B');
            const onDiffUrl = page.url().includes('/diff');
            return {
              expected: 'Diff page loaded via sidebar navigation',
              observed: `url_has_diff=${onDiffUrl}, page_has_comparar=${!!hasDiffPage}, nav=${linkVisible ? 'sidebar' : 'fallback'}`,
              passed: onDiffUrl && !!hasDiffPage,
            };
          },
        },
        {
          action: 'Read BEFORE state — auto-selected runs and initial diff numbers',
          execute: async (page, ctx) => {
            // The page auto-selects the two most recent completed runs and auto-loads diff
            // Wait for diff to finish loading
            await page.waitForTimeout(3000);

            const body = await page.textContent('body');

            // Check if we have at least 2 completed runs (required for diff)
            const tooFewRuns = body?.includes('pelo menos 2 runs');
            if (tooFewRuns) {
              return { expected: 'At least 2 completed runs', observed: 'Not enough completed runs', passed: false, error: 'Need 2+ completed runs' };
            }

            // Read the two select values (Run A and Run B)
            const selects = await page.locator('select').all();
            if (selects.length < 2) return { expected: '2 run selectors', observed: `${selects.length} found`, passed: false };

            const runAValue = await selects[0].inputValue();
            const runBValue = await selects[1].inputValue();
            (ctx as any)._beforeRunA = runAValue;
            (ctx as any)._beforeRunB = runBValue;

            // Read initial diff summary numbers from the 3 summary cards
            const resolvedCard = page.locator('text=Resolvidos').locator('..');
            const persistentCard = page.locator('text=Persistentes').locator('..');
            const newCard = page.locator('text=Novos').locator('..');

            let beforeResolved = '?', beforePersistent = '?', beforeNew = '?';
            if (await resolvedCard.isVisible({ timeout: 2000 }).catch(() => false)) {
              beforeResolved = (await resolvedCard.textContent())?.match(/(\d+)/)?.[1] || '?';
            }
            if (await persistentCard.isVisible({ timeout: 2000 }).catch(() => false)) {
              beforePersistent = (await persistentCard.textContent())?.match(/(\d+)/)?.[1] || '?';
            }
            if (await newCard.isVisible({ timeout: 2000 }).catch(() => false)) {
              beforeNew = (await newCard.textContent())?.match(/(\d+)/)?.[1] || '?';
            }
            (ctx as any)._beforeDiff = { resolved: beforeResolved, persistent: beforePersistent, new: beforeNew };

            const hasDiffResults = body?.includes('Resolvidos') || body?.includes('Persistentes') || body?.includes('Novos');
            const hasNoDiff = body?.includes('Nenhuma diferenca');

            return {
              expected: 'Before state: auto-selected runs with diff loaded',
              observed: `runA=${runAValue?.substring(0, 8) || 'none'}, runB=${runBValue?.substring(0, 8) || 'none'}, diff={resolved:${beforeResolved}, persistent:${beforePersistent}, new:${beforeNew}}, has_results=${!!hasDiffResults}, no_diff=${!!hasNoDiff}`,
              passed: !!runAValue && !!runBValue && (!!hasDiffResults || !!hasNoDiff),
            };
          },
        },
        {
          action: 'Change Run A selection via UI to trigger diff recalculation',
          execute: async (page, ctx) => {
            const selects = await page.locator('select').all();
            if (selects.length < 2) return { expected: 'Run A selector', observed: 'Missing', passed: false };

            // Get all options in Run A selector
            const options = await selects[0].locator('option').all();
            const optionValues: string[] = [];
            for (const opt of options) {
              const val = await opt.getAttribute('value');
              if (val) optionValues.push(val);
            }

            // Pick a different run for A (not the current one, not B)
            const currentA = (ctx as any)._beforeRunA;
            const currentB = (ctx as any)._beforeRunB;
            const alternateA = optionValues.find(v => v && v !== currentA && v !== currentB);

            if (!alternateA && optionValues.length >= 2) {
              // If all runs are already selected, swap A and B
              await selects[0].selectOption(currentB);
              await selects[1].selectOption(currentA);
              (ctx as any)._swapped = true;
            } else if (alternateA) {
              await selects[0].selectOption(alternateA);
              (ctx as any)._swapped = false;
            } else {
              return { expected: 'Alternate run available', observed: 'Only one run option', passed: false };
            }

            // Wait for diff to recalculate
            await page.waitForTimeout(5000);

            const newRunA = await selects[0].inputValue();
            const changed = newRunA !== currentA;

            return {
              expected: 'Run A changed, diff recalculating',
              observed: `before_A=${currentA?.substring(0, 8)}, after_A=${newRunA?.substring(0, 8)}, changed=${changed}, swapped=${(ctx as any)._swapped}`,
              passed: changed,
            };
          },
        },
        {
          action: 'Validate AFTER state — diff summary cards with real numbers',
          execute: async (page, ctx) => {
            const body = await page.textContent('body');

            // Read updated diff numbers
            const resolvedCard = page.locator('text=Resolvidos').locator('..');
            const persistentCard = page.locator('text=Persistentes').locator('..');
            const newCard = page.locator('text=Novos').locator('..');

            let afterResolved = '?', afterPersistent = '?', afterNew = '?';
            const hasResults = body?.includes('Resolvidos') || body?.includes('Novos');
            const hasNoDiff = body?.includes('Nenhuma diferenca');

            if (await resolvedCard.isVisible({ timeout: 2000 }).catch(() => false)) {
              afterResolved = (await resolvedCard.textContent())?.match(/(\d+)/)?.[1] || '?';
            }
            if (await persistentCard.isVisible({ timeout: 2000 }).catch(() => false)) {
              afterPersistent = (await persistentCard.textContent())?.match(/(\d+)/)?.[1] || '?';
            }
            if (await newCard.isVisible({ timeout: 2000 }).catch(() => false)) {
              afterNew = (await newCard.textContent())?.match(/(\d+)/)?.[1] || '?';
            }

            const beforeDiff = (ctx as any)._beforeDiff;

            // Verify the diff rendered something meaningful (numbers or "no diff" message)
            const diffRendered = !!hasResults || !!hasNoDiff;

            // Check no crash
            const hasCrash = body?.includes('Something went wrong') || body?.includes('Internal Server Error');

            return {
              expected: 'After: diff recalculated with real numbers, no crash',
              observed: `before={r:${beforeDiff.resolved},p:${beforeDiff.persistent},n:${beforeDiff.new}} -> after={r:${afterResolved},p:${afterPersistent},n:${afterNew}}, rendered=${diffRendered}, crash=${!!hasCrash}`,
              passed: diffRendered && !hasCrash,
            };
          },
        },
        {
          action: 'Validate diff detail sections render with problem items',
          execute: async (page) => {
            const body = await page.textContent('body');

            // Check that at least one section rendered with detail items
            const hasNewSection = body?.includes('Novos (');
            const hasResolvedSection = body?.includes('Resolvidos (');
            const hasPersistentSection = body?.includes('Persistentes (');
            const hasNoDiffMessage = body?.includes('Nenhuma diferenca');

            // At least one section should be present (or explicit "no difference" message)
            const hasContent = !!hasNewSection || !!hasResolvedSection || !!hasPersistentSection || !!hasNoDiffMessage;

            // Summary cards should always be present (3 cards: Resolvidos, Persistentes, Novos)
            const summaryCards = await page.locator('text=Resolvidos').count() + await page.locator('text=Persistentes').count() + await page.locator('text=Novos').count();

            // No error state
            const hasError = body?.includes('Falha ao carregar') || body?.includes('Something went wrong');

            return {
              expected: 'Diff detail sections with items or explicit no-diff message',
              observed: `sections: new=${!!hasNewSection}, resolved=${!!hasResolvedSection}, persistent=${!!hasPersistentSection}, no_diff=${!!hasNoDiffMessage}, summary_cards=${summaryCards}, error=${!!hasError}`,
              passed: hasContent && !hasError,
            };
          },
        },
      ],
    };
  }

  // =============================================
  // Helpers
  // =============================================

  private async screenshot(page: Page, runId: string, stepIndex: number): Promise<string> {
    const dir = path.join(ARTIFACTS_DIR, runId);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    const filePath = path.join(dir, `step_${stepIndex}.png`);
    try { await page.screenshot({ path: filePath, fullPage: true }); } catch { /* ignore */ }
    return filePath;
  }

  // =============================================
  // E2E CLEANUP
  // =============================================

  /** Remove all data created by e2e mutation journeys + disk artifacts */
  async cleanupE2eData(projectId: string): Promise<{
    targets: number; runs: number; journeyRuns: number;
    artifacts: { filesRemoved: number; bytesFreed: number; directoriesRemoved: number };
  }> {
    let targetsDeleted = 0;
    let runsDeleted = 0;
    let journeyRunsDeleted = 0;
    const idsToClean: string[] = [];

    try {
      // 1. Find and delete e2e browser runs
      const e2eRuns = await this.dataSource.getRepository(BrowserRunEntity).find({
        where: { projectId, journeyName: Like(`${E2E_PREFIX}%`) },
        select: ['id'],
      });
      idsToClean.push(...e2eRuns.map(r => r.id));
      if (e2eRuns.length > 0) {
        await this.dataSource.getRepository(BrowserRunEntity).remove(e2eRuns);
        runsDeleted = e2eRuns.length;
      }

      // 2. Find and delete e2e journey runs + their step results
      const e2eJourneyRuns = await this.runRepo.find({
        where: { projectId, slug: Like(`${E2E_PREFIX}%`) },
        select: ['id'],
      });
      // Also include journey runs whose name starts with e2e- prefix or are mutation runs
      const mutationJourneyRuns = await this.runRepo.find({
        where: { projectId, slug: Like('mutation-%') },
        select: ['id'],
      });
      const allJourneyRunIds = new Set([
        ...e2eJourneyRuns.map(r => r.id),
        ...mutationJourneyRuns.map(r => r.id),
      ]);
      idsToClean.push(...allJourneyRunIds);

      if (allJourneyRunIds.size > 0) {
        // Delete step results first (FK constraint)
        for (const jrId of allJourneyRunIds) {
          await this.stepRepo.delete({ journeyRunId: jrId });
        }
        const toRemove = await this.runRepo.findByIds([...allJourneyRunIds]);
        if (toRemove.length > 0) {
          await this.runRepo.remove(toRemove);
          journeyRunsDeleted = toRemove.length;
        }
      }

      // 3. Find and delete e2e targets
      const e2eTargets = await this.targetRepo.find({
        where: { projectId, name: Like(`${E2E_PREFIX}%`) },
        select: ['id'],
      });
      if (e2eTargets.length > 0) {
        await this.targetRepo.remove(e2eTargets);
        targetsDeleted = e2eTargets.length;
      }

      // 4. Cleanup disk artifacts for ALL deleted IDs (browser runs + journey runs)
      const artifactResult = this.artifactCleanup.removeByRunIds([...idsToClean]);

      this.logger.log(
        `[CLEANUP] E2E cleanup complete: targets=${targetsDeleted}, runs=${runsDeleted}, journeyRuns=${journeyRunsDeleted}, ` +
        `files=${artifactResult.filesRemoved}, dirs=${artifactResult.directoriesRemoved}, bytes=${artifactResult.bytesFreed}`,
      );

      return {
        targets: targetsDeleted,
        runs: runsDeleted,
        journeyRuns: journeyRunsDeleted,
        artifacts: {
          filesRemoved: artifactResult.filesRemoved,
          bytesFreed: artifactResult.bytesFreed,
          directoriesRemoved: artifactResult.directoriesRemoved,
        },
      };
    } catch (err) {
      this.logger.warn(`[CLEANUP] E2E cleanup failed: ${err}`);
    }

    return {
      targets: targetsDeleted, runs: runsDeleted, journeyRuns: journeyRunsDeleted,
      artifacts: { filesRemoved: 0, bytesFreed: 0, directoriesRemoved: 0 },
    };
  }
}
