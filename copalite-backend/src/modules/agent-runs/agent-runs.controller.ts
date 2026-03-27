import { Body, Controller, Get, Param, ParseUUIDPipe, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiQuery, ApiTags } from '@nestjs/swagger';
import { ProjectAccessGuard } from '../../common/guards/project-access.guard';
import { AgentRunsService } from './agent-runs.service';
import { CreateAgentRunDto, UpdateAgentRunStatusDto } from './dto';

@ApiTags('Agent Runs')
@ApiBearerAuth()
@UseGuards(ProjectAccessGuard)
@Controller('agent-runs')
export class AgentRunsController {
  constructor(private readonly agentRunsService: AgentRunsService) {}

  @Post()
  async create(@Body() dto: CreateAgentRunDto) { return this.agentRunsService.create(dto); }

  @Get()
  @ApiQuery({ name: 'runId', required: true })
  async findAll(@Query('runId', ParseUUIDPipe) runId: string) {
    return this.agentRunsService.findAllByRun(runId);
  }

  @Get(':id')
  async findById(@Param('id', ParseUUIDPipe) id: string) { return this.agentRunsService.findById(id); }

  @Patch(':id/status')
  async updateStatus(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateAgentRunStatusDto) {
    return this.agentRunsService.updateStatus(id, dto);
  }
}
