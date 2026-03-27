import { Body, Controller, Get, Param, ParseUUIDPipe, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiQuery, ApiTags } from '@nestjs/swagger';
import { ProjectAccessGuard } from '../../common/guards/project-access.guard';
import { RouteRegistryService } from './route-registry.service';
import { CreateRouteRegistryDto, UpdateRouteRegistryDto } from './dto';

@ApiTags('Route Registry') @ApiBearerAuth() @UseGuards(ProjectAccessGuard) @Controller('route-registry')
export class RouteRegistryController {
  constructor(private readonly service: RouteRegistryService) {}
  @Post() async create(@Body() dto: CreateRouteRegistryDto) { return this.service.create(dto); }
  @Get() @ApiQuery({ name: 'projectId', required: true })
  async findAll(@Query('projectId', ParseUUIDPipe) projectId: string) { return this.service.findAllByProject(projectId); }
  @Get(':id') async findById(@Param('id', ParseUUIDPipe) id: string) { return this.service.findById(id); }
  @Patch(':id') async update(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateRouteRegistryDto) { return this.service.update(id, dto); }
}
