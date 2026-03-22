import { Body, Controller, Get, Param, ParseUUIDPipe, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiQuery, ApiTags } from '@nestjs/swagger';
import { ProjectAccessGuard } from '../../common/guards/project-access.guard';
import { RunsService } from './runs.service';
import { CreateRunDto, UpdateRunStatusDto, CreateRunStepDto } from './dto';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { PaginationQueryDto } from '../../common/pipes/pagination';

@ApiTags('Runs')
@ApiBearerAuth()
@UseGuards(ProjectAccessGuard)
@Controller('runs')
export class RunsController {
  constructor(private readonly runsService: RunsService) {}

  @Post()
  async create(@Body() dto: CreateRunDto, @CurrentUser('id') userId: string) {
    return this.runsService.create(dto, userId);
  }

  @Get()
  @ApiQuery({ name: 'projectId', required: true })
  async findAll(@Query('projectId', ParseUUIDPipe) projectId: string, @Query() pagination: PaginationQueryDto) {
    return this.runsService.findAllByProject(projectId, pagination);
  }

  @Get(':id')
  async findById(@Param('id', ParseUUIDPipe) id: string) { return this.runsService.findById(id); }

  @Patch(':id/status')
  async updateStatus(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateRunStatusDto) {
    return this.runsService.updateStatus(id, dto);
  }

  @Post(':id/steps')
  async createStep(@Param('id', ParseUUIDPipe) id: string, @Body() dto: CreateRunStepDto) {
    return this.runsService.createStep(id, dto);
  }

  @Get(':id/steps')
  async listSteps(@Param('id', ParseUUIDPipe) id: string) { return this.runsService.listSteps(id); }
}
