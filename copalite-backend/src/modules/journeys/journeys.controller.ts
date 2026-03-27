import { Controller, Delete, Get, Param, ParseUUIDPipe, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { ProjectAccessGuard } from '../../common/guards/project-access.guard';
import { ExecutionLockService } from '../../common/utils/execution-lock.service';
import { ArtifactCleanupService } from '../../common/utils/artifact-cleanup.service';
import { JourneyRunnerService } from './journey-runner.service';

@ApiTags('Journeys')
@ApiBearerAuth()
@UseGuards(ProjectAccessGuard)
@Controller('journeys')
export class JourneysController {
  constructor(
    private readonly svc: JourneyRunnerService,
    private readonly lockService: ExecutionLockService,
    private readonly artifactCleanup: ArtifactCleanupService,
  ) {}

  @Get('available')
  @ApiOperation({ summary: 'Listar jornadas disponiveis' })
  available() { return this.svc.getAvailableJourneys(); }

  @Post('execute/:slug')
  @ApiOperation({ summary: 'Executar jornada por slug' })
  @ApiQuery({ name: 'projectId', required: true })
  @ApiQuery({ name: 'targetId', required: true })
  async execute(
    @Param('slug') slug: string,
    @Query('projectId', ParseUUIDPipe) projectId: string,
    @Query('targetId', ParseUUIDPipe) targetId: string,
  ) { return this.svc.execute(slug, projectId, targetId); }

  @Get()
  @ApiQuery({ name: 'projectId', required: true })
  async findByProject(@Query('projectId', ParseUUIDPipe) pid: string) { return this.svc.findByProject(pid); }

  @Get(':id')
  async findById(@Param('id', ParseUUIDPipe) id: string) { return this.svc.findById(id); }

  @Get(':id/steps')
  async findSteps(@Param('id', ParseUUIDPipe) id: string) { return this.svc.findSteps(id); }

  @Get('diff')
  @ApiOperation({ summary: 'Comparar duas execucoes de jornada' })
  @ApiQuery({ name: 'runIdA', required: true })
  @ApiQuery({ name: 'runIdB', required: true })
  async diff(@Query('runIdA', ParseUUIDPipe) a: string, @Query('runIdB', ParseUUIDPipe) b: string) {
    return this.svc.diffRuns(a, b);
  }

  @Delete('cleanup-e2e')
  @ApiOperation({ summary: 'Limpar dados e2e criados por jornadas de mutacao + artifacts no disco' })
  @ApiQuery({ name: 'projectId', required: true })
  async cleanupE2e(@Query('projectId', ParseUUIDPipe) pid: string) {
    return this.svc.cleanupE2eData(pid);
  }

  // === OPERATIONAL ENDPOINTS ===

  @Get('ops/lock-status')
  @ApiOperation({ summary: 'Status dos advisory locks distribuidos' })
  async lockStatus() {
    return this.lockService.getStatus();
  }

  @Delete('ops/force-unlock')
  @ApiOperation({ summary: 'Forcar liberacao de todos os advisory locks desta sessao' })
  async forceUnlock() {
    await this.lockService.forceReleaseAll();
    return { released: true };
  }

  @Get('ops/artifacts')
  @ApiOperation({ summary: 'Listar artifacts no disco com tamanho e idade' })
  async artifactsList() {
    const usage = this.artifactCleanup.getDiskUsage();
    const artifacts = this.artifactCleanup.listArtifacts();
    return { usage, artifacts };
  }

  @Delete('ops/artifacts/old')
  @ApiOperation({ summary: 'Remover artifacts com mais de 24h' })
  @ApiQuery({ name: 'maxAgeHours', required: false })
  async cleanupOldArtifacts(@Query('maxAgeHours') maxAgeHoursStr?: string) {
    const maxAgeHours = maxAgeHoursStr ? parseInt(maxAgeHoursStr, 10) : 24;
    const result = this.artifactCleanup.removeOlderThan(maxAgeHours * 3600 * 1000);
    return result;
  }
}
