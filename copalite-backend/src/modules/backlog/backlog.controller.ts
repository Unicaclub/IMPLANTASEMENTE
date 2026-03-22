import { Body, Controller, Get, Param, ParseUUIDPipe, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiQuery, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { ProjectAccessGuard } from '../../common/guards/project-access.guard';
import { PaginationQueryDto } from '../../common/pipes/pagination';
import { BacklogService } from './backlog.service';
import { ApproveBacklogItemDto, CreateBacklogItemDto, UpdateBacklogItemDto } from './dto';

@ApiTags('Backlog') @ApiBearerAuth() @UseGuards(ProjectAccessGuard)
@Controller('backlog')
export class BacklogController {
  constructor(private readonly svc: BacklogService) {}
  @Post() async create(@Body() dto: CreateBacklogItemDto) { return this.svc.create(dto); }
  @Get() @ApiQuery({ name: 'projectId', required: true }) async findAll(@Query('projectId', ParseUUIDPipe) pid: string, @Query() pagination: PaginationQueryDto) { return this.svc.findAllByProject(pid, pagination); }
  @Get(':id') async findById(@Param('id', ParseUUIDPipe) id: string) { return this.svc.findById(id); }
  @Patch(':id') async update(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateBacklogItemDto) { return this.svc.update(id, dto); }
  @Patch(':id/approve') async approve(@Param('id', ParseUUIDPipe) id: string, @Body() dto: ApproveBacklogItemDto, @CurrentUser('id') userId: string) {
    return this.svc.approveForTask(id, dto, userId);
  }
}
