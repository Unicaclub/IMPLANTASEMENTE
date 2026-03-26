import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { ProjectPaginationQueryDto } from '../../common/pipes/pagination';
import { CreateTaskDto, CreateTaskFromBacklogDto, UpdateTaskDto } from './dto';
import { TasksService } from './tasks.service';

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
  async findAll(@Query() query: ProjectPaginationQueryDto) {
    return this.svc.findAllByProject(query.projectId, query);
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
