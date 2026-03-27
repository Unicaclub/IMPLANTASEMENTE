import { Body, Controller, Get, Param, ParseUUIDPipe, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiQuery, ApiTags } from '@nestjs/swagger';
import { ProjectAccessGuard } from '../../common/guards/project-access.guard';
import { UiRegistryService } from './ui-registry.service';
import { CreateUiRegistryDto, UpdateUiRegistryDto, CreateUiActionDto } from './dto';

@ApiTags('UI Registry') @ApiBearerAuth() @UseGuards(ProjectAccessGuard) @Controller('ui-registry')
export class UiRegistryController {
  constructor(private readonly svc: UiRegistryService) {}
  @Post() async create(@Body() dto: CreateUiRegistryDto) { return this.svc.create(dto); }
  @Get() @ApiQuery({ name: 'projectId', required: true }) async findAll(@Query('projectId', ParseUUIDPipe) pid: string) { return this.svc.findAllByProject(pid); }
  @Get(':id') async findById(@Param('id', ParseUUIDPipe) id: string) { return this.svc.findById(id); }
  @Patch(':id') async update(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateUiRegistryDto) { return this.svc.update(id, dto); }
  @Post(':id/actions') async createAction(@Param('id', ParseUUIDPipe) id: string, @Body() dto: CreateUiActionDto) { return this.svc.createAction(id, dto); }
  @Get(':id/actions') async listActions(@Param('id', ParseUUIDPipe) id: string) { return this.svc.listActions(id); }
}
