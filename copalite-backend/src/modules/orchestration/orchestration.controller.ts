import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { ProjectAccessGuard } from '../../common/guards/project-access.guard';
import { LlmProviderFactory } from '../llm/llm-provider.factory';
import { AdvanceStepDto, StartPipelineDto } from './dto';
import { OrchestrationService } from './orchestration.service';

@ApiTags('Orchestration')
@ApiBearerAuth()
@UseGuards(ProjectAccessGuard)
@Controller('orchestration')
export class OrchestrationController {
  constructor(
    private readonly orchestrationService: OrchestrationService,
    private readonly llmProviderFactory: LlmProviderFactory,
  ) {}

  @Post('start')
  @ApiOperation({ summary: 'Start a new pipeline execution' })
  async startPipeline(@Body() dto: StartPipelineDto, @CurrentUser('id') userId: string) {
    return this.orchestrationService.startPipeline(dto, userId);
  }

  @Patch(':runId/advance')
  @ApiOperation({ summary: 'Complete current step and advance to next' })
  async advanceStep(@Param('runId', ParseUUIDPipe) runId: string, @Body() dto: AdvanceStepDto) {
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

  @Get('providers')
  @ApiOperation({ summary: 'Check which LLM providers are configured and available' })
  getProviderStatus() {
    const available = this.llmProviderFactory.getAvailableProviders();
    return {
      available,
      canExecute: available.length > 0,
      message:
        available.length > 0
          ? `${available.length} LLM provider(s) configured: ${available.join(', ')}`
          : 'No LLM providers configured. Set OPENAI_API_KEY or ANTHROPIC_API_KEY in the .env file.',
    };
  }
}
