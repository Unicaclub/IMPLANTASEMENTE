import { Controller, Get, Post, Query, Body, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiQuery, ApiTags } from '@nestjs/swagger';
import { AdminGuard } from '../../common/guards/admin.guard';
import { LogsService } from './logs.service';
import { CreateLogDto } from './dto';
import { PaginationQueryDto } from '../../common/pipes/pagination';
import { LogLevel } from '../../common/enums';

@ApiTags('Logs')
@ApiBearerAuth()
@Controller('logs')
export class LogsController {
  constructor(private readonly svc: LogsService) {}

  @Post()
  async create(@Body() dto: CreateLogDto) {
    return this.svc.create(dto);
  }

  @Get()
  @ApiQuery({ name: 'projectId', required: false })
  @ApiQuery({ name: 'runId', required: false })
  async find(
    @Query('projectId') pid?: string,
    @Query('runId') rid?: string,
    @Query() pagination?: PaginationQueryDto,
  ) {
    if (rid) return this.svc.findByRun(rid, pagination);
    if (pid) return this.svc.findByProject(pid, pagination);
    return [];
  }
}

@ApiTags('Admin Logs')
@ApiBearerAuth()
@UseGuards(AdminGuard)
@Controller('admin/logs')
export class AdminLogsController {
  constructor(private readonly svc: LogsService) {}

  @Get()
  @ApiQuery({ name: 'log_level', required: false, enum: LogLevel })
  @ApiQuery({ name: 'run_id', required: false })
  @ApiQuery({ name: 'project_id', required: false })
  @ApiQuery({ name: 'limit', required: false })
  async findAll(
    @Query('log_level') logLevel?: LogLevel,
    @Query('run_id') runId?: string,
    @Query('project_id') projectId?: string,
    @Query('limit') limit?: string,
  ) {
    return this.svc.findAll({
      logLevel,
      runId,
      projectId,
      limit: limit ? parseInt(limit, 10) : undefined,
    });
  }
}
