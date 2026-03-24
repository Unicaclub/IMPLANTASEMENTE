import { BadRequestException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { ComparisonResultStatus, LogLevel, SeverityLevel, StatusBase } from '../../common/enums';
import { BacklogItemEntity } from '../backlog/entities/backlog-item.entity';
import { ComparisonEntity } from '../comparisons/entities/comparison.entity';
import { DiffEntity } from '../comparisons/entities/diff.entity';
import { LogsService } from '../logs/logs.service';
import { ModuleRegistryEntity } from '../modules-registry/entities/module-registry.entity';
import { NotificationsService } from '../notifications/notifications.service';
import { ProjectEntity } from '../projects/entities/project.entity';
import { RunEntity } from '../runs/entities/run.entity';
import { ReportEntity } from './entities/report.entity';
import { CreateReportDto, UpdateReportDto } from './dto';

@Injectable()
export class ReportsService {
  private readonly logger = new Logger(ReportsService.name);

  constructor(
    @InjectRepository(ReportEntity) private readonly repo: Repository<ReportEntity>,
    @InjectRepository(RunEntity) private readonly runRepo: Repository<RunEntity>,
    @InjectRepository(ComparisonEntity) private readonly compRepo: Repository<ComparisonEntity>,
    @InjectRepository(DiffEntity) private readonly diffRepo: Repository<DiffEntity>,
    @InjectRepository(ModuleRegistryEntity) private readonly moduleRepo: Repository<ModuleRegistryEntity>,
    @InjectRepository(BacklogItemEntity) private readonly backlogRepo: Repository<BacklogItemEntity>,
    private readonly logsService: LogsService,
    private readonly notificationsService: NotificationsService,
    private readonly dataSource: DataSource,
  ) {}

  async create(dto: CreateReportDto) {
    return this.repo.save(this.repo.create(dto));
  }

  async findAllByProject(projectId: string) {
    // Exclude content_markdown from list
    return this.repo.find({
      where: { projectId },
      order: { createdAt: 'DESC' },
      select: ['id', 'projectId', 'runId', 'reportType', 'title', 'summary', 'status', 'createdAt', 'updatedAt'],
    });
  }

  async findById(id: string) {
    const e = await this.repo.findOne({ where: { id } });
    if (!e) throw new NotFoundException('Relatório não encontrado');
    return e;
  }

  async update(id: string, dto: UpdateReportDto) {
    const e = await this.findById(id);

    // Draft → active is allowed; active → draft is forbidden
    if (dto.status && e.status === StatusBase.ACTIVE && dto.status === StatusBase.DRAFT) {
      throw new BadRequestException('Não é possível reverter um relatório ativo para rascunho');
    }

    Object.assign(e, dto);
    return this.repo.save(e);
  }

  async generateFromRun(runId: string, projectId?: string) {
    // Idempotency
    const existing = await this.repo.findOne({ where: { runId, reportType: 'technical' } });
    if (existing) return existing;

    // Fetch run
    const run = await this.runRepo.findOne({ where: { id: runId } });
    const runTitle = run?.title || runId;
    const resolvedProjectId = projectId || run?.projectId;
    if (!resolvedProjectId) throw new NotFoundException('Não foi possível resolver o projectId da run');

    // Fetch modules
    const modules = await this.moduleRepo.find({ where: { runId } });

    // Fetch comparisons + diffs
    const comparisons = await this.compRepo.find({ where: { runId } });
    const compIds = comparisons.map(c => c.id);
    let diffs: DiffEntity[] = [];
    if (compIds.length > 0) {
      diffs = await this.diffRepo.createQueryBuilder('d')
        .where('d.comparison_id IN (:...compIds)', { compIds })
        .getMany();
    }

    // Count backlog items by priority
    const backlogItems = await this.backlogRepo.find({ where: { runId } });
    const backlogByPriority: Record<string, number> = {};
    for (const b of backlogItems) {
      const key = b.priority || 'medium';
      backlogByPriority[key] = (backlogByPriority[key] || 0) + 1;
    }

    // Critical/high diffs
    const criticalDiffs = diffs.filter(d =>
      d.severity === SeverityLevel.CRITICAL || d.severity === SeverityLevel.HIGH
    );

    // Build markdown
    const finishedAt = run?.finishedAt
      ? new Date(run.finishedAt).toLocaleDateString('pt-BR')
      : new Date().toLocaleDateString('pt-BR');

    const md = [
      `# Relatório Técnico: ${runTitle}`,
      `**Tipo:** ${run?.runType || 'N/A'} | **Data:** ${finishedAt}`,
      '',
      '## Objetivo da Run',
      run?.goal || 'Não especificado',
      '',
      '## Módulos Identificados',
      modules.length > 0
        ? modules.map(m => `- **${m.name}** (${m.layerType}) — ${m.description || 'sem descrição'}`).join('\n')
        : '_Nenhum módulo identificado nesta run_',
      '',
      '## Comparações Realizadas',
      comparisons.length > 0
        ? comparisons.map(c => `- ${c.comparisonType}: **${c.resultStatus}** — ${c.sourceARef} vs ${c.sourceBRef}`).join('\n')
        : '_Nenhuma comparação registrada_',
      '',
      '## Divergências Encontradas',
      criticalDiffs.length > 0
        ? criticalDiffs.map(d => `- **[${d.severity.toUpperCase()}]** ${d.title}: ${d.description || ''}`).join('\n')
        : '_Nenhuma divergência crítica ou alta_',
      '',
      '## Backlog Gerado',
      backlogItems.length > 0
        ? Object.entries(backlogByPriority).map(([k, v]) => `- ${k}: ${v} itens`).join('\n')
        : '_Nenhum item de backlog gerado_',
      '',
      '## Próximos Passos',
      '- Revisar itens críticos do backlog',
      '- Validar evidências marcadas como divergent',
      '- Executar nova run após correções',
    ].join('\n');

    const summary = `${comparisons.length} comparações, ${criticalDiffs.length} divergências críticas/altas, ${backlogItems.length} itens de backlog`;

    const report = this.repo.create({
      projectId: resolvedProjectId,
      runId,
      reportType: 'technical',
      title: `Relatório Técnico: ${runTitle}`,
      summary,
      contentMarkdown: md,
      status: StatusBase.DRAFT,
    });

    const saved = await this.repo.save(report);

    // Log + notify
    await this.logsService.logRun(runId, LogLevel.INFO, 'Relatório técnico gerado');

    this.notifyProject(resolvedProjectId, 'report_generated', `Relatório gerado: ${runTitle}`);

    return saved;
  }

  private notifyProject(projectId: string, type: string, message: string) {
    this.dataSource.getRepository(ProjectEntity).findOne({
      where: { id: projectId },
      select: ['workspaceId'],
    }).then((project) => {
      if (project?.workspaceId) {
        this.notificationsService.notify(project.workspaceId, type, message, message);
      }
    }).catch((err: Error) => {
      this.logger.warn(`Failed to send report notification: ${err.message}`);
    });
  }
}
