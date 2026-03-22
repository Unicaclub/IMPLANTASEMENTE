import { Body, Controller, Get, Param, ParseUUIDPipe, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiQuery, ApiTags } from '@nestjs/swagger';
import { ProjectAccessGuard } from '../../common/guards/project-access.guard';
import { ComparisonsService } from './comparisons.service';
import { CreateComparisonDto, CreateDiffDto } from './dto';

@ApiTags('Comparisons') @ApiBearerAuth() @UseGuards(ProjectAccessGuard)
@Controller('comparisons')
export class ComparisonsController {
  constructor(private readonly svc: ComparisonsService) {}
  @Post() async create(@Body() dto: CreateComparisonDto) { return this.svc.create(dto); }
  @Get() @ApiQuery({ name: 'projectId', required: true }) async findAll(@Query('projectId', ParseUUIDPipe) pid: string) { return this.svc.findAllByProject(pid); }
  @Get(':id') async findById(@Param('id', ParseUUIDPipe) id: string) { return this.svc.findById(id); }
  @Post(':id/diffs') async createDiff(@Param('id', ParseUUIDPipe) id: string, @Body() dto: CreateDiffDto) { return this.svc.createDiff(id, dto); }
  @Get(':id/diffs') async listDiffs(@Param('id', ParseUUIDPipe) id: string) { return this.svc.listDiffs(id); }
}
