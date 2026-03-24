import { Body, Controller, Get, Param, ParseUUIDPipe, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { BrowserEvidenceService } from './browser-evidence.service';
import { CreateBrowserEvidenceDto } from './dto';

@ApiTags('Browser Evidence')
@ApiBearerAuth()
@Controller('browser-evidence')
export class BrowserEvidenceController {
  constructor(private readonly svc: BrowserEvidenceService) {}

  @Post()
  async create(@Body() dto: CreateBrowserEvidenceDto) { return this.svc.create(dto); }

  @Post('batch')
  @ApiOperation({ summary: 'Criar multiplas evidencias de uma vez' })
  async createBatch(@Body() dtos: CreateBrowserEvidenceDto[]) { return this.svc.createBatch(dtos); }

  @Get('by-run/:runId')
  async findByRun(@Param('runId', ParseUUIDPipe) runId: string) { return this.svc.findByRun(runId); }
}
