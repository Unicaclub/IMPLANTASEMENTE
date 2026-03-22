import { Body, Controller, Get, Param, ParseUUIDPipe, Patch, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiQuery, ApiTags } from '@nestjs/swagger';
import { CodebaseMapService } from './codebase-map.service';
import { CreateCodebaseArtifactDto, UpdateCodebaseArtifactDto } from './dto';

@ApiTags('Codebase Map') @ApiBearerAuth() @Controller('codebase-map')
export class CodebaseMapController {
  constructor(private readonly svc: CodebaseMapService) {}
  @Post() async create(@Body() dto: CreateCodebaseArtifactDto) { return this.svc.create(dto); }
  @Get() @ApiQuery({ name: 'projectId', required: true }) async findAll(@Query('projectId', ParseUUIDPipe) pid: string) { return this.svc.findAllByProject(pid); }
  @Get(':id') async findById(@Param('id', ParseUUIDPipe) id: string) { return this.svc.findById(id); }
  @Patch(':id') async update(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateCodebaseArtifactDto) { return this.svc.update(id, dto); }
}
