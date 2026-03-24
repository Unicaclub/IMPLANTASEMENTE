import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { LessThan, Repository } from 'typeorm';
import { RunEntity } from '../runs/entities/run.entity';
import { RunStepEntity } from '../runs/entities/run-step.entity';
import { AgentRunEntity } from '../agent-runs/entities/agent-run.entity';
import { LogsService } from '../logs/logs.service';
import { NotificationsService } from '../notifications/notifications.service';
import { ProjectEntity } from '../projects/entities/project.entity';
import { LogLevel, RunStatus } from '../../common/enums';

const RUN_TIMEOUT_MINUTES = 30;
const CHECK_INTERVAL_MS = 5 * 60 * 1000; // every 5 minutes

@Injectable()
export class RunWatchdogService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(RunWatchdogService.name);
  private intervalRef: ReturnType<typeof setInterval> | null = null;

  constructor(
    @InjectRepository(RunEntity) private readonly runRepo: Repository<RunEntity>,
    @InjectRepository(RunStepEntity) private readonly stepRepo: Repository<RunStepEntity>,
    @InjectRepository(AgentRunEntity) private readonly agentRunRepo: Repository<AgentRunEntity>,
    @InjectRepository(ProjectEntity) private readonly projectRepo: Repository<ProjectEntity>,
    private readonly logsService: LogsService,
    private readonly notificationsService: NotificationsService,
  ) {}

  onModuleInit() {
    this.intervalRef = setInterval(() => {
      this.checkStuckRuns().catch(err => {
        this.logger.error(`Watchdog check failed: ${err.message}`);
      });
    }, CHECK_INTERVAL_MS);
    this.logger.log(`Run watchdog started (timeout: ${RUN_TIMEOUT_MINUTES}min, interval: ${CHECK_INTERVAL_MS / 1000}s)`);
  }

  onModuleDestroy() {
    if (this.intervalRef) {
      clearInterval(this.intervalRef);
      this.intervalRef = null;
    }
  }

  async checkStuckRuns(): Promise<number> {
    const cutoff = new Date(Date.now() - RUN_TIMEOUT_MINUTES * 60 * 1000);

    const stuckRuns = await this.runRepo.find({
      where: {
        status: RunStatus.RUNNING,
        startedAt: LessThan(cutoff),
      },
    });

    if (stuckRuns.length === 0) return 0;

    this.logger.warn(`Watchdog found ${stuckRuns.length} stuck run(s)`);

    for (const run of stuckRuns) {
      try {
        // Mark run as failed
        run.status = RunStatus.FAILED;
        run.finishedAt = new Date();
        await this.runRepo.save(run);

        // Mark stuck steps as failed
        await this.stepRepo.createQueryBuilder()
          .update(RunStepEntity)
          .set({ status: RunStatus.FAILED, finishedAt: new Date(), notes: 'Watchdog timeout' })
          .where('run_id = :runId AND status IN (:...statuses)', {
            runId: run.id,
            statuses: [RunStatus.RUNNING, RunStatus.PENDING],
          })
          .execute();

        // Mark stuck agent runs as failed
        await this.agentRunRepo.createQueryBuilder()
          .update(AgentRunEntity)
          .set({ status: RunStatus.FAILED, finishedAt: new Date() })
          .where('run_id = :runId AND status IN (:...statuses)', {
            runId: run.id,
            statuses: [RunStatus.RUNNING, RunStatus.PENDING],
          })
          .execute();

        // Log
        await this.logsService.logRun(run.id, LogLevel.ERROR,
          `Watchdog: run marcada como failed apos ${RUN_TIMEOUT_MINUTES} minutos sem progresso`);

        // Notify
        const project = await this.projectRepo.findOne({
          where: { id: run.projectId },
          select: ['workspaceId'],
        });
        if (project?.workspaceId) {
          this.notificationsService.notify(
            project.workspaceId,
            'run_timeout',
            `Run expirou: ${run.title}`,
            `A run "${run.title}" foi cancelada pelo watchdog apos ${RUN_TIMEOUT_MINUTES} minutos sem progresso`,
            run.createdByUserId ?? undefined,
          );
        }

        this.logger.warn(`Watchdog marked run ${run.id} ("${run.title}") as FAILED`);
      } catch (err) {
        this.logger.error(`Watchdog failed to process run ${run.id}: ${err}`);
      }
    }

    return stuckRuns.length;
  }
}
