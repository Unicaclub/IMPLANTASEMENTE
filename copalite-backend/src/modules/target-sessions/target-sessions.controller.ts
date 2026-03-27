import { Body, Controller, Get, Param, ParseUUIDPipe, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { ProjectAccessGuard } from '../../common/guards/project-access.guard';
import { TargetSessionsService } from './target-sessions.service';
import { CreateSessionDto, ValidateSessionDto, UpdateSessionDto } from './dto';

@ApiTags('Target Sessions')
@ApiBearerAuth()
@UseGuards(ProjectAccessGuard)
@Controller('target-sessions')
export class TargetSessionsController {
  constructor(private readonly svc: TargetSessionsService) {}

  @Post()
  async create(@Body() dto: CreateSessionDto) { return this.svc.create(dto); }

  @Post('validate')
  @ApiOperation({ summary: 'Validar ou criar session para target (scaffold — Sprint 1)' })
  async validate(@Body() dto: ValidateSessionDto) { return this.svc.validate(dto); }

  @Get(':id')
  async findById(@Param('id', ParseUUIDPipe) id: string) { return this.svc.findById(id); }

  @Get()
  @ApiQuery({ name: 'targetId', required: true })
  async findByTarget(@Query('targetId', ParseUUIDPipe) tid: string) { return this.svc.findByTarget(tid); }

  @Patch(':id')
  async update(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateSessionDto) { return this.svc.update(id, dto); }
}
