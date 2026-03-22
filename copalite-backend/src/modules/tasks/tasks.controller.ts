import { Body, Controller, Get, Param, ParseUUIDPipe, Patch, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { TasksService } from './tasks.service';
import { CreateTaskFromBacklogDto, UpdateTaskDto } from './dto';
import { PaginationQueryDto } from '../../common/pipes/pagination';

@ApiTags('Tasks') @ApiBearerAuth() @Controller('tasks')
export class TasksController {
  constructor(private readonly svc: TasksService) {}

  @Post('from-backlog')
  @ApiOperation({ summary: 'Create task from approved backlog item (human gate enforced)' })
  async createFromBacklog(@Body() dto: CreateTaskFromBacklogDto) {
    return this.svc.createFromBacklog(dto);
  }

  @Get()
  @ApiQuery({ name: 'projectId', required: true })
  async findAll(@Query('projectId', ParseUUIDPipe) pid: string, @Query() pagination: PaginationQueryDto) {
    return this.svc.findAllByProject(pid, pagination);
  }

  @Get(':id')
  async findById(@Param('id', ParseUUIDPipe) id: string) {
    return this.svc.findById(id);
  }

  @Patch(':id')
  async update(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateTaskDto) {
    return this.svc.update(id, dto);
  }
}
