import { Body, Controller, Get, Param, ParseUUIDPipe, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiQuery, ApiTags } from '@nestjs/swagger';
import { ProjectAccessGuard } from '../../common/guards/project-access.guard';
import { DecisionsService } from './decisions.service';
import { CreateDecisionDto, UpdateDecisionDto } from './dto';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('Decisions')
@ApiBearerAuth()
@UseGuards(ProjectAccessGuard)
@Controller('decisions')
export class DecisionsController {
  constructor(private readonly decisionsService: DecisionsService) {}

  @Post()
  async create(@Body() dto: CreateDecisionDto, @CurrentUser('id') userId: string) {
    return this.decisionsService.create(dto, userId);
  }

  @Get()
  @ApiQuery({ name: 'projectId', required: true })
  async findAll(@Query('projectId', ParseUUIDPipe) projectId: string) {
    return this.decisionsService.findAllByProject(projectId);
  }

  @Get(':id')
  async findById(@Param('id', ParseUUIDPipe) id: string) { return this.decisionsService.findById(id); }

  @Patch(':id')
  async update(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateDecisionDto) {
    return this.decisionsService.update(id, dto);
  }
}
