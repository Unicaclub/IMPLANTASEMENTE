import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiQuery, ApiTags } from '@nestjs/swagger';
import { LogsService } from './logs.service';
import { CreateLogDto } from './dto';
import { PaginationQueryDto } from '../../common/pipes/pagination';

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
