import { Body, Controller, Get, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiQuery, ApiTags } from '@nestjs/swagger';
import { LogLevel } from '../../common/enums';
import { AdminGuard } from '../../common/guards/admin.guard';
import { LogsPaginationQueryDto } from '../../common/pipes/pagination';
import { CreateLogDto } from './dto';
import { LogsService } from './logs.service';

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
  async find(@Query() query: LogsPaginationQueryDto) {
    if (query.runId) return this.svc.findByRun(query.runId, query);
    if (query.projectId) return this.svc.findByProject(query.projectId, query);
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
