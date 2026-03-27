import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { ProjectAccessGuard } from '../../common/guards/project-access.guard';
import { ProjectPaginationQueryDto } from '../../common/pipes/pagination';
import { CreateSourceDto, UpdateSourceDto } from './dto';
import { SourcesService } from './sources.service';

@ApiTags('Sources')
@ApiBearerAuth()
@UseGuards(ProjectAccessGuard)
@Controller('sources')
export class SourcesController {
  constructor(private readonly sourcesService: SourcesService) {}

  @Post()
  async create(@Body() dto: CreateSourceDto) {
    return this.sourcesService.create(dto);
  }

  @Get()
  async findAll(@Query() query: ProjectPaginationQueryDto) {
    return this.sourcesService.findAllByProject(query.projectId, query);
  }

  @Get(':id')
  async findById(@Param('id', ParseUUIDPipe) id: string) {
    return this.sourcesService.findById(id);
  }

  @Patch(':id')
  async update(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateSourceDto) {
    return this.sourcesService.update(id, dto);
  }
}
