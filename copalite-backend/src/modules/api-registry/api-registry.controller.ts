import { Body, Controller, Get, Param, ParseUUIDPipe, Patch, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiQuery, ApiTags } from '@nestjs/swagger';
import { ApiRegistryService } from './api-registry.service';
import { CreateApiRegistryDto, UpdateApiRegistryDto } from './dto';

@ApiTags('API Registry') @ApiBearerAuth() @Controller('api-registry')
export class ApiRegistryController {
  constructor(private readonly svc: ApiRegistryService) {}
  @Post() async create(@Body() dto: CreateApiRegistryDto) { return this.svc.create(dto); }
  @Get() @ApiQuery({ name: 'projectId', required: true }) async findAll(@Query('projectId', ParseUUIDPipe) projectId: string) { return this.svc.findAllByProject(projectId); }
  @Get(':id') async findById(@Param('id', ParseUUIDPipe) id: string) { return this.svc.findById(id); }
  @Patch(':id') async update(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateApiRegistryDto) { return this.svc.update(id, dto); }
}
