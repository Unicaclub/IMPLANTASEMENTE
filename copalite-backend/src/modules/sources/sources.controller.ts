import { Body, Controller, Get, Param, ParseUUIDPipe, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiQuery, ApiTags } from '@nestjs/swagger';
import { SourcesService } from './sources.service';
import { CreateSourceDto, UpdateSourceDto } from './dto';
import { ProjectAccessGuard } from '../../common/guards/project-access.guard';
import { PaginationQueryDto } from '../../common/pipes/pagination';

@ApiTags('Sources')
@ApiBearerAuth()
@UseGuards(ProjectAccessGuard)
@Controller('sources')
export class SourcesController {
  constructor(private readonly sourcesService: SourcesService) {}

  @Post()
  async create(@Body() dto: CreateSourceDto) { return this.sourcesService.create(dto); }

  @Get()
  @ApiQuery({ name: 'projectId', required: true })
  async findAll(@Query('projectId', ParseUUIDPipe) projectId: string, @Query() pagination: PaginationQueryDto) {
    return this.sourcesService.findAllByProject(projectId, pagination);
  }

  @Get(':id')
  async findById(@Param('id', ParseUUIDPipe) id: string) { return this.sourcesService.findById(id); }

  @Patch(':id')
  async update(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateSourceDto) {
    return this.sourcesService.update(id, dto);
  }
}
