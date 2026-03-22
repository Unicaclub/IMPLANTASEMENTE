import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';

// Infrastructure
import { DatabaseModule } from './database/database.module';
import { JwtAuthGuard } from './common/guards/jwt-auth.guard';
import { SharedModule } from './common/shared.module';

// Modules - Phase 1: Base
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { WorkspacesModule } from './modules/workspaces/workspaces.module';
import { ProjectsModule } from './modules/projects/projects.module';

// Modules - Phase 2: Sources and Documentation
import { SourcesModule } from './modules/sources/sources.module';
import { DocumentsModule } from './modules/documents/documents.module';
import { DecisionsModule } from './modules/decisions/decisions.module';

// Modules - Phase 3: Execution Engine
import { AgentsModule } from './modules/agents/agents.module';
import { PromptsModule } from './modules/prompts/prompts.module';
import { RunsModule } from './modules/runs/runs.module';
import { AgentRunsModule } from './modules/agent-runs/agent-runs.module';
import { AgentOutputsModule } from './modules/agent-outputs/agent-outputs.module';

// Modules - Phase 4: Technical Registries
import { ModulesRegistryModule } from './modules/modules-registry/modules-registry.module';
import { RouteRegistryModule } from './modules/route-registry/route-registry.module';
import { ApiRegistryModule } from './modules/api-registry/api-registry.module';
import { SchemaRegistryModule } from './modules/schema-registry/schema-registry.module';
import { UiRegistryModule } from './modules/ui-registry/ui-registry.module';
import { CodebaseMapModule } from './modules/codebase-map/codebase-map.module';
import { EvidenceRegistryModule } from './modules/evidence-registry/evidence-registry.module';

// Modules - Phase 4b: Orchestration Engine
import { OrchestrationModule } from './modules/orchestration/orchestration.module';

// Modules - Phase 4c: Dashboard
import { DashboardModule } from './modules/dashboard/dashboard.module';

// Modules - Phase 5: Comparison and Action
import { ComparisonsModule } from './modules/comparisons/comparisons.module';
import { BacklogModule } from './modules/backlog/backlog.module';
import { TasksModule } from './modules/tasks/tasks.module';

// Modules - Phase 6: Governance and Tracking
import { AuditsModule } from './modules/audits/audits.module';
import { ReportsModule } from './modules/reports/reports.module';
import { LogsModule } from './modules/logs/logs.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { SystemHealthModule } from './modules/system-health/system-health.module';
import { ActivityHistoryModule } from './modules/activity-history/activity-history.module';

@Module({
  imports: [
    // Config
    ConfigModule.forRoot({ isGlobal: true }),

    // Rate limiting
    ThrottlerModule.forRoot([{
      ttl: 60000,   // 60 seconds
      limit: 100,   // 100 requests per minute per IP
    }]),

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
