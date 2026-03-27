import { BadRequestException, Body, Controller, Get, Param, ParseUUIDPipe, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiQuery, ApiTags } from '@nestjs/swagger';
import { ProjectAccessGuard } from '../../common/guards/project-access.guard';
import { AgentOutputsService } from './agent-outputs.service';
import { CreateAgentOutputDto, UpdateAgentOutputValidationDto } from './dto';

@ApiTags('Agent Outputs')
@ApiBearerAuth()
@UseGuards(ProjectAccessGuard)
@Controller('agent-outputs')
export class AgentOutputsController {
  constructor(private readonly agentOutputsService: AgentOutputsService) {}

  @Post()
  async create(@Body() dto: CreateAgentOutputDto) { return this.agentOutputsService.create(dto); }

  @Get()
  @ApiQuery({ name: 'agentRunId', required: false, description: 'Filter by agent run ID (UUID)' })
  @ApiQuery({ name: 'runId', required: false, description: 'Filter by run ID (UUID) — returns outputs from all agent runs of this run' })
  async findAll(
    @Query('agentRunId') agentRunId?: string,
    @Query('runId') runId?: string,
  ) {
    if (agentRunId) {
      const pipe = new ParseUUIDPipe({ version: '4' });
      const validated = await pipe.transform(agentRunId, { type: 'query', metatype: String, data: 'agentRunId' });
      return this.agentOutputsService.findAllByAgentRun(validated);
    }
    if (runId) {
      const pipe = new ParseUUIDPipe({ version: '4' });
      const validated = await pipe.transform(runId, { type: 'query', metatype: String, data: 'runId' });
      return this.agentOutputsService.findAllByRun(validated);
    }
    throw new BadRequestException('Either agentRunId or runId query parameter is required (must be a valid UUID)');
  }

  @Get(':id')
  async findById(@Param('id', ParseUUIDPipe) id: string) { return this.agentOutputsService.findById(id); }

  @Patch(':id/validation')
  async updateValidation(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateAgentOutputValidationDto) {
    return this.agentOutputsService.updateValidation(id, dto);
  }
}
