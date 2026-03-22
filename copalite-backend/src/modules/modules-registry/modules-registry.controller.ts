import { Body, Controller, Get, Param, ParseUUIDPipe, Patch, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiQuery, ApiTags } from '@nestjs/swagger';
import { ModulesRegistryService } from './modules-registry.service';
import { CreateModuleRegistryDto, UpdateModuleRegistryDto } from './dto';

@ApiTags('Modules Registry')
@ApiBearerAuth()
@Controller('modules-registry')
export class ModulesRegistryController {
  constructor(private readonly service: ModulesRegistryService) {}

  @Post()
  async create(@Body() dto: CreateModuleRegistryDto) { return this.service.create(dto); }

  @Get()
  @ApiQuery({ name: 'projectId', required: true })
  async findAll(@Query('projectId', ParseUUIDPipe) projectId: string) { return this.service.findAllByProject(projectId); }

  @Get(':id')
  async findById(@Param('id', ParseUUIDPipe) id: string) { return this.service.findById(id); }

  @Patch(':id')
  async update(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateModuleRegistryDto) { return this.service.update(id, dto); }
}
