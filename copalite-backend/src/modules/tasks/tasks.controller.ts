import { Body, Controller, Delete, Get, Param, ParseUUIDPipe, Patch, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { TasksService } from './tasks.service';
import { CreateTaskDto, CreateTaskFromBacklogDto, UpdateTaskDto } from './dto';
import { PaginationQueryDto } from '../../common/pipes/pagination';

@ApiTags('Tasks')
@ApiBearerAuth()
@Controller('tasks')
export class TasksController {
  constructor(private readonly svc: TasksService) {}

  @Post()
  @ApiOperation({ summary: 'Criar task diretamente' })
  async create(@Body() dto: CreateTaskDto) {
    return this.svc.create(dto);
  }

  @Post('from-backlog')
  @ApiOperation({ summary: 'Criar task a partir de backlog aprovado (human gate)' })
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

  @Delete(':id')
  async remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.svc.remove(id);
  }
}
