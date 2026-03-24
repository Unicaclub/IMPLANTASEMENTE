import { Body, Controller, Get, Param, ParseUUIDPipe, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { ProjectAccessGuard } from '../../common/guards/project-access.guard';
import { BrowserAgentService } from './browser-agent.service';
import { BrowserRunsService } from './browser-runs.service';
import { CreateBrowserRunDto, UpdateBrowserRunDto } from './dto';

@ApiTags('Browser Runs')
@ApiBearerAuth()
@UseGuards(ProjectAccessGuard)
@Controller('browser-runs')
export class BrowserRunsController {
  constructor(
    private readonly svc: BrowserRunsService,
    private readonly agent: BrowserAgentService,
  ) {}

  @Post()
  async create(@Body() dto: CreateBrowserRunDto) { return this.svc.create(dto); }

  @Post(':id/execute')
  @ApiOperation({ summary: 'Executar browser run real com Playwright (headless Chromium)' })
  async execute(@Param('id', ParseUUIDPipe) id: string) {
    return this.agent.execute(id);
  }

  @Get()
  @ApiQuery({ name: 'projectId', required: false })
  @ApiQuery({ name: 'targetId', required: false })
  async findAll(@Query('projectId') pid?: string, @Query('targetId') tid?: string) {
    if (tid) return this.svc.findByTarget(tid);
    if (pid) return this.svc.findByProject(pid);
    return [];
  }

  @Get(':id')
  async findById(@Param('id', ParseUUIDPipe) id: string) { return this.svc.findById(id); }

  @Patch(':id')
  async update(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateBrowserRunDto) { return this.svc.update(id, dto); }
}
