import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { RunStatus, BacklogStatus, TaskStatus } from '../../common/enums';
import { ProjectEntity } from '../projects/entities/project.entity';
import { SourceEntity } from '../sources/entities/source.entity';
import { RunEntity } from '../runs/entities/run.entity';
import { ModuleRegistryEntity } from '../modules-registry/entities/module-registry.entity';
import { RouteRegistryEntity } from '../route-registry/entities/route-registry.entity';
import { ApiRegistryEntity } from '../api-registry/entities/api-registry.entity';
import { SchemaRegistryEntity } from '../schema-registry/entities/schema-registry.entity';
import { UiRegistryEntity } from '../ui-registry/entities/ui-registry.entity';
import { EvidenceRegistryEntity } from '../evidence-registry/entities/evidence-registry.entity';
import { BacklogItemEntity } from '../backlog/entities/backlog-item.entity';
import { TaskEntity } from '../tasks/entities/task.entity';

@Injectable()
export class DashboardService {
  constructor(
    @InjectRepository(ProjectEntity) private readonly projectRepo: Repository<ProjectEntity>,
    @InjectRepository(SourceEntity) private readonly sourceRepo: Repository<SourceEntity>,
    @InjectRepository(RunEntity) private readonly runRepo: Repository<RunEntity>,
    @InjectRepository(ModuleRegistryEntity) private readonly moduleRepo: Repository<ModuleRegistryEntity>,
    @InjectRepository(RouteRegistryEntity) private readonly routeRepo: Repository<RouteRegistryEntity>,
    @InjectRepository(ApiRegistryEntity) private readonly apiRepo: Repository<ApiRegistryEntity>,
    @InjectRepository(SchemaRegistryEntity) private readonly schemaRepo: Repository<SchemaRegistryEntity>,
    @InjectRepository(UiRegistryEntity) private readonly uiRepo: Repository<UiRegistryEntity>,
    @InjectRepository(EvidenceRegistryEntity) private readonly evidenceRepo: Repository<EvidenceRegistryEntity>,
    @InjectRepository(BacklogItemEntity) private readonly backlogRepo: Repository<BacklogItemEntity>,
    @InjectRepository(TaskEntity) private readonly taskRepo: Repository<TaskEntity>,
  ) {}

  async exportReport(projectId: string) {
    const dashboard = await this.getProjectDashboard(projectId);

    const [modules, routes, apis, schemas, uiScreens, evidence, backlog] = await Promise.all([
      this.moduleRepo.find({ where: { projectId }, order: { name: 'ASC' } }),
      this.routeRepo.find({ where: { projectId }, order: { path: 'ASC' } }),
      this.apiRepo.find({ where: { projectId }, order: { path: 'ASC' } }),
      this.schemaRepo.find({ where: { projectId }, order: { entityName: 'ASC' } }),
      this.uiRepo.find({ where: { projectId }, order: { screenName: 'ASC' } }),
      this.evidenceRepo.find({ where: { projectId }, order: { title: 'ASC' } }),
      this.backlogRepo.find({ where: { projectId }, order: { priority: 'ASC' } }),
    ]);

    return {
      exportedAt: new Date().toISOString(),
      dashboard,
      registries: { modules, routes, apis, schemas, uiScreens, evidence },
      backlog,
    };
  }

  async getProjectDashboard(projectId: string) {
    const project = await this.projectRepo.findOne({ where: { id: projectId } });
    if (!project) throw new NotFoundException('Project not found');

    const [
      sourcesCount,
      runsTotal,
      runsCompleted,
      runsRunning,
      runsFailed,
      modulesCount,
      routesCount,
      apisCount,
      schemasCount,
      uiScreensCount,
      evidenceCount,
      backlogTotal,
      backlogOpen,
      backlogApproved,
      tasksTotal,
      tasksDone,
      tasksInProgress,
    ] = await Promise.all([
      this.sourceRepo.count({ where: { projectId } }),
      this.runRepo.count({ where: { projectId } }),
      this.runRepo.count({ where: { projectId, status: RunStatus.COMPLETED } }),
      this.runRepo.count({ where: { projectId, status: RunStatus.RUNNING } }),
      this.runRepo.count({ where: { projectId, status: RunStatus.FAILED } }),
      this.moduleRepo.count({ where: { projectId } }),
      this.routeRepo.count({ where: { projectId } }),
      this.apiRepo.count({ where: { projectId } }),
      this.schemaRepo.count({ where: { projectId } }),
      this.uiRepo.count({ where: { projectId } }),
      this.evidenceRepo.count({ where: { projectId } }),
      this.backlogRepo.count({ where: { projectId } }),
      this.backlogRepo.count({ where: { projectId, status: BacklogStatus.OPEN } }),
      this.backlogRepo.count({ where: { projectId, approvedForTask: true } }),
      this.taskRepo.count({ where: { projectId } }),
      this.taskRepo.count({ where: { projectId, status: TaskStatus.DONE } }),
      this.taskRepo.count({ where: { projectId, status: TaskStatus.IN_PROGRESS } }),
    ]);

    // Last 5 runs
    const recentRuns = await this.runRepo.find({
      where: { projectId },
      order: { createdAt: 'DESC' },
      take: 5,
      select: ['id', 'title', 'runType', 'status', 'createdAt', 'finishedAt'],
    });

    return {
      project: {
        id: project.id,
        name: project.name,
        slug: project.slug,
        status: project.status,
        projectType: project.projectType,
      },
      sources: { total: sourcesCount },
      runs: {
        total: runsTotal,
        completed: runsCompleted,
        running: runsRunning,
        failed: runsFailed,
        recent: recentRuns,
      },
      registries: {
        modules: modulesCount,
        routes: routesCount,
        apis: apisCount,
        schemas: schemasCount,
        uiScreens: uiScreensCount,
        totalDiscovered: modulesCount + routesCount + apisCount + schemasCount + uiScreensCount,
      },
      evidence: { total: evidenceCount },
      backlog: {
        total: backlogTotal,
        open: backlogOpen,
        approved: backlogApproved,
      },
      tasks: {
        total: tasksTotal,
        done: tasksDone,
        inProgress: tasksInProgress,
      },
    };
  }
}
