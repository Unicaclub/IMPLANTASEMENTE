import { Controller, Get, Param, ParseUUIDPipe, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { ProjectAccessGuard } from '../../common/guards/project-access.guard';
import { DashboardService } from './dashboard.service';

@ApiTags('Dashboard')
@ApiBearerAuth()
@UseGuards(ProjectAccessGuard)
@Controller('dashboard')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('project/:projectId')
  @ApiOperation({ summary: 'Get complete project dashboard with all metrics' })
  async getProjectDashboard(@Param('projectId', ParseUUIDPipe) projectId: string) {
    return this.dashboardService.getProjectDashboard(projectId);
  }

  @Get('project/:projectId/export')
  @ApiOperation({ summary: 'Export full project report with all registries and metrics' })
  async exportReport(@Param('projectId', ParseUUIDPipe) projectId: string) {
    return this.dashboardService.exportReport(projectId);
  }
}
