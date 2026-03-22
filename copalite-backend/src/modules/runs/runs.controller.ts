import { Body, Controller, Get, Param, ParseUUIDPipe, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiQuery, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { ProjectAccessGuard } from '../../common/guards/project-access.guard';
import { PaginationQueryDto } from '../../common/pipes/pagination';
import { CreateRunDto, CreateRunStepDto, UpdateRunStatusDto } from './dto';
import { RunsService } from './runs.service';

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
  async updateStatus(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateRunStatusDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.runsService.updateStatus(id, dto, userId);
  }

  @Post(':id/steps')
  async createStep(@Param('id', ParseUUIDPipe) id: string, @Body() dto: CreateRunStepDto) {
    return this.runsService.createStep(id, dto);
  }

  @Get(':id/steps')
  async listSteps(@Param('id', ParseUUIDPipe) id: string) { return this.runsService.listSteps(id); }
}
