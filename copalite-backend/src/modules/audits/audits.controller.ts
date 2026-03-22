import { Body, Controller, Get, Param, ParseUUIDPipe, Patch, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiQuery, ApiTags } from '@nestjs/swagger';
import { AuditsService } from './audits.service';
import { CreateAuditDto, UpdateAuditDto } from './dto';
@ApiTags('Audits') @ApiBearerAuth() @Controller('audits')
export class AuditsController {
  constructor(private readonly svc: AuditsService) {}
  @Post() async create(@Body() dto: CreateAuditDto) { return this.svc.create(dto); }
  @Get() @ApiQuery({ name: 'projectId', required: true }) async findAll(@Query('projectId', ParseUUIDPipe) pid: string) { return this.svc.findAllByProject(pid); }
  @Get(':id') async findById(@Param('id', ParseUUIDPipe) id: string) { return this.svc.findById(id); }
  @Patch(':id') async update(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateAuditDto) { return this.svc.update(id, dto); }
}
