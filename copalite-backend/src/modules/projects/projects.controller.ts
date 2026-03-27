import { Body, Controller, Get, Param, ParseUUIDPipe, Patch, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { WorkspacePaginationQueryDto } from '../../common/pipes/pagination';
import { CreateProjectDto, UpdateProjectDto } from './dto';
import { ProjectsService } from './projects.service';

@ApiTags('Projects')
@ApiBearerAuth()
// RBAC: Uses service-level validation (workspace membership checked via userId in each method).
// Cannot use ProjectAccessGuard at class level because listing is workspace-scoped, not project-scoped.
@Controller('projects')
export class ProjectsController {
  constructor(private readonly projectsService: ProjectsService) {}

  @Post()
  async create(@Body() dto: CreateProjectDto, @CurrentUser('id') userId: string) {
    return this.projectsService.create(dto, userId);
  }

  @Get()
  async findAll(@Query() query: WorkspacePaginationQueryDto, @CurrentUser('id') userId: string) {
    return this.projectsService.findAllByWorkspace(query.workspaceId, query, userId);
  }

  @Get(':id')
  async findById(@Param('id', ParseUUIDPipe) id: string, @CurrentUser('id') userId: string) {
    return this.projectsService.findById(id, userId);
  }

  @Patch(':id')
  async update(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateProjectDto, @CurrentUser('id') userId: string) {
    return this.projectsService.update(id, dto, userId);
  }
}
