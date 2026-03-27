import { Body, Controller, Get, Param, ParseUUIDPipe, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiQuery, ApiTags } from '@nestjs/swagger';
import { AdminGuard } from '../../common/guards/admin.guard';
import { PromptsService } from './prompts.service';
import { CreatePromptDto, UpdatePromptDto } from './dto';

@ApiTags('Prompts')
@ApiBearerAuth()
@UseGuards(AdminGuard)
@Controller('prompts')
export class PromptsController {
  constructor(private readonly promptsService: PromptsService) {}

  @Post()
  async create(@Body() dto: CreatePromptDto) { return this.promptsService.create(dto); }

  @Get()
  @ApiQuery({ name: 'agentId', required: true })
  async findAll(@Query('agentId', ParseUUIDPipe) agentId: string) {
    return this.promptsService.findAllByAgent(agentId);
  }

  @Get(':id')
  async findById(@Param('id', ParseUUIDPipe) id: string) { return this.promptsService.findById(id); }

  @Patch(':id')
  async update(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdatePromptDto) {
    return this.promptsService.update(id, dto);
  }
}
