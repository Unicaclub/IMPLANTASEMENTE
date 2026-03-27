import { Body, Controller, Get, Param, ParseUUIDPipe, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { ProjectAccessGuard } from '../../common/guards/project-access.guard';
import { ReportsService } from './reports.service';
import { CreateReportDto, UpdateReportDto } from './dto';

@ApiTags('Reports')
@ApiBearerAuth()
@UseGuards(ProjectAccessGuard)
@Controller('reports')
export class ReportsController {
  constructor(private readonly svc: ReportsService) {}

  @Post()
  async create(@Body() dto: CreateReportDto) { return this.svc.create(dto); }

  @Get()
  @ApiQuery({ name: 'projectId', required: true })
  @ApiOperation({ summary: 'Listar relatórios (sem content_markdown)' })
  async findAll(@Query('projectId', ParseUUIDPipe) pid: string) { return this.svc.findAllByProject(pid); }

  @Get(':id')
  @ApiOperation({ summary: 'Detalhe do relatório (com content_markdown)' })
  async findById(@Param('id', ParseUUIDPipe) id: string) { return this.svc.findById(id); }

  @Patch(':id')
  async update(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateReportDto) { return this.svc.update(id, dto); }

  @Post('generate-from-run/:runId')
  @ApiOperation({ summary: 'Gerar relatório técnico automaticamente a partir de uma run (idempotente)' })
  async generateFromRun(
    @Param('runId', ParseUUIDPipe) runId: string,
    @Query('projectId') projectId?: string,
  ) {
    return this.svc.generateFromRun(runId, projectId);
  }
}
