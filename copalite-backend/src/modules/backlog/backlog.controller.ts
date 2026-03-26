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
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { ProjectAccessGuard } from '../../common/guards/project-access.guard';
import { ProjectPaginationQueryDto } from '../../common/pipes/pagination';
import { BacklogService } from './backlog.service';
import { ApproveBacklogItemDto, CreateBacklogItemDto, UpdateBacklogItemDto } from './dto';

@ApiTags('Backlog')
@ApiBearerAuth()
@UseGuards(ProjectAccessGuard)
@Controller('backlog')
export class BacklogController {
  constructor(private readonly svc: BacklogService) {}

  @Post()
  async create(@Body() dto: CreateBacklogItemDto) {
    return this.svc.create(dto);
  }

  @Get()
  async findAll(@Query() query: ProjectPaginationQueryDto) {
    return this.svc.findAllByProject(query.projectId, query);
  }

  @Get('summary')
  @ApiQuery({ name: 'projectId', required: true })
  @ApiOperation({ summary: 'Resumo do backlog agrupado por status, prioridade e tipo' })
  async summary(@Query('projectId', ParseUUIDPipe) pid: string) {
    return this.svc.summary(pid);
  }

  @Get(':id')
  async findById(@Param('id', ParseUUIDPipe) id: string) {
    return this.svc.findById(id);
  }

  @Patch(':id')
  async update(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateBacklogItemDto) {
    return this.svc.update(id, dto);
  }

  @Delete(':id')
  async remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.svc.remove(id);
  }

  @Patch(':id/approve')
  async approve(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: ApproveBacklogItemDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.svc.approveForTask(id, dto, userId);
  }

  @Post('generate-from-run/:runId')
  @ApiOperation({
    summary: 'Gerar backlog automaticamente a partir dos diffs de uma run (idempotente)',
  })
  async generateFromRun(
    @Param('runId', ParseUUIDPipe) runId: string,
    @Query('projectId') projectId?: string,
  ) {
    return this.svc.generateFromRun(runId, projectId);
  }
}
