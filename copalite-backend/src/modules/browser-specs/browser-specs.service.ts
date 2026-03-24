import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { chromium } from 'playwright';
import * as fs from 'fs';
import * as path from 'path';
import { BrowserRunEntity } from '../browser-runs/entities/browser-run.entity';
import { BrowserEvidenceEntity } from '../browser-evidence/entities/browser-evidence.entity';
import { BrowserProblemEntity } from '../browser-problems/entities/browser-problem.entity';
import { BrowserProblemsService } from '../browser-problems/browser-problems.service';
import { BrowserSpecEntity } from './entities/browser-spec.entity';
import { ProblemSeverity } from '../../common/enums';

const ARTIFACTS_DIR = path.resolve(process.cwd(), 'artifacts');

// =============================================
// Output types — deterministic spec structure
// =============================================

export interface PageSpec {
  route: string;
  evidencesCount: number;
  problemsCount: number;
  problemTypes: string[];
  maxSeverity: ProblemSeverity | null;
  assessment: 'healthy' | 'warning' | 'degraded' | 'broken';
  notes: string[];
}

export interface ProblemAggregation {
  total: number;
  bySeverity: Record<string, number>;
  byType: Record<string, number>;
}

export interface DiffSpec {
  runIdA: string;
  runIdB: string;
  newCount: number;
  resolvedCount: number;
  persistentCount: number;
  assessment: 'improved' | 'stable' | 'degraded';
  impactedRoutes: string[];
  notes: string[];
}

export interface TruthBoundaries {
  observedFacts: string[];
  inferredPoints: string[];
  unknowns: string[];
  doNotClaim: string[];
}

export interface BrowserSpec {
  generatedAt: string;
  runSummary: {
    runId: string;
    targetId: string;
    targetName: string;
    journeyName: string | null;
    status: string;
    startedAt: string | null;
    finishedAt: string | null;
    pagesVisited: number;
    evidencesCount: number;
    problemsCount: number;
    maxSeverity: ProblemSeverity | null;
    overallAssessment: string;
  };
  pageSummaries: PageSpec[];
  problemSummary: ProblemAggregation;
  diffSummary: DiffSpec | null;
  truthBoundaries: TruthBoundaries;
}

// =============================================
// Service
// =============================================

const SEVERITY_ORDER: ProblemSeverity[] = [ProblemSeverity.CRITICAL, ProblemSeverity.HIGH, ProblemSeverity.MEDIUM, ProblemSeverity.LOW];

@Injectable()
export class BrowserSpecsService {
  private readonly logger = new Logger(BrowserSpecsService.name);

  constructor(
    @InjectRepository(BrowserRunEntity)
    private readonly runRepo: Repository<BrowserRunEntity>,
    @InjectRepository(BrowserEvidenceEntity)
    private readonly evidenceRepo: Repository<BrowserEvidenceEntity>,
    @InjectRepository(BrowserProblemEntity)
    private readonly problemRepo: Repository<BrowserProblemEntity>,
    @InjectRepository(BrowserSpecEntity)
    private readonly specRepo: Repository<BrowserSpecEntity>,
    private readonly problemsService: BrowserProblemsService,
  ) {}

  /**
   * Generate spec for a single run. Deterministic — no LLM, no guessing.
   * Optionally includes diff against a base run.
   */
  async generateByRun(runId: string, baseRunId?: string): Promise<BrowserSpec> {
    // Load run
    const run = await this.runRepo.findOne({ where: { id: runId }, relations: ['target'] });
    if (!run) throw new NotFoundException('Browser run nao encontrada');

    // Load evidence and problems
    const [evidences, problems] = await Promise.all([
      this.evidenceRepo.find({ where: { browserRunId: runId }, order: { stepIndex: 'ASC' } }),
      this.problemRepo.find({ where: { browserRunId: runId }, order: { severity: 'ASC' } }),
    ]);

    // Aggregate by route
    const routeMap = new Map<string, { evidences: BrowserEvidenceEntity[]; problems: BrowserProblemEntity[] }>();
    for (const ev of evidences) {
      const r = ev.route || '_unknown_';
      if (!routeMap.has(r)) routeMap.set(r, { evidences: [], problems: [] });
      routeMap.get(r)!.evidences.push(ev);
    }
    for (const p of problems) {
      if (!routeMap.has(p.route)) routeMap.set(p.route, { evidences: [], problems: [] });
      routeMap.get(p.route)!.problems.push(p);
    }

    // Build page summaries
    const pageSummaries: PageSpec[] = [];
    for (const [route, data] of routeMap) {
      if (route === '_unknown_') continue;
      const maxSev = this.getMaxSeverity(data.problems.map(p => p.severity));
      const types = [...new Set(data.problems.map(p => p.type))];
      const notes: string[] = [];

      if (data.problems.length === 0) {
        notes.push('Nenhum problema detectado nesta pagina durante a navegacao');
      } else {
        notes.push(`${data.problems.length} problema(s) detectado(s)`);
        if (types.includes('auth_redirect' as any)) notes.push('Pagina redirecionou para login — possivel problema de sessao');
        if (types.includes('response_5xx' as any)) notes.push('Erro de servidor detectado (HTTP 5xx)');
      }

      pageSummaries.push({
        route,
        evidencesCount: data.evidences.length,
        problemsCount: data.problems.length,
        problemTypes: types,
        maxSeverity: maxSev,
        assessment: this.assessPage(maxSev, data.problems.length),
        notes,
      });
    }

    // Sort: worst pages first
    pageSummaries.sort((a, b) => {
      const sevA = a.maxSeverity ? SEVERITY_ORDER.indexOf(a.maxSeverity) : 99;
      const sevB = b.maxSeverity ? SEVERITY_ORDER.indexOf(b.maxSeverity) : 99;
      return sevA - sevB;
    });

    // Problem aggregation
    const bySeverity: Record<string, number> = {};
    const byType: Record<string, number> = {};
    for (const p of problems) {
      bySeverity[p.severity] = (bySeverity[p.severity] || 0) + 1;
      byType[p.type] = (byType[p.type] || 0) + 1;
    }

    // Global max severity
    const globalMaxSev = this.getMaxSeverity(problems.map(p => p.severity));

    // Diff (optional)
    let diffSummary: DiffSpec | null = null;
    if (baseRunId) {
      try {
        const diff = await this.problemsService.diffRuns(baseRunId, runId);
        const impacted = new Set<string>();
        diff.newProblems.forEach(p => impacted.add(p.route));
        diff.resolvedProblems.forEach(p => impacted.add(p.route));

        const diffNotes: string[] = [];
        if (diff.summary.new > 0) diffNotes.push(`${diff.summary.new} problema(s) novo(s) apareceram`);
        if (diff.summary.resolved > 0) diffNotes.push(`${diff.summary.resolved} problema(s) foram resolvidos`);
        if (diff.summary.persistent > 0) diffNotes.push(`${diff.summary.persistent} problema(s) persistem entre as duas execucoes`);

        diffSummary = {
          runIdA: baseRunId,
          runIdB: runId,
          newCount: diff.summary.new,
          resolvedCount: diff.summary.resolved,
          persistentCount: diff.summary.persistent,
          assessment: this.assessDiff(diff.summary.new, diff.summary.resolved),
          impactedRoutes: [...impacted],
          notes: diffNotes,
        };
      } catch (err) {
        this.logger.warn(`Diff failed: ${err}`);
      }
    }

    // Overall assessment
    const healthyPages = pageSummaries.filter(p => p.assessment === 'healthy').length;
    const totalPages = pageSummaries.length;
    let overallAssessment: string;
    if (problems.length === 0) {
      overallAssessment = `Todas as ${totalPages} paginas visitadas estao sem problemas detectados`;
    } else if (globalMaxSev === 'critical') {
      overallAssessment = `${problems.length} problema(s) encontrado(s), incluindo critico(s). ${healthyPages}/${totalPages} paginas saudaveis`;
    } else if (globalMaxSev === 'high') {
      overallAssessment = `${problems.length} problema(s) encontrado(s) de alta severidade. ${healthyPages}/${totalPages} paginas saudaveis`;
    } else {
      overallAssessment = `${problems.length} problema(s) de severidade ${globalMaxSev || 'baixa'}. ${healthyPages}/${totalPages} paginas saudaveis`;
    }

    // Truth boundaries
    const truthBoundaries = this.buildTruthBoundaries(run, pageSummaries, problems, evidences);

    return {
      generatedAt: new Date().toISOString(),
      runSummary: {
        runId: run.id,
        targetId: run.targetId,
        targetName: run.target?.name || 'unknown',
        journeyName: run.journeyName,
        status: run.status,
        startedAt: run.startedAt?.toISOString() || null,
        finishedAt: run.finishedAt?.toISOString() || null,
        pagesVisited: totalPages,
        evidencesCount: evidences.length,
        problemsCount: problems.length,
        maxSeverity: globalMaxSev,
        overallAssessment,
      },
      pageSummaries,
      problemSummary: { total: problems.length, bySeverity, byType },
      diffSummary,
      truthBoundaries,
    };
  }

  // =============================================
  // Truth Boundaries — the honest part
  // =============================================

  private buildTruthBoundaries(
    run: BrowserRunEntity,
    pages: PageSpec[],
    problems: BrowserProblemEntity[],
    evidences: BrowserEvidenceEntity[],
  ): TruthBoundaries {
    const totalRoutes = pages.length;
    const healthyRoutes = pages.filter(p => p.assessment === 'healthy').length;
    const screenshotCount = evidences.filter(e => e.kind === 'screenshot').length;
    const domCount = evidences.filter(e => e.kind === 'dom').length;

    const observedFacts: string[] = [
      `Navegacao real executada via Playwright headless em ${totalRoutes} pagina(s)`,
      `${screenshotCount} screenshot(s) real(is) capturado(s)`,
      `${domCount} DOM(s) capturado(s)`,
      `${problems.length} problema(s) detectado(s) automaticamente`,
      `${healthyRoutes} de ${totalRoutes} paginas sem problemas detectados`,
    ];

    if (run.status === 'completed') {
      observedFacts.push('Run completou sem erro fatal');
    } else if (run.status === 'failed') {
      observedFacts.push(`Run falhou: ${run.errorMessage || 'motivo desconhecido'}`);
    }

    const inferredPoints: string[] = [];
    if (problems.some(p => p.type === 'console_error')) {
      inferredPoints.push('Console errors podem indicar problemas de renderizacao ou integracao, mas podem ser warnings nao-criticos');
    }
    if (problems.some(p => p.type === 'request_failed')) {
      inferredPoints.push('Requests falhados podem indicar API fora do ar ou rede instavel durante a captura');
    }
    if (healthyRoutes === totalRoutes) {
      inferredPoints.push('Ausencia de problemas detectados nao garante ausencia de bugs — apenas que nenhum foi capturado neste roteiro');
    }

    const unknowns: string[] = [
      'Formularios e interacoes complexas nao foram testados nesta run',
      'Conteudo de paginas protegidas por permissao especifica pode nao ter sido avaliado',
      'Performance de carregamento nao foi medida explicitamente',
    ];

    if (totalRoutes < 15) {
      unknowns.push(`Apenas ${totalRoutes} paginas foram visitadas — cobertura parcial do sistema`);
    }

    const doNotClaim: string[] = [
      'Nao afirmar que o sistema esta totalmente saudavel com base apenas nesta run',
      'Nao afirmar que todos os bugs foram encontrados',
      'Nao tratar console warnings como bugs confirmados sem investigacao',
    ];

    if (run.status !== 'completed') {
      doNotClaim.push('Nao tratar resultados de run incompleta como avaliacao final');
    }

    return { observedFacts, inferredPoints, unknowns, doNotClaim };
  }

  // =============================================
  // Assessment helpers
  // =============================================

  private assessPage(maxSev: ProblemSeverity | null, problemCount: number): 'healthy' | 'warning' | 'degraded' | 'broken' {
    if (problemCount === 0) return 'healthy';
    if (maxSev === 'critical') return 'broken';
    if (maxSev === 'high') return 'degraded';
    return 'warning';
  }

  private assessDiff(newCount: number, resolvedCount: number): 'improved' | 'stable' | 'degraded' {
    if (resolvedCount > newCount) return 'improved';
    if (newCount > resolvedCount) return 'degraded';
    return 'stable';
  }

  private getMaxSeverity(severities: ProblemSeverity[]): ProblemSeverity | null {
    if (severities.length === 0) return null;
    for (const sev of SEVERITY_ORDER) {
      if (severities.includes(sev)) return sev;
    }
    return null;
  }

  // =============================================
  // Markdown Export
  // =============================================

  toMarkdown(spec: BrowserSpec): string {
    const s = spec.runSummary;
    const lines: string[] = [];

    lines.push(`# Browser Spec: ${s.journeyName || 'Run'}`);
    lines.push(`**Target:** ${s.targetName} | **Status:** ${s.status} | **Gerado:** ${spec.generatedAt}`);
    lines.push('');

    // Run Summary
    lines.push('## Resumo da Run');
    lines.push(`- Paginas visitadas: **${s.pagesVisited}**`);
    lines.push(`- Evidencias coletadas: **${s.evidencesCount}**`);
    lines.push(`- Problemas detectados: **${s.problemsCount}**`);
    lines.push(`- Severidade maxima: **${s.maxSeverity || 'nenhuma'}**`);
    lines.push(`- Avaliacao: ${s.overallAssessment}`);
    if (s.startedAt) lines.push(`- Inicio: ${s.startedAt}`);
    if (s.finishedAt) lines.push(`- Fim: ${s.finishedAt}`);
    lines.push('');

    // Problem Summary
    if (spec.problemSummary.total > 0) {
      lines.push('## Problemas');
      lines.push(`Total: **${spec.problemSummary.total}**`);
      lines.push('');
      lines.push('| Severidade | Quantidade |');
      lines.push('|---|---|');
      for (const [sev, count] of Object.entries(spec.problemSummary.bySeverity)) {
        lines.push(`| ${sev} | ${count} |`);
      }
      lines.push('');
      lines.push('| Tipo | Quantidade |');
      lines.push('|---|---|');
      for (const [type, count] of Object.entries(spec.problemSummary.byType)) {
        lines.push(`| ${type} | ${count} |`);
      }
      lines.push('');
    }

    // Diff
    if (spec.diffSummary) {
      const d = spec.diffSummary;
      lines.push('## Comparacao entre Runs');
      lines.push(`**Avaliacao:** ${d.assessment}`);
      lines.push(`- Novos: **${d.newCount}**`);
      lines.push(`- Resolvidos: **${d.resolvedCount}**`);
      lines.push(`- Persistentes: **${d.persistentCount}**`);
      if (d.impactedRoutes.length > 0) {
        lines.push('');
        lines.push('Rotas impactadas:');
        d.impactedRoutes.forEach(r => lines.push(`- \`${r}\``));
      }
      if (d.notes.length > 0) {
        lines.push('');
        d.notes.forEach(n => lines.push(`- ${n}`));
      }
      lines.push('');
    }

    // Page Summaries
    lines.push('## Paginas Visitadas');
    lines.push('');
    lines.push('| Rota | Estado | Problemas | Severidade |');
    lines.push('|---|---|---|---|');
    for (const p of spec.pageSummaries) {
      const route = p.route.length > 60 ? '...' + p.route.substring(p.route.length - 57) : p.route;
      lines.push(`| \`${route}\` | ${p.assessment} | ${p.problemsCount} | ${p.maxSeverity || '-'} |`);
    }
    lines.push('');

    // Pages with problems — detail
    const problemPages = spec.pageSummaries.filter(p => p.problemsCount > 0);
    if (problemPages.length > 0) {
      lines.push('### Paginas com Problemas');
      lines.push('');
      for (const p of problemPages) {
        lines.push(`#### \`${p.route}\``);
        lines.push(`- Estado: **${p.assessment}** | Severidade: **${p.maxSeverity}**`);
        lines.push(`- Tipos: ${p.problemTypes.join(', ')}`);
        p.notes.forEach(n => lines.push(`- ${n}`));
        lines.push('');
      }
    }

    // Truth Boundaries
    lines.push('## Limites da Verdade');
    lines.push('');
    lines.push('### Fatos Observados');
    spec.truthBoundaries.observedFacts.forEach(f => lines.push(`- ${f}`));
    lines.push('');

    if (spec.truthBoundaries.inferredPoints.length > 0) {
      lines.push('### Inferencias');
      spec.truthBoundaries.inferredPoints.forEach(f => lines.push(`- ${f}`));
      lines.push('');
    }

    if (spec.truthBoundaries.unknowns.length > 0) {
      lines.push('### Desconhecidos');
      spec.truthBoundaries.unknowns.forEach(f => lines.push(`- ${f}`));
      lines.push('');
    }

    lines.push('### Nao Afirmar');
    spec.truthBoundaries.doNotClaim.forEach(f => lines.push(`- **${f}**`));
    lines.push('');

    lines.push('---');
    lines.push(`*Gerado automaticamente pelo Copalite Browser Spec Generator em ${spec.generatedAt}*`);

    return lines.join('\n');
  }

  // =============================================
  // Persistence + Governance
  // =============================================

  private static readonly MAX_SPECS_PER_RUN = 10;

  /** Generate spec name: {target}_{journey}_v{version}_{date} */
  private buildSpecName(targetName: string, journeyName: string | null, version: number): string {
    const target = targetName.toLowerCase().replace(/[^a-z0-9]+/g, '-').substring(0, 30);
    const journey = (journeyName || 'run').toLowerCase().replace(/[^a-z0-9]+/g, '-').substring(0, 30);
    const date = new Date().toISOString().split('T')[0];
    return `${target}_${journey}_v${version}_${date}`;
  }

  /** Get next version number for a run */
  private async getNextVersion(runId: string): Promise<number> {
    const latest = await this.specRepo.findOne({
      where: { browserRunId: runId },
      order: { version: 'DESC' },
      select: ['version'],
    });
    return (latest?.version || 0) + 1;
  }

  /** Enforce retention: keep max N specs per run, delete oldest */
  private async enforceRetention(runId: string): Promise<number> {
    const specs = await this.specRepo.find({
      where: { browserRunId: runId },
      order: { version: 'ASC' },
      select: ['id', 'version'],
    });

    if (specs.length <= BrowserSpecsService.MAX_SPECS_PER_RUN) return 0;

    const toDelete = specs.slice(0, specs.length - BrowserSpecsService.MAX_SPECS_PER_RUN);
    await this.specRepo.remove(toDelete);
    this.logger.log(`Retention: removed ${toDelete.length} old spec(s) for run ${runId}`);
    return toDelete.length;
  }

  /** Generate spec, persist with version + naming + retention */
  async generateAndPersist(runId: string, baseRunId?: string): Promise<BrowserSpecEntity> {
    const spec = await this.generateByRun(runId, baseRunId);
    const markdown = this.toMarkdown(spec);
    const version = await this.getNextVersion(runId);
    const specName = this.buildSpecName(
      spec.runSummary.targetName,
      spec.runSummary.journeyName,
      version,
    );

    const entity = this.specRepo.create({
      browserRunId: runId,
      baseRunId: baseRunId || null,
      markdownContent: markdown,
      specJson: spec as unknown as Record<string, unknown>,
      pagesVisited: spec.runSummary.pagesVisited,
      problemsCount: spec.runSummary.problemsCount,
      maxSeverity: spec.runSummary.maxSeverity || null,
      overallAssessment: spec.runSummary.overallAssessment,
      version,
      specName,
    });

    const saved = await this.specRepo.save(entity);
    await this.enforceRetention(runId);

    this.logger.log(`Spec saved: ${specName} (v${version}) for run ${runId}`);
    return saved;
  }

  /** List saved specs for a run (with version + name, without heavy content) */
  async findByRun(runId: string): Promise<BrowserSpecEntity[]> {
    return this.specRepo.find({
      where: { browserRunId: runId },
      order: { version: 'DESC' },
      select: ['id', 'browserRunId', 'baseRunId', 'pagesVisited', 'problemsCount', 'maxSeverity', 'overallAssessment', 'version', 'specName', 'createdAt'],
    });
  }

  /** Get a specific saved spec by ID (full content) */
  async findById(id: string): Promise<BrowserSpecEntity> {
    const e = await this.specRepo.findOne({ where: { id } });
    if (!e) throw new NotFoundException('Spec nao encontrado');
    return e;
  }

  /** Get latest spec for a run */
  async findLatest(runId: string): Promise<BrowserSpecEntity | null> {
    return this.specRepo.findOne({
      where: { browserRunId: runId },
      order: { version: 'DESC' },
    });
  }

  // =============================================
  // PDF Export (via Playwright)
  // =============================================

  /** Convert markdown to PDF using headless Chromium */
  async toPdf(markdown: string, runId: string): Promise<string> {
    const htmlContent = this.markdownToHtml(markdown);

    const browser = await chromium.launch({ headless: true });
    const page = await browser.newPage();
    await page.setContent(htmlContent, { waitUntil: 'networkidle' });

    const dir = path.join(ARTIFACTS_DIR, runId);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    const pdfPath = path.join(dir, `spec_${new Date().toISOString().split('T')[0]}.pdf`);

    await page.pdf({
      path: pdfPath,
      format: 'A4',
      margin: { top: '20mm', bottom: '20mm', left: '15mm', right: '15mm' },
      printBackground: true,
    });

    await browser.close();
    this.logger.log(`PDF generated: ${pdfPath}`);
    return pdfPath;
  }

  /** Simple markdown → HTML for PDF rendering */
  private markdownToHtml(md: string): string {
    let html = md
      .replace(/^# (.+)$/gm, '<h1>$1</h1>')
      .replace(/^## (.+)$/gm, '<h2>$1</h2>')
      .replace(/^### (.+)$/gm, '<h3>$1</h3>')
      .replace(/^#### (.+)$/gm, '<h4>$1</h4>')
      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
      .replace(/`(.+?)`/g, '<code>$1</code>')
      .replace(/^- (.+)$/gm, '<li>$1</li>')
      .replace(/^---$/gm, '<hr/>')
      .replace(/^\*(.+)\*$/gm, '<em>$1</em>')
      .replace(/\n\n/g, '</p><p>')
      .replace(/\n/g, '<br/>');

    // Convert table blocks
    html = html.replace(/\|(.+)\|\n\|[-|]+\|\n((?:\|.+\|\n?)+)/g, (_, header, rows) => {
      const ths = header.split('|').filter(Boolean).map((h: string) => `<th>${h.trim()}</th>`).join('');
      const trs = rows.trim().split('\n').map((row: string) => {
        const tds = row.split('|').filter(Boolean).map((c: string) => `<td>${c.trim()}</td>`).join('');
        return `<tr>${tds}</tr>`;
      }).join('');
      return `<table><thead><tr>${ths}</tr></thead><tbody>${trs}</tbody></table>`;
    });

    return `<!DOCTYPE html><html><head><meta charset="utf-8"/>
<style>
  body { font-family: -apple-system, Arial, sans-serif; font-size: 12px; line-height: 1.6; color: #1a1a2e; max-width: 800px; margin: 0 auto; padding: 20px; }
  h1 { font-size: 20px; border-bottom: 2px solid #10b981; padding-bottom: 8px; }
  h2 { font-size: 16px; margin-top: 24px; color: #334155; }
  h3 { font-size: 13px; color: #64748b; }
  table { border-collapse: collapse; width: 100%; margin: 12px 0; }
  th, td { border: 1px solid #e2e8f0; padding: 6px 10px; text-align: left; font-size: 11px; }
  th { background: #f1f5f9; font-weight: 600; }
  code { background: #f1f5f9; padding: 1px 4px; border-radius: 3px; font-size: 10px; }
  li { margin: 2px 0; }
  hr { border: none; border-top: 1px solid #e2e8f0; margin: 20px 0; }
  strong { color: #0f172a; }
  em { color: #94a3b8; font-size: 10px; }
</style></head><body><p>${html}</p></body></html>`;
  }
}
