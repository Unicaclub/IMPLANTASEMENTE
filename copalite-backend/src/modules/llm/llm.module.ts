import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

// Entities needed for agent execution
import { AgentOutputEntity } from '../agent-outputs/entities/agent-output.entity';
import { AgentRunEntity } from '../agent-runs/entities/agent-run.entity';
import { AgentEntity } from '../agents/entities/agent.entity';
import { LogEntity } from '../logs/entities/log.entity';
import { PromptEntity } from '../prompts/entities/prompt.entity';
import { RunStepEntity } from '../runs/entities/run-step.entity';
import { RunEntity } from '../runs/entities/run.entity';

// Registry entities for population
import { ApiRegistryEntity } from '../api-registry/entities/api-registry.entity';
import { EvidenceRegistryEntity } from '../evidence-registry/entities/evidence-registry.entity';
import { ModuleRegistryEntity } from '../modules-registry/entities/module-registry.entity';
import { RouteRegistryEntity } from '../route-registry/entities/route-registry.entity';
import { SchemaFieldEntity } from '../schema-registry/entities/schema-field.entity';
import { SchemaRegistryEntity } from '../schema-registry/entities/schema-registry.entity';
import { UiRegistryEntity } from '../ui-registry/entities/ui-registry.entity';

// Source entity for ingestion
import { SourceEntity } from '../sources/entities/source.entity';

// LLM Providers
import { AnthropicProvider } from './providers/anthropic.provider';
import { GoogleProvider } from './providers/google.provider';
import { OllamaProvider } from './providers/ollama.provider';
import { OpenaiProvider } from './providers/openai.provider';

// Factory & Execution
import { AgentExecutionService } from './agent-execution.service';
import { ComparisonEngineService } from './comparison-engine.service';
import { LlmProviderFactory } from './llm-provider.factory';
import { OutputParserService } from './output-parser.service';
import { PipelineHandlerService } from './pipeline-handler.service';
import { RegistryPopulationService } from './registry-population.service';
import { SourceIngestionService } from './source-ingestion.service';

// Dependent modules
import { ComparisonsModule } from '../comparisons/comparisons.module';

// Action entities for pipeline handler
import { AuditEntity } from '../audits/entities/audit.entity';
import { ReportEntity } from '../reports/entities/report.entity';
import { BacklogItemEntity } from '../backlog/entities/backlog-item.entity';

@Module({
  imports: [
    ComparisonsModule,
    TypeOrmModule.forFeature([
      AgentEntity,
      AgentRunEntity,
      AgentOutputEntity,
      LogEntity,
      PromptEntity,
      RunEntity,
      RunStepEntity,
      // Registry entities
      ApiRegistryEntity,
      EvidenceRegistryEntity,
      ModuleRegistryEntity,
      RouteRegistryEntity,
      SchemaFieldEntity,
      SchemaRegistryEntity,
      UiRegistryEntity,
      // Source entity
      SourceEntity,
      // Action entities
      AuditEntity,
      ReportEntity,
      BacklogItemEntity,
    ]),
  ],
  providers: [
    AnthropicProvider,
    OpenaiProvider,
    GoogleProvider,
    OllamaProvider,
    LlmProviderFactory,
    AgentExecutionService,
    ComparisonEngineService,
    OutputParserService,
    PipelineHandlerService,
    RegistryPopulationService,
    SourceIngestionService,
  ],
  exports: [
    AgentExecutionService,
    ComparisonEngineService,
    LlmProviderFactory,
    OutputParserService,
    PipelineHandlerService,
    RegistryPopulationService,
    SourceIngestionService,
  ],
})
export class LlmModule {}
