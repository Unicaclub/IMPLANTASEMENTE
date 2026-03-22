import { Body, Controller, Get, Param, ParseUUIDPipe, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiQuery, ApiTags } from '@nestjs/swagger';
import { ProjectAccessGuard } from '../../common/guards/project-access.guard';
import { EvidenceRegistryService } from './evidence-registry.service';
import { CreateEvidenceDto } from './dto';

@ApiTags('Evidence Registry') @ApiBearerAuth() @UseGuards(ProjectAccessGuard)
@Controller('evidence-registry')
export class EvidenceRegistryController {
  constructor(private readonly svc: EvidenceRegistryService) {}
  @Post() async create(@Body() dto: CreateEvidenceDto) { return this.svc.create(dto); }
  @Get() @ApiQuery({ name: 'projectId', required: false }) @ApiQuery({ name: 'runId', required: false }) @ApiQuery({ name: 'relatedEntityType', required: false }) @ApiQuery({ name: 'relatedEntityId', required: false })
  async findAll(
    @Query('projectId') projectId?: string,
    @Query('runId') runId?: string,
    @Query('relatedEntityType') relatedEntityType?: string,
    @Query('relatedEntityId') relatedEntityId?: string,
  ) {
    if (relatedEntityType && relatedEntityId) return this.svc.findAllByRelatedEntity(relatedEntityType, relatedEntityId);
    if (runId) return this.svc.findAllByRun(runId);
    if (projectId) return this.svc.findAllByProject(projectId);
    return [];
  }
  @Get(':id') async findById(@Param('id', ParseUUIDPipe) id: string) { return this.svc.findById(id); }
}
