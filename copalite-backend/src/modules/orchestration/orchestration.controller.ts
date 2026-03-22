import { Body, Controller, Get, Param, ParseUUIDPipe, Patch, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { ProjectAccessGuard } from '../../common/guards/project-access.guard';
import { OrchestrationService } from './orchestration.service';
import { StartPipelineDto, AdvanceStepDto } from './dto';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('Orchestration')
@ApiBearerAuth()
@UseGuards(ProjectAccessGuard)
@Controller('orchestration')
export class OrchestrationController {
  constructor(private readonly orchestrationService: OrchestrationService) {}

  @Post('start')
  @ApiOperation({ summary: 'Start a new pipeline execution' })
  async startPipeline(
    @Body() dto: StartPipelineDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.orchestrationService.startPipeline(dto, userId);
  }

  @Patch(':runId/advance')
  @ApiOperation({ summary: 'Complete current step and advance to next' })
  async advanceStep(
    @Param('runId', ParseUUIDPipe) runId: string,
    @Body() dto: AdvanceStepDto,
  ) {
    return this.orchestrationService.advanceStep(runId, dto);
  }

  @Get(':runId/status')
  @ApiOperation({ summary: 'Get full pipeline status with progress' })
  async getPipelineStatus(@Param('runId', ParseUUIDPipe) runId: string) {
    return this.orchestrationService.getPipelineStatus(runId);
  }

  @Patch(':runId/cancel')
  @ApiOperation({ summary: 'Cancel a running pipeline' })
  async cancelPipeline(@Param('runId', ParseUUIDPipe) runId: string) {
    return this.orchestrationService.cancelPipeline(runId);
  }

  @Patch(':runId/retry')
  @ApiOperation({ summary: 'Retry the last failed step' })
  async retryFailedStep(@Param('runId', ParseUUIDPipe) runId: string) {
    return this.orchestrationService.retryFailedStep(runId);
  }

  @Get('pipelines')
  @ApiOperation({ summary: 'List all available pipeline configurations' })
  getAvailablePipelines() {
    return this.orchestrationService.getAvailablePipelines();
  }
}
