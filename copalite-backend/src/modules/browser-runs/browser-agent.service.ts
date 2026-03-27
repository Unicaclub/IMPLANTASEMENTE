import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { chromium } from 'playwright';
import type { Browser, Page, ConsoleMessage } from 'playwright';
import * as fs from 'fs';
import * as path from 'path';

import { BrowserRunStatus, EvidenceKind, ProblemSeverity, ProblemType, SessionStatus } from '../../common/enums';
import { ExecutionLockService } from '../../common/utils/execution-lock.service';
import { BrowserRunEntity } from './entities/browser-run.entity';
import { BrowserEvidenceEntity } from '../browser-evidence/entities/browser-evidence.entity';
import { BrowserProblemsService } from '../browser-problems/browser-problems.service';
import { TargetEntity } from '../targets/entities/target.entity';
import { TargetSessionEntity } from '../target-sessions/entities/target-session.entity';
import { decryptCredentials } from '../../common/utils/crypto';

const NAVIGATION_TIMEOUT = 30_000;
const MAX_DOM_SIZE = 50_000;
const ARTIFACTS_DIR = path.resolve(process.cwd(), 'artifacts');

// Only capture these resource types (filter out fonts, images, stylesheets)
const RELEVANT_RESOURCE_TYPES = new Set(['document', 'xhr', 'fetch', 'script']);

const GLOBAL_ROUTES = ['/dashboard', '/admin/health', '/notifications'];

const PROJECT_ROUTES = [
  '/sources', '/runs', '/orchestration',
  '/registries?tab=modules', '/registries?tab=routes', '/registries?tab=apis',
  '/evidence', '/comparisons', '/backlog', '/tasks',
  '/audits', '/reports', '/targets', '/browser-runs', '/agents', '/activity',
];

// =============================================
// Types
// =============================================

export interface DetectedProblem {
  type: ProblemType;
  severity: ProblemSeverity;
  route: string;
  summary: string;
}

export interface PageSummary {
  route: string;
  status: 'ok' | 'error' | 'redirect_to_login';
  httpStatus: number | null;
  title: string;
  evidenceCount: number;
  problems: DetectedProblem[];
  maxSeverity: ProblemSeverity | null;
  screenshotPath: string | null;
}

export interface ExecutionResult {
  runId: string;
  status: BrowserRunStatus;
  stepsCount: number;
  evidencesCount: number;
  errorMessage: string | null;
  pagesVisited: number;
  pagesFailed: number;
  pages: PageSummary[];
  problems: DetectedProblem[];
}

@Injectable()
export class BrowserAgentService {
  private readonly logger = new Logger(BrowserAgentService.name);

  constructor(
    @InjectRepository(BrowserRunEntity) private readonly runRepo: Repository<BrowserRunEntity>,
    @InjectRepository(BrowserEvidenceEntity) private readonly evidenceRepo: Repository<BrowserEvidenceEntity>,
    @InjectRepository(TargetEntity) private readonly targetRepo: Repository<TargetEntity>,
    @InjectRepository(TargetSessionEntity) private readonly sessionRepo: Repository<TargetSessionEntity>,
    private readonly problemsService: BrowserProblemsService,
    private readonly lockService: ExecutionLockService,
  ) {}

  async execute(runId: string): Promise<ExecutionResult> {
    const acquired = await this.lockService.tryAcquire(ExecutionLockService.BROWSER_AGENT_LOCK);
    if (!acquired) {
      throw new Error('Browser agent ja em execucao (lock distribuido). Aguarde.');
    }
    try {
      return await this.executeInternal(runId);
    } finally {
      await this.lockService.release(ExecutionLockService.BROWSER_AGENT_LOCK);
    }
  }

  private async executeInternal(runId: string): Promise<ExecutionResult> {
    const run = await this.runRepo.findOne({ where: { id: runId }, relations: ['target'] });
    if (!run) throw new NotFoundException('Browser run nao encontrada');

    const target = run.target || await this.targetRepo.findOne({ where: { id: run.targetId } });
    if (!target) throw new NotFoundException('Target nao encontrado');

    if (run.status !== BrowserRunStatus.PENDING) {
      throw new Error(`Run ${runId} nao esta em status pending (atual: ${run.status})`);
    }

    run.status = BrowserRunStatus.RUNNING;
    run.startedAt = new Date();
    await this.runRepo.save(run);

    let browser: Browser | null = null;
    let stepIndex = 0;
    let evidencesCreated = 0;
    const pageSummaries: PageSummary[] = [];
    const allProblems: DetectedProblem[] = [];

    try {
      this.logger.log(`Launching Chromium for run ${runId} → ${target.baseUrl}`);
      browser = await chromium.launch({
        headless: true,
        executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH || undefined,
        args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
      });
      const page = await browser.newPage();

      // === PHASE 1: LOGIN ===
      stepIndex++;
      const loginResult = await this.performLogin(page, target, run, stepIndex, runId);
      evidencesCreated += loginResult.evidences;
      stepIndex = loginResult.stepIndex;

      if (!loginResult.success) {
        if (run.sessionId) {
          await this.sessionRepo.update(run.sessionId, { status: SessionStatus.FAILED, errorMessage: loginResult.error || 'Login failed' });
        }
        throw new Error(`Login falhou: ${loginResult.error}`);
      }

      if (run.sessionId) {
        await this.sessionRepo.update(run.sessionId, { status: SessionStatus.VALID, lastValidatedAt: new Date() });
      }

      // === PHASE 2: DISCOVER PROJECT ===
      const projectId = await this.discoverProjectId(page, target);
      if (projectId) this.logger.log(`Discovered projectId: ${projectId}`);

      // === PHASE 3: NAVIGATE PAGES ===
      const routes = this.buildRouteList(projectId);

      for (const route of routes) {
        stepIndex++;
        const fullUrl = this.resolveUrl(target.baseUrl, route);
        const { summary, evidences: evCount, newStep } = await this.visitPageWithQuality(page, fullUrl, route, runId, stepIndex);
        pageSummaries.push(summary);
        allProblems.push(...summary.problems);
        evidencesCreated += evCount;
        stepIndex = newStep;
      }

      // === PHASE 4: INTERACTION TEST ===
      if (projectId) {
        stepIndex++;
        const interactionEvs = await this.performInteraction(page, target, projectId, runId, stepIndex);
        evidencesCreated += interactionEvs.evidences;
        stepIndex = interactionEvs.stepIndex;
      }

      // === PHASE 5: PERSIST PROBLEMS ===
      if (allProblems.length > 0) {
        await this.problemsService.persistFromRun(runId, allProblems.map(p => ({
          type: p.type,
          severity: p.severity,
          route: p.route,
          summary: p.summary,
        })));
        this.logger.log(`Persisted ${allProblems.length} problems for run ${runId}`);
      }

      // === CLOSE ===
      await browser.close();
      browser = null;

      const pagesFailed = pageSummaries.filter(p => p.status !== 'ok').length;
      run.status = BrowserRunStatus.COMPLETED;
      run.finishedAt = new Date();
      run.stepsCount = stepIndex;
      run.evidencesCount = evidencesCreated;
      run.errorMessage = pagesFailed > 0 ? `${pagesFailed} pagina(s) com problema` : null;
      await this.runRepo.save(run);

      this.logger.log(`Run ${runId} completed: ${pageSummaries.length} pages, ${pagesFailed} failed, ${allProblems.length} problems`);

      return { runId, status: BrowserRunStatus.COMPLETED, stepsCount: stepIndex, evidencesCount: evidencesCreated,
        errorMessage: run.errorMessage, pagesVisited: pageSummaries.length, pagesFailed, pages: pageSummaries, problems: allProblems };
    } catch (error: unknown) {
      const errMsg = error instanceof Error ? error.message : String(error);
      this.logger.error(`Run ${runId} failed: ${errMsg}`);
      if (browser) { try { await browser.close(); } catch { /* */ } }

      run.status = BrowserRunStatus.FAILED;
      run.finishedAt = new Date();
      run.stepsCount = stepIndex;
      run.evidencesCount = evidencesCreated;
      run.errorMessage = errMsg.substring(0, 2000);
      await this.runRepo.save(run);

      return { runId, status: BrowserRunStatus.FAILED, stepsCount: stepIndex, evidencesCount: evidencesCreated,
        errorMessage: errMsg, pagesVisited: pageSummaries.length, pagesFailed: pageSummaries.filter(p => p.status !== 'ok').length,
        pages: pageSummaries, problems: allProblems };
    }
  }

  // =============================================
  // LOGIN (credentials decrypted from target)
  // =============================================

  private async performLogin(page: Page, target: TargetEntity, run: BrowserRunEntity, startStep: number, runId: string) {
    let step = startStep;
    let evCount = 0;

    // Decrypt credentials from { _enc: "encrypted_string" } or plaintext object
    let creds: Record<string, unknown> = {};
    if (target.credentialsJson) {
      try {
        const raw = typeof target.credentialsJson === 'string'
          ? JSON.parse(target.credentialsJson)
          : (target.credentialsJson as Record<string, unknown>);
        if (raw._enc && typeof raw._enc === 'string') {
          creds = decryptCredentials(raw._enc);
          this.logger.log('Credentials decrypted successfully');
        } else if (raw.email) {
          // Legacy plaintext — accept but warn
          creds = raw;
          this.logger.warn('Credentials in plaintext (not encrypted) — legacy target');
        }
      } catch (err) {
        this.logger.error(`Credential decryption failed: ${err}`);
        return { success: false, error: 'Falha ao decriptar credenciais do target', stepIndex: step, evidences: evCount };
      }
    }

    const email = creds.email as string | undefined;
    const password = creds.password as string | undefined;
    if (!email || !password) {
      return { success: false, error: 'Target sem credenciais (credentialsJson.email + password)', stepIndex: step, evidences: evCount };
    }

    const loginUrl = `${target.baseUrl}/auth/login`;
    await this.saveEvidence(runId, step, EvidenceKind.ACTION, loginUrl, 'navigate to login', null, { description: `Navegando para ${loginUrl}` });
    evCount++;

    try {
      await page.goto(loginUrl, { waitUntil: 'domcontentloaded', timeout: NAVIGATION_TIMEOUT });
    } catch (err: unknown) {
      return { success: false, error: `Login page nao carregou: ${err instanceof Error ? err.message : err}`, stepIndex: step, evidences: evCount };
    }

    step++;
    const ssLogin = await this.captureScreenshot(page, runId, step);
    await this.saveEvidence(runId, step, EvidenceKind.SCREENSHOT, loginUrl, 'login page', ssLogin, { phase: 'pre-login' });
    evCount++;

    step++;
    try {
      await page.fill('input[type="email"], input[name="email"], input#email', email);
      await page.fill('input[type="password"], input[name="password"], input#password', password);
      await this.saveEvidence(runId, step, EvidenceKind.ACTION, loginUrl, 'fill credentials', null, { email, passwordMasked: '***' });
      evCount++;

      step++;
      await Promise.all([
        page.waitForURL(url => !url.toString().includes('/auth/login'), { timeout: 30_000 }),
        page.click('button[type="submit"], button:has-text("Sign in"), button:has-text("Entrar"), button:has-text("Login")'),
      ]);

      if (page.url().includes('/auth/login')) {
        return { success: false, error: 'Login nao redirecionou', stepIndex: step, evidences: evCount };
      }

      step++;
      const ssPost = await this.captureScreenshot(page, runId, step);
      await this.saveEvidence(runId, step, EvidenceKind.SCREENSHOT, page.url(), 'post-login', ssPost, { phase: 'post-login' });
      evCount++;

      return { success: true, stepIndex: step, evidences: evCount };
    } catch (err: unknown) {
      return { success: false, error: `Login form failed: ${err instanceof Error ? err.message : err}`, stepIndex: step, evidences: evCount };
    }
  }

  // =============================================
  // PAGE VISIT — with quality filtering + classification
  // =============================================

  private async visitPageWithQuality(page: Page, fullUrl: string, route: string, runId: string, stepIndex: number) {
    const problems: DetectedProblem[] = [];
    const consoleErrors: string[] = [];
    let pageEvCount = 0;
    let step = stepIndex;

    // Console error handler
    const onConsole = (msg: ConsoleMessage) => {
      if (msg.type() === 'error') {
        const text = msg.text().substring(0, 500);
        consoleErrors.push(text);
        problems.push(this.classifyProblem(ProblemType.CONSOLE_ERROR, route, text));
      }
    };
    page.on('console', onConsole);

    // Filtered request failure handler (only relevant types)
    const failedReqs: string[] = [];
    const onReqFail = (req: any) => {
      if (!RELEVANT_RESOURCE_TYPES.has(req.resourceType())) return;
      const fail = req.failure();
      if (fail) {
        const summary = `${req.method()} ${req.url().substring(0, 150)}: ${fail.errorText}`;
        failedReqs.push(summary);
        problems.push(this.classifyProblem(ProblemType.REQUEST_FAILED, route, summary));
      }
    };
    page.on('requestfailed', onReqFail);

    // Navigate
    await this.saveEvidence(runId, step, EvidenceKind.ACTION, route, `navigate to ${route}`, null, { fullUrl });
    pageEvCount++;

    let httpStatus: number | null = null;
    let title = '';

    try {
      const response = await page.goto(fullUrl, { waitUntil: 'domcontentloaded', timeout: NAVIGATION_TIMEOUT });
      httpStatus = response?.status() ?? null;
      title = await page.title();

      if (httpStatus && httpStatus >= 500) {
        problems.push(this.classifyProblem(ProblemType.RESPONSE_5XX, route, `HTTP ${httpStatus}`));
      } else if (httpStatus && httpStatus >= 400) {
        problems.push(this.classifyProblem(ProblemType.RESPONSE_4XX, route, `HTTP ${httpStatus}`));
      }
    } catch (err: unknown) {
      page.off('console', onConsole);
      problems.push(this.classifyProblem(ProblemType.REQUEST_FAILED, route, `Navigation failed: ${err instanceof Error ? err.message : err}`));
      step++;
      await this.saveEvidence(runId, step, EvidenceKind.DOM, route, 'navigation failed', null, { error: String(err) });
      pageEvCount++;
      const maxSev = this.getMaxSeverity(problems);
      return { summary: { route, status: 'error' as const, httpStatus: null, title: '', evidenceCount: pageEvCount, problems, maxSeverity: maxSev, screenshotPath: null }, evidences: pageEvCount, newStep: step };
    }

    const redirectToLogin = page.url().includes('/auth/login');
    if (redirectToLogin) {
      problems.push(this.classifyProblem(ProblemType.AUTH_REDIRECT, route, 'Redirected to login'));
    }

    // Screenshot
    step++;
    const ssPath = await this.captureScreenshot(page, runId, step);
    await this.saveEvidence(runId, step, EvidenceKind.SCREENSHOT, route, `screenshot ${route}`, ssPath, { httpStatus, title });
    pageEvCount++;

    // DOM
    step++;
    const html = await page.content();
    await this.saveEvidence(runId, step, EvidenceKind.DOM, route, `DOM ${route}`, null, {
      html: html.substring(0, MAX_DOM_SIZE), fullLength: html.length, title, httpStatus,
    });
    pageEvCount++;

    // Filtered API requests only (document, xhr, fetch)
    const apiRequests = await page.evaluate(() => {
      return (performance.getEntriesByType('resource') as PerformanceResourceTiming[])
        .filter(e => e.initiatorType === 'xmlhttprequest' || e.initiatorType === 'fetch' || e.name.includes('/api/'))
        .slice(0, 10)
        .map(e => ({ url: e.name, duration: Math.round(e.duration), initiator: e.initiatorType }));
    }).catch(() => []);

    if (apiRequests.length > 0) {
      step++;
      await this.saveEvidence(runId, step, EvidenceKind.REQUEST, route, `${apiRequests.length} API calls`, null, { requests: apiRequests });
      pageEvCount++;
    }

    // Console errors evidence
    if (consoleErrors.length > 0) {
      step++;
      await this.saveEvidence(runId, step, EvidenceKind.CONSOLE, route, `${consoleErrors.length} console errors`, null, { errors: consoleErrors });
      pageEvCount++;
    }

    page.off('console', onConsole);

    const pageStatus: 'ok' | 'error' | 'redirect_to_login' = redirectToLogin
      ? 'redirect_to_login'
      : problems.length > 0 ? 'error' : 'ok';

    const maxSev = this.getMaxSeverity(problems);
    this.logger.log(`  ${route}: ${pageStatus} (HTTP ${httpStatus}, ${problems.length} problems, max: ${maxSev || 'none'})`);

    return {
      summary: { route, status: pageStatus, httpStatus, title, evidenceCount: pageEvCount, problems, maxSeverity: maxSev, screenshotPath: ssPath } as PageSummary,
      evidences: pageEvCount,
      newStep: step,
    };
  }

  // =============================================
  // REAL INTERACTION: click registries tab
  // =============================================

  private async performInteraction(page: Page, target: TargetEntity, projectId: string, runId: string, startStep: number) {
    let step = startStep;
    let evCount = 0;

    const registriesUrl = this.resolveUrl(target.baseUrl, `/projects/${projectId}/registries?tab=modules`);

    try {
      await page.goto(registriesUrl, { waitUntil: 'domcontentloaded', timeout: NAVIGATION_TIMEOUT });

      // Click on "Routes" tab
      await this.saveEvidence(runId, step, EvidenceKind.ACTION, '/registries', 'click Routes tab', null, { interaction: 'tab_switch' });
      evCount++;

      const routesTab = page.locator('button:has-text("Routes"), a:has-text("Routes")').first();
      if (await routesTab.isVisible({ timeout: 3000 })) {
        await routesTab.click();
        await page.waitForTimeout(2000); // wait for tab content to load

        step++;
        const ssTab = await this.captureScreenshot(page, runId, step);
        await this.saveEvidence(runId, step, EvidenceKind.SCREENSHOT, '/registries?tab=routes', 'Routes tab after click', ssTab, {
          interaction: 'tab_switch', resultUrl: page.url(),
        });
        evCount++;

        this.logger.log('  Interaction: clicked Routes tab successfully');
      } else {
        this.logger.warn('  Interaction: Routes tab not visible, skipping');
      }
    } catch (err) {
      this.logger.warn(`  Interaction failed: ${err}`);
    }

    return { stepIndex: step, evidences: evCount };
  }

  // =============================================
  // PROBLEM CLASSIFICATION
  // =============================================

  private classifyProblem(type: ProblemType, route: string, summary: string): DetectedProblem {
    let severity: ProblemSeverity;
    switch (type) {
      case ProblemType.RESPONSE_5XX: severity = ProblemSeverity.CRITICAL; break;
      case ProblemType.AUTH_REDIRECT: severity = ProblemSeverity.HIGH; break;
      case ProblemType.RESPONSE_4XX: severity = ProblemSeverity.MEDIUM; break;
      case ProblemType.CONSOLE_ERROR:
        severity = summary.toLowerCase().includes('uncaught') || summary.toLowerCase().includes('typeerror')
          ? ProblemSeverity.HIGH : ProblemSeverity.MEDIUM;
        break;
      case ProblemType.REQUEST_FAILED:
        severity = summary.includes('document') || summary.includes('fetch') ? ProblemSeverity.HIGH : ProblemSeverity.LOW;
        break;
      default: severity = ProblemSeverity.LOW;
    }
    return { type, severity, route, summary: summary.substring(0, 300) };
  }

  private getMaxSeverity(problems: DetectedProblem[]): ProblemSeverity | null {
    if (problems.length === 0) return null;
    const order: ProblemSeverity[] = [ProblemSeverity.CRITICAL, ProblemSeverity.HIGH, ProblemSeverity.MEDIUM, ProblemSeverity.LOW];
    for (const sev of order) {
      if (problems.some(p => p.severity === sev)) return sev;
    }
    return ProblemSeverity.LOW;
  }

  // =============================================
  // HELPERS
  // =============================================

  private async discoverProjectId(page: Page, target: TargetEntity): Promise<string | null> {
    try {
      const apiBase = target.baseUrl.replace(/:\d+/, ':3000');
      return await page.evaluate(async (apiUrl: string) => {
        try {
          const token = localStorage.getItem('copalite_token');
          if (!token) return null;
          const res = await fetch(`${apiUrl}/api/v1/workspaces`, { headers: { Authorization: `Bearer ${token}` } });
          if (!res.ok) return null;
          const ws = await res.json();
          if (!ws?.length) return null;
          const pRes = await fetch(`${apiUrl}/api/v1/projects?workspaceId=${ws[0].id}`, { headers: { Authorization: `Bearer ${token}` } });
          if (!pRes.ok) return null;
          const proj = await pRes.json();
          const list = proj?.data || proj;
          return Array.isArray(list) && list.length > 0 ? list[0].id : null;
        } catch { return null; }
      }, apiBase);
    } catch { return null; }
  }

  private buildRouteList(projectId: string | null): string[] {
    const routes = [...GLOBAL_ROUTES];
    if (projectId) {
      for (const pr of PROJECT_ROUTES) routes.push(`/projects/${projectId}${pr}`);
    }
    return routes;
  }

  private resolveUrl(baseUrl: string, route: string): string {
    const base = baseUrl.replace(/\/$/, '');
    return `${base}${route.startsWith('/') ? route : '/' + route}`;
  }

  private async captureScreenshot(page: Page, runId: string, stepIndex: number): Promise<string> {
    const dir = path.join(ARTIFACTS_DIR, runId);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    const filePath = path.join(dir, `step_${stepIndex}.png`);
    await page.screenshot({ path: filePath, fullPage: true });
    return filePath;
  }

  private async saveEvidence(runId: string, stepIndex: number, kind: EvidenceKind,
    route: string | null, action: string | null, artifactUrl: string | null, metadata: Record<string, unknown> | null): Promise<void> {
    await this.evidenceRepo.save(this.evidenceRepo.create({ browserRunId: runId, stepIndex, kind, route, action, artifactUrl, metadataJson: metadata }));
  }
}
