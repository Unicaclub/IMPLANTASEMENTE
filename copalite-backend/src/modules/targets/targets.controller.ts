import { Body, Controller, Get, Param, ParseUUIDPipe, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { ProjectAccessGuard } from '../../common/guards/project-access.guard';
import { BrowserRunsService } from '../browser-runs/browser-runs.service';
import { TargetSessionsService } from '../target-sessions/target-sessions.service';
import { TargetsService } from './targets.service';
import { CreateTargetDto, UpdateTargetDto } from './dto';

@ApiTags('Targets')
@ApiBearerAuth()
@UseGuards(ProjectAccessGuard)
@Controller('targets')
export class TargetsController {
  constructor(
    private readonly svc: TargetsService,
    private readonly runsSvc: BrowserRunsService,
    private readonly sessionsSvc: TargetSessionsService,
  ) {}

  @Post()
  async create(@Body() dto: CreateTargetDto) { return this.svc.create(dto); }

  @Get()
  @ApiQuery({ name: 'projectId', required: true })
  async findAll(@Query('projectId', ParseUUIDPipe) pid: string) { return this.svc.findAllByProject(pid); }

  @Get(':id')
  async findById(@Param('id', ParseUUIDPipe) id: string) { return this.svc.findById(id); }

  @Patch(':id')
  async update(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateTargetDto) { return this.svc.update(id, dto); }

  @Get(':id/browser-runs')
  @ApiOperation({ summary: 'Browser runs deste target' })
  async findBrowserRuns(@Param('id', ParseUUIDPipe) id: string) { return this.runsSvc.findByTarget(id); }

  @Get(':id/sessions')
  @ApiOperation({ summary: 'Sessions deste target' })
  async findSessions(@Param('id', ParseUUIDPipe) id: string) { return this.sessionsSvc.findByTarget(id); }
}
