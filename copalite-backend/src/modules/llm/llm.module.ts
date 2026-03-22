import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

// Entities needed for agent execution
import { AgentEntity } from '../agents/entities/agent.entity';
import { AgentRunEntity } from '../agent-runs/entities/agent-run.entity';
import { AgentOutputEntity } from '../agent-outputs/entities/agent-output.entity';
import { LogEntity } from '../logs/entities/log.entity';
import { PromptEntity } from '../prompts/entities/prompt.entity';
import { RunEntity } from '../runs/entities/run.entity';
import { RunStepEntity } from '../runs/entities/run-step.entity';

// LLM Providers
import { AnthropicProvider } from './providers/anthropic.provider';
import { OpenaiProvider } from './providers/openai.provider';
import { GoogleProvider } from './providers/google.provider';
import { OllamaProvider } from './providers/ollama.provider';

// Factory & Execution
import { LlmProviderFactory } from './llm-provider.factory';
import { AgentExecutionService } from './agent-execution.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      AgentEntity,
      AgentRunEntity,
      AgentOutputEntity,
      LogEntity,
      PromptEntity,
      RunEntity,
      RunStepEntity,
    ]),
  ],
  providers: [
    AnthropicProvider,
    OpenaiProvider,
    GoogleProvider,
    OllamaProvider,
    LlmProviderFactory,
    AgentExecutionService,
  ],
  exports: [AgentExecutionService, LlmProviderFactory],
})
export class LlmModule {}
