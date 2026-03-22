import { Body, Controller, Get, Param, ParseUUIDPipe, Patch, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { AgentsService } from './agents.service';
import { CreateAgentDto, UpdateAgentDto } from './dto';

@ApiTags('Agents')
@ApiBearerAuth()
@Controller('agents')
export class AgentsController {
  constructor(private readonly agentsService: AgentsService) {}

  @Post()
  async create(@Body() dto: CreateAgentDto) { return this.agentsService.create(dto); }

  @Get()
  async findAll() { return this.agentsService.findAll(); }

  @Get(':id')
  async findById(@Param('id', ParseUUIDPipe) id: string) { return this.agentsService.findById(id); }

  @Patch(':id')
  async update(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateAgentDto) {
    return this.agentsService.update(id, dto);
  }
}
