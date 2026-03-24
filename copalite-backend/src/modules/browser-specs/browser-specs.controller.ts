import { Controller, Get, Param, ParseUUIDPipe, Post, Query, Res } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { Response } from 'express';
import * as fs from 'fs';
import { BrowserSpecsService } from './browser-specs.service';

@ApiTags('Browser Specs')
@ApiBearerAuth()
@Controller('browser-specs')
export class BrowserSpecsController {
  constructor(private readonly svc: BrowserSpecsService) {}

  @Get('by-run/:runId')
  @ApiOperation({ summary: 'Gerar spec por run (JSON — sob demanda)' })
  @ApiQuery({ name: 'baseRunId', required: false })
  async generateByRun(
    @Param('runId', ParseUUIDPipe) runId: string,
    @Query('baseRunId') baseRunId?: string,
  ) {
    return this.svc.generateByRun(runId, baseRunId);
  }

  @Post('by-run/:runId/save')
  @ApiOperation({ summary: 'Gerar e persistir spec no banco' })
  @ApiQuery({ name: 'baseRunId', required: false })
  async saveSpec(
    @Param('runId', ParseUUIDPipe) runId: string,
    @Query('baseRunId') baseRunId?: string,
  ) {
    return this.svc.generateAndPersist(runId, baseRunId);
  }

  @Get('history/:runId')
  @ApiOperation({ summary: 'Listar specs salvos com versao e nome (sem conteudo pesado)' })
  async history(@Param('runId', ParseUUIDPipe) runId: string) {
    return this.svc.findByRun(runId);
  }

  @Get('latest/:runId')
  @ApiOperation({ summary: 'Buscar ultima versao do spec de uma run' })
  async latest(@Param('runId', ParseUUIDPipe) runId: string) {
    return this.svc.findLatest(runId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Buscar spec salvo por ID (com markdown e json)' })
  async findById(@Param('id', ParseUUIDPipe) id: string) {
    return this.svc.findById(id);
  }

  @Get('by-run/:runId/markdown')
  @ApiOperation({ summary: 'Exportar spec como Markdown' })
  @ApiQuery({ name: 'baseRunId', required: false })
  async exportMarkdown(
    @Param('runId', ParseUUIDPipe) runId: string,
    @Res() res: Response,
    @Query('baseRunId') baseRunId?: string,
  ) {
    const spec = await this.svc.generateByRun(runId, baseRunId);
    const markdown = this.svc.toMarkdown(spec);
    const filename = `spec_${runId.substring(0, 8)}_${new Date().toISOString().split('T')[0]}.md`;

    res.setHeader('Content-Type', 'text/markdown; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(markdown);
  }

  @Get('by-run/:runId/pdf')
  @ApiOperation({ summary: 'Exportar spec como PDF' })
  @ApiQuery({ name: 'baseRunId', required: false })
  async exportPdf(
    @Param('runId', ParseUUIDPipe) runId: string,
    @Res() res: Response,
    @Query('baseRunId') baseRunId?: string,
  ) {
    const spec = await this.svc.generateByRun(runId, baseRunId);
    const markdown = this.svc.toMarkdown(spec);
    const pdfPath = await this.svc.toPdf(markdown, runId);
    const filename = `spec_${runId.substring(0, 8)}_${new Date().toISOString().split('T')[0]}.pdf`;

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    fs.createReadStream(pdfPath).pipe(res);
  }
}
