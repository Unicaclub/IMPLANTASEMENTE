import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { AgentEntity } from '../agents/entities/agent.entity';
import { RunEntity } from '../runs/entities/run.entity';
import { RunStepEntity } from '../runs/entities/run-step.entity';
import { AgentRunEntity } from '../agent-runs/entities/agent-run.entity';
import { PromptEntity } from '../prompts/entities/prompt.entity';
import { StatusBase } from '../../common/enums';
import { LlmMessage } from './interfaces';

// Registry entities for report generator context
import { ModuleRegistryEntity } from '../modules-registry/entities/module-registry.entity';
import { ApiRegistryEntity } from '../api-registry/entities/api-registry.entity';
import { SchemaRegistryEntity } from '../schema-registry/entities/schema-registry.entity';
import { UiRegistryEntity } from '../ui-registry/entities/ui-registry.entity';
import { EvidenceRegistryEntity } from '../evidence-registry/entities/evidence-registry.entity';

@Injectable()
export class PromptBuilderService {
  private readonly logger = new Logger(PromptBuilderService.name);

  constructor(
    @InjectRepository(PromptEntity)
    private readonly promptRepo: Repository<PromptEntity>,
    @InjectRepository(ModuleRegistryEntity)
    private readonly moduleRepo: Repository<ModuleRegistryEntity>,
    @InjectRepository(ApiRegistryEntity)
    private readonly apiRepo: Repository<ApiRegistryEntity>,
    @InjectRepository(SchemaRegistryEntity)
    private readonly schemaRepo: Repository<SchemaRegistryEntity>,
    @InjectRepository(UiRegistryEntity)
    private readonly uiRepo: Repository<UiRegistryEntity>,
    @InjectRepository(EvidenceRegistryEntity)
    private readonly evidenceRepo: Repository<EvidenceRegistryEntity>,
  ) {}

  /**
   * Build the complete message array for an agent execution.
   */
  async buildMessages(
    agent: AgentEntity,
    run: RunEntity,
    step: RunStepEntity | null,
    agentRun: AgentRunEntity,
    sourceContext: string,
  ): Promise<LlmMessage[]> {
    const messages: LlmMessage[] = [];

    // System prompt
    const systemPrompt = await this.resolveSystemPrompt(agent);
    messages.push({ role: 'system', content: systemPrompt });

    // User prompt — context-aware per agent type
    const userContent = await this.buildUserPrompt(agent, run, step, agentRun, sourceContext);
    messages.push({ role: 'user', content: userContent });

    return messages;
  }

  private async resolveSystemPrompt(agent: AgentEntity): Promise<string> {
    // Prefer agent.systemPrompt, then prompts table, then default
    if (agent.systemPrompt) return agent.systemPrompt;

    const prompt = await this.promptRepo.findOne({
      where: { agentId: agent.id, status: StatusBase.ACTIVE },
      order: { version: 'DESC' },
    });
    if (prompt?.contentMarkdown) return prompt.contentMarkdown;

    return [
      `You are the ${agent.name} agent in the Copalite platform.`,
      `Your agent type is: ${agent.agentType}.`,
      agent.description ? `Your role: ${agent.description}` : '',
      '',
      'Follow these rules:',
      '1. Analyze the provided context carefully.',
      '2. Execute your specific role within the pipeline.',
      '3. Return ONLY valid JSON as specified.',
      '4. Be precise, technical, and actionable.',
    ].filter(Boolean).join('\n');
  }

  private async buildUserPrompt(
    agent: AgentEntity,
    run: RunEntity,
    step: RunStepEntity | null,
    agentRun: AgentRunEntity,
    sourceContext: string,
  ): Promise<string> {
    const sections: string[] = [];

    // Common header
    sections.push('## Task Context');
    sections.push(`- **Run Type**: ${run.runType}`);
    sections.push(`- **Run Goal**: ${run.goal}`);
    if (step) {
      sections.push(`- **Current Step**: Step ${step.stepOrder} — ${step.stepName}`);
      sections.push(`- **Step Type**: ${step.stepType}`);
    }
    sections.push('');

    // Agent-specific instructions
    const agentInstructions = await this.getAgentSpecificInstructions(
      agent.agentType,
      run.projectId,
      sourceContext,
    );
    sections.push(agentInstructions);

    // Source context (if not already included by agent-specific handler)
    if (sourceContext && !agentInstructions.includes('Project Structure')) {
      sections.push(sourceContext);
    }

    sections.push('');
    sections.push('Return ONLY valid JSON in the format specified in your system prompt.');
    sections.push('Focus on REAL data found in the code, not theoretical examples.');

    return sections.join('\n');
  }

  private async getAgentSpecificInstructions(
    agentType: string,
    projectId: string,
    sourceContext: string,
  ): Promise<string> {
    switch (agentType) {
      case 'orchestrator':
        return this.buildOrchestratorPrompt(sourceContext);
      case 'architect':
        return this.buildArchitectPrompt(sourceContext);
      case 'schema_mapper':
        return this.buildSchemaMapperPrompt(sourceContext);
      case 'api_analyzer':
        return this.buildApiAnalyzerPrompt(sourceContext);
      case 'ui_inspector':
        return this.buildUiInspectorPrompt(sourceContext);
      case 'code_auditor':
        return this.buildCodeAuditorPrompt(sourceContext);
      case 'evidence_collector':
        return this.buildEvidenceCollectorPrompt(sourceContext);
      case 'comparator':
        return this.buildComparatorPrompt(sourceContext);
      case 'report_generator':
        return await this.buildReportGeneratorPrompt(projectId, sourceContext);
      default:
        return sourceContext;
    }
  }

  private buildOrchestratorPrompt(sourceContext: string): string {
    return [
      '## Instructions',
      'Analyze this project and generate a discovery plan.',
      'Identify the key technologies, estimate the number of modules,',
      'and list potential risks for the discovery process.',
      '',
      sourceContext,
    ].join('\n');
  }

  private buildArchitectPrompt(sourceContext: string): string {
    return [
      '## Instructions',
      'Analyze the project architecture and map ALL modules, layers, and dependencies.',
      '',
      'Focus on:',
      '- Directory structure and module organization',
      '- Layer separation (frontend/backend/database/infrastructure)',
      '- Entry points and main configuration files',
      '- Dependencies between modules',
      '- Design patterns used',
      '',
      sourceContext,
    ].join('\n');
  }

  private buildSchemaMapperPrompt(sourceContext: string): string {
    return [
      '## Instructions',
      'Analyze the database schema of this project.',
      '',
      'Look for:',
      '- Migration files (SQL, TypeORM, Prisma, Django, etc.)',
      '- Entity/Model definitions (ORM classes)',
      '- SQL schema files',
      '- Database configuration',
      '',
      'Map EVERY table with its fields, types, primary keys, and foreign keys.',
      'Only include tables/schemas that actually exist in the code.',
      '',
      sourceContext,
    ].join('\n');
  }

  private buildApiAnalyzerPrompt(sourceContext: string): string {
    return [
      '## Instructions',
      'Map ALL API endpoints in this project.',
      '',
      'Look for:',
      '- Controller files with route decorators (@Get, @Post, etc.)',
      '- Express/Fastify/Django/Flask route definitions',
      '- OpenAPI/Swagger specs',
      '- Middleware and guards',
      '',
      'For each endpoint, identify: method, path, description, auth requirements.',
      'Only include endpoints that actually exist in the code.',
      '',
      sourceContext,
    ].join('\n');
  }

  private buildUiInspectorPrompt(sourceContext: string): string {
    return [
      '## Instructions',
      'Map ALL UI screens, pages, and components.',
      '',
      'Look for:',
      '- Page files (Next.js pages, React Router, Vue Router)',
      '- Component files with forms, tables, dashboards',
      '- Navigation/routing configuration',
      '- State management (Redux, Zustand, etc.)',
      '',
      'For each screen: name, route, description, state type, key components.',
      'Only include screens that actually exist in the code.',
      '',
      sourceContext,
    ].join('\n');
  }

  private buildCodeAuditorPrompt(sourceContext: string): string {
    return [
      '## Instructions',
      'Audit this codebase for quality issues.',
      '',
      'Check for:',
      '- Security vulnerabilities (SQL injection, XSS, hardcoded secrets)',
      '- Performance issues (N+1 queries, missing indexes)',
      '- Code complexity and maintainability',
      '- Missing error handling',
      '- Deprecated dependencies',
      '',
      'Report findings with severity, file, and recommendation.',
      '',
      sourceContext,
    ].join('\n');
  }

  private buildEvidenceCollectorPrompt(sourceContext: string): string {
    return [
      '## Instructions',
      'Collect technical evidence from this codebase.',
      '',
      'Extract:',
      '- Configuration patterns (env vars, config files)',
      '- Logging patterns',
      '- Testing patterns',
      '- Documentation found',
      '- Notable code snippets that reveal architecture decisions',
      '',
      sourceContext,
    ].join('\n');
  }

  private buildComparatorPrompt(sourceContext: string): string {
    return [
      '## Instructions',
      'Compare the current state against expectations.',
      '',
      sourceContext,
    ].join('\n');
  }

  private async buildReportGeneratorPrompt(projectId: string, sourceContext: string): Promise<string> {
    // Fetch current registry counts for the report
    try {
      const [modules, apis, schemas, uiScreens, evidence] = await Promise.all([
        this.moduleRepo.count({ where: { projectId } }),
        this.apiRepo.count({ where: { projectId } }),
        this.schemaRepo.count({ where: { projectId } }),
        this.uiRepo.count({ where: { projectId } }),
        this.evidenceRepo.count({ where: { projectId } }),
      ]);

      return [
        '## Instructions',
        'Generate an executive discovery report based on all findings.',
        '',
        '### Current Registry Data',
        `- Modules discovered: ${modules}`,
        `- APIs discovered: ${apis}`,
        `- Database schemas discovered: ${schemas}`,
        `- UI screens discovered: ${uiScreens}`,
        `- Evidence collected: ${evidence}`,
        '',
        'Synthesize all findings into a coherent report with:',
        '- Executive summary',
        '- Key findings per area',
        '- Overall metrics',
        '- Prioritized recommendations',
        '',
        sourceContext,
      ].join('\n');
    } catch {
      return sourceContext;
    }
  }
}
