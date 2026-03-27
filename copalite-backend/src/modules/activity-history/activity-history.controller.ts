import { Body, Controller, Get, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiQuery, ApiTags } from '@nestjs/swagger';
import { ProjectAccessGuard } from '../../common/guards/project-access.guard';
import { ActivityHistoryService } from './activity-history.service';
import { CreateActivityDto } from './dto';
@ApiTags('Activity History') @ApiBearerAuth() @UseGuards(ProjectAccessGuard) @Controller('activity-history')
export class ActivityHistoryController {
  constructor(private readonly svc: ActivityHistoryService) {}
  @Post() async create(@Body() dto: CreateActivityDto) { return this.svc.create(dto); }
  @Get() @ApiQuery({ name: 'workspaceId', required: false }) @ApiQuery({ name: 'projectId', required: false })
  async find(@Query('workspaceId') wid?: string, @Query('projectId') pid?: string) {
    if (pid) return this.svc.findByProject(pid);
    if (wid) return this.svc.findByWorkspace(wid);
    return [];
  }
}
