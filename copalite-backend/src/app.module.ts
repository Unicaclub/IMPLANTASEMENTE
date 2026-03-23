import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';

// Infrastructure
import { JwtAuthGuard } from './common/guards/jwt-auth.guard';
import { SharedModule } from './common/shared.module';
import { DatabaseModule } from './database/database.module';

// Modules - Phase 1: Base
import { AuthModule } from './modules/auth/auth.module';
import { ProjectsModule } from './modules/projects/projects.module';
import { UsersModule } from './modules/users/users.module';
import { WorkspacesModule } from './modules/workspaces/workspaces.module';

// Modules - Phase 2: Sources and Documentation
import { DecisionsModule } from './modules/decisions/decisions.module';
import { DocumentsModule } from './modules/documents/documents.module';
import { SourcesModule } from './modules/sources/sources.module';

// Modules - Phase 3: Execution Engine
import { AgentOutputsModule } from './modules/agent-outputs/agent-outputs.module';
import { AgentRunsModule } from './modules/agent-runs/agent-runs.module';
import { AgentsModule } from './modules/agents/agents.module';
import { PromptsModule } from './modules/prompts/prompts.module';
import { RunsModule } from './modules/runs/runs.module';

// Modules - Phase 4: Technical Registries
import { ApiRegistryModule } from './modules/api-registry/api-registry.module';
import { CodebaseMapModule } from './modules/codebase-map/codebase-map.module';
import { EvidenceRegistryModule } from './modules/evidence-registry/evidence-registry.module';
import { ModulesRegistryModule } from './modules/modules-registry/modules-registry.module';
import { RouteRegistryModule } from './modules/route-registry/route-registry.module';
import { SchemaRegistryModule } from './modules/schema-registry/schema-registry.module';
import { UiRegistryModule } from './modules/ui-registry/ui-registry.module';

// Modules - Phase 4b: Orchestration Engine & LLM
import { OrchestrationModule } from './modules/orchestration/orchestration.module';
import { LlmModule } from './modules/llm/llm.module';

// Modules - Phase 4c: LLM Integration
import { LlmModule } from './modules/llm/llm.module';

// Modules - Phase 4d: Dashboard
import { DashboardModule } from './modules/dashboard/dashboard.module';

// Modules - Phase 5: Comparison and Action
import { BacklogModule } from './modules/backlog/backlog.module';
import { ComparisonsModule } from './modules/comparisons/comparisons.module';
import { TasksModule } from './modules/tasks/tasks.module';

// Modules - Phase 6: Governance and Tracking
import { ActivityHistoryModule } from './modules/activity-history/activity-history.module';
import { AuditsModule } from './modules/audits/audits.module';
import { LogsModule } from './modules/logs/logs.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { ReportsModule } from './modules/reports/reports.module';
import { SystemHealthModule } from './modules/system-health/system-health.module';

@Module({
  imports: [
    // Config
    ConfigModule.forRoot({ isGlobal: true }),

    // Rate limiting
    ThrottlerModule.forRoot([
      {
        ttl: 60000, // 60 seconds
        limit: 100, // 100 requests per minute per IP
      },
    ]),

    // Database
    DatabaseModule,

    // Shared (guards, common providers)
    SharedModule,

    // Phase 1
    AuthModule,
    UsersModule,
    WorkspacesModule,
    ProjectsModule,

    // Phase 2
    SourcesModule,
    DocumentsModule,
    DecisionsModule,

    // Phase 3
    AgentsModule,
    PromptsModule,
    RunsModule,
    AgentRunsModule,
    AgentOutputsModule,

    // Phase 4
    ModulesRegistryModule,
    RouteRegistryModule,
    ApiRegistryModule,
    SchemaRegistryModule,
    UiRegistryModule,
    CodebaseMapModule,
    EvidenceRegistryModule,

    // Phase 4b
    OrchestrationModule,
    LlmModule,
    DashboardModule,

    // Phase 5
    ComparisonsModule,
    BacklogModule,
    TasksModule,

    // Phase 6
    AuditsModule,
    ReportsModule,
    LogsModule,
    NotificationsModule,
    SystemHealthModule,
    ActivityHistoryModule,
  ],
  providers: [
    // JWT guard global — all routes protected except @Public()
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
    // Rate limiting guard global
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
