import { Controller, Get, Param, ParseUUIDPipe, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { ProjectAccessGuard } from '../../common/guards/project-access.guard';
import { BrowserProblemsService } from './browser-problems.service';

@ApiTags('Browser Problems')
@ApiBearerAuth()
@UseGuards(ProjectAccessGuard)
@Controller('browser-problems')
export class BrowserProblemsController {
  constructor(private readonly svc: BrowserProblemsService) {}

  @Get('by-run/:runId')
  @ApiOperation({ summary: 'Listar problemas classificados de uma browser run' })
  async findByRun(@Param('runId', ParseUUIDPipe) runId: string) {
    return this.svc.findByRun(runId);
  }

  @Get('summary/:runId')
  @ApiOperation({ summary: 'Resumo de problemas por severidade e tipo' })
  async summary(@Param('runId', ParseUUIDPipe) runId: string) {
    return this.svc.getSummary(runId);
  }

  @Get('diff')
  @ApiOperation({ summary: 'Comparar problemas entre duas runs (novos, resolvidos, persistentes)' })
  @ApiQuery({ name: 'runIdA', required: true })
  @ApiQuery({ name: 'runIdB', required: true })
  async diff(
    @Query('runIdA', ParseUUIDPipe) runIdA: string,
    @Query('runIdB', ParseUUIDPipe) runIdB: string,
  ) {
    return this.svc.diffRuns(runIdA, runIdB);
  }
}
