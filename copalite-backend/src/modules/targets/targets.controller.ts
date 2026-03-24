import { Body, Controller, Get, Param, ParseUUIDPipe, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiQuery, ApiTags } from '@nestjs/swagger';
import { ProjectAccessGuard } from '../../common/guards/project-access.guard';
import { TargetsService } from './targets.service';
import { CreateTargetDto, UpdateTargetDto } from './dto';

@ApiTags('Targets')
@ApiBearerAuth()
@UseGuards(ProjectAccessGuard)
@Controller('targets')
export class TargetsController {
  constructor(private readonly svc: TargetsService) {}

  @Post()
  async create(@Body() dto: CreateTargetDto) { return this.svc.create(dto); }

  @Get()
  @ApiQuery({ name: 'projectId', required: true })
  async findAll(@Query('projectId', ParseUUIDPipe) pid: string) { return this.svc.findAllByProject(pid); }

  @Get(':id')
  async findById(@Param('id', ParseUUIDPipe) id: string) { return this.svc.findById(id); }

  @Patch(':id')
  async update(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateTargetDto) { return this.svc.update(id, dto); }
}
