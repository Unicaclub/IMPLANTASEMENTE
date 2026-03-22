import { Body, Controller, Get, Param, ParseUUIDPipe, Patch, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiQuery, ApiTags } from '@nestjs/swagger';
import { AgentOutputsService } from './agent-outputs.service';
import { CreateAgentOutputDto, UpdateAgentOutputValidationDto } from './dto';

@ApiTags('Agent Outputs')
@ApiBearerAuth()
@Controller('agent-outputs')
export class AgentOutputsController {
  constructor(private readonly agentOutputsService: AgentOutputsService) {}

  @Post()
  async create(@Body() dto: CreateAgentOutputDto) { return this.agentOutputsService.create(dto); }

  @Get()
  @ApiQuery({ name: 'agentRunId', required: true })
  async findAll(@Query('agentRunId', ParseUUIDPipe) agentRunId: string) {
    return this.agentOutputsService.findAllByAgentRun(agentRunId);
  }

  @Get(':id')
  async findById(@Param('id', ParseUUIDPipe) id: string) { return this.agentOutputsService.findById(id); }

  @Patch(':id/validation')
  async updateValidation(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateAgentOutputValidationDto) {
    return this.agentOutputsService.updateValidation(id, dto);
  }
}
