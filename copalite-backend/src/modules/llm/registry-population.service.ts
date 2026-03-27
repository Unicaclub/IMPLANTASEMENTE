import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { ApiRegistryEntity } from '../api-registry/entities/api-registry.entity';
import { EvidenceRegistryEntity } from '../evidence-registry/entities/evidence-registry.entity';
import { LogEntity } from '../logs/entities/log.entity';
import { ModuleRegistryEntity } from '../modules-registry/entities/module-registry.entity';
import { RouteRegistryEntity } from '../route-registry/entities/route-registry.entity';
import { SchemaFieldEntity } from '../schema-registry/entities/schema-field.entity';
import { SchemaRegistryEntity } from '../schema-registry/entities/schema-registry.entity';
import { UiRegistryEntity } from '../ui-registry/entities/ui-registry.entity';

import {
  AgentType,
  ConfidenceStatus,
  EvidenceType,
  LayerType,
  LogLevel,
  RouteType,
  StatusBase,
  UiStateType,
} from '../../common/enums';

/**
 * Context passed to the population methods.
 */
export interface PopulationContext {
  projectId: string;
  runId: string;
  agentRunId: string;
  agentType: AgentType;
}

/**
 * Takes parsed JSON from agent output and populates the correct registry tables.
 * All operations are wrapped in try/catch — a population failure never crashes the pipeline.
 */
@Injectable()
export class RegistryPopulationService {
  private readonly logger = new Logger(RegistryPopulationService.name);

  constructor(
    @InjectRepository(ModuleRegistryEntity)
    private readonly moduleRepo: Repository<ModuleRegistryEntity>,
    @InjectRepository(ApiRegistryEntity)
    private readonly apiRepo: Repository<ApiRegistryEntity>,
    @InjectRepository(SchemaRegistryEntity)
    private readonly schemaRepo: Repository<SchemaRegistryEntity>,
    @InjectRepository(SchemaFieldEntity)
    private readonly fieldRepo: Repository<SchemaFieldEntity>,
    @InjectRepository(RouteRegistryEntity)
    private readonly routeRepo: Repository<RouteRegistryEntity>,
    @InjectRepository(UiRegistryEntity)
    private readonly uiRepo: Repository<UiRegistryEntity>,
    @InjectRepository(EvidenceRegistryEntity)
    private readonly evidenceRepo: Repository<EvidenceRegistryEntity>,
    @InjectRepository(LogEntity)
    private readonly logRepo: Repository<LogEntity>,
  ) {}

  /**
   * Route parsed data to the correct population handler based on agent type.
   * Returns the number of registry entries created.
   */
  async populate(ctx: PopulationContext, parsedData: Record<string, unknown>): Promise<number> {
    try {
      switch (ctx.agentType) {
        case AgentType.ARCHITECT:
          return await this.populateModules(ctx, parsedData);
        case AgentType.SCHEMA_MAPPER:
          return await this.populateSchemas(ctx, parsedData);
        case AgentType.API_ANALYZER:
          return await this.populateApis(ctx, parsedData);
        case AgentType.UI_INSPECTOR:
          return await this.populateUi(ctx, parsedData);
        case AgentType.EVIDENCE_COLLECTOR:
          return await this.populateEvidence(ctx, parsedData);
        default:
          // Orchestrator, Code Auditor, Comparator, Report Generator don't populate registries
          return 0;
      }
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : String(error);
      this.logger.error(`Registry population failed for ${ctx.agentType}: ${msg}`);
      await this.log(ctx, LogLevel.ERROR, `Registry population failed: ${msg}`);
      return 0;
    }
  }

  // =============================================
  // Architect → modules_registry
  // =============================================
  private async populateModules(
    ctx: PopulationContext,
    data: Record<string, unknown>,
  ): Promise<number> {
    const modules = data['modules'] as Array<Record<string, unknown>> | undefined;
    if (!Array.isArray(modules)) return 0;

    let count = 0;
    for (const mod of modules) {
      try {
        const name = String(mod['name'] ?? '').substring(0, 180);
        if (!name) continue;

        const slug = name
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/(^-|-$)/g, '')
          .substring(0, 200);
        const layerType = this.resolveLayerType(String(mod['layerType'] ?? ''));

        // Extract files and dependencies arrays from LLM output
        const rawFiles = mod['files'];
        const files = Array.isArray(rawFiles)
          ? rawFiles.map((f: unknown) => String(f)).slice(0, 200)
          : [];
        const rawDeps = mod['dependencies'];
        const dependencies = Array.isArray(rawDeps)
          ? rawDeps.map((d: unknown) => String(d)).slice(0, 100)
          : [];

        const entity = this.moduleRepo.create({
          projectId: ctx.projectId,
          runId: ctx.runId,
          name,
          slug,
          layerType,
          description: mod['description'] ? String(mod['description']).substring(0, 5000) : null,
          files,
          dependencies,
          status: StatusBase.ACTIVE,
          confidenceStatus: this.resolveConfidence(String(mod['confidenceLevel'] ?? '')),
        });
        await this.moduleRepo.upsert(entity, ['projectId', 'slug']);
        count++;
      } catch (err) {
        this.logger.warn(`Failed to populate module entry: ${err}`);
      }
    }

    await this.log(ctx, LogLevel.INFO, `Populated ${count} module registry entries`);
    return count;
  }

  // =============================================
  // Schema Mapper → schema_registry + schema_fields
  // =============================================
  private async populateSchemas(
    ctx: PopulationContext,
    data: Record<string, unknown>,
  ): Promise<number> {
    const schemas = data['schemas'] as Array<Record<string, unknown>> | undefined;
    if (!Array.isArray(schemas)) return 0;

    let count = 0;
    for (const schema of schemas) {
      try {
        const tableName = String(schema['tableName'] ?? '').substring(0, 180);
        if (!tableName) continue;

        const entity = this.schemaRepo.create({
          projectId: ctx.projectId,
          runId: ctx.runId,
          entityName: tableName,
          tableName,
          description: schema['description']
            ? String(schema['description']).substring(0, 5000)
            : null,
          status: StatusBase.ACTIVE,
          confidenceStatus: ConfidenceStatus.INFERRED,
        });
        const saved = await this.schemaRepo.save(entity);
        count++;

        // Populate fields
        const fields = schema['fields'] as Array<Record<string, unknown>> | undefined;
        if (Array.isArray(fields)) {
          for (const field of fields) {
            try {
              const fieldEntity = this.fieldRepo.create({
                schemaRegistryId: saved.id,
                fieldName: String(field['name'] ?? '').substring(0, 180),
                dataType: String(field['dataType'] ?? 'unknown').substring(0, 80),
                isNullable: field['nullable'] === true,
                isPrimary: field['isPrimaryKey'] === true,
                isUnique: field['isPrimaryKey'] === true,
                description: field['referencesTable']
                  ? `FK → ${String(field['referencesTable'])}`
                  : null,
              });
              await this.fieldRepo.save(fieldEntity);
            } catch (fieldErr) {
              this.logger.warn(`Failed to populate schema field: ${fieldErr}`);
            }
          }
        }
      } catch (err) {
        this.logger.warn(`Failed to populate schema entry: ${err}`);
      }
    }

    await this.log(ctx, LogLevel.INFO, `Populated ${count} schema registry entries`);
    return count;
  }

  // =============================================
  // API Analyzer → api_registry + route_registry
  // =============================================
  private async populateApis(
    ctx: PopulationContext,
    data: Record<string, unknown>,
  ): Promise<number> {
    let count = 0;

    // Populate API entries
    const apis = data['apis'] as Array<Record<string, unknown>> | undefined;
    if (Array.isArray(apis)) {
      for (const api of apis) {
        try {
          const path = String(api['path'] ?? '');
          const method = String(api['method'] ?? api['httpMethod'] ?? 'GET').substring(0, 10);
          if (!path) continue;

          // Map requestBody / responseType from LLM output to schema JSON columns
          const requestBody = api['requestBody'] ?? api['requestSchema'] ?? null;
          const requestSchemaJson =
            requestBody != null
              ? typeof requestBody === 'object'
                ? (requestBody as Record<string, any>)
                : { raw: String(requestBody) }
              : null;

          const responseType = api['responseType'] ?? api['responseSchema'] ?? null;
          const responseSchemaJson =
            responseType != null
              ? typeof responseType === 'object'
                ? (responseType as Record<string, any>)
                : { type: String(responseType) }
              : null;

          const entity = this.apiRepo.create({
            projectId: ctx.projectId,
            runId: ctx.runId,
            name: (api['name'] ? String(api['name']) : `${method} ${path}`).substring(0, 180),
            httpMethod: method,
            path,
            authRequired: api['authRequired'] === true,
            requestSchemaJson,
            responseSchemaJson,
            description: api['description'] ? String(api['description']).substring(0, 5000) : null,
            status: StatusBase.ACTIVE,
            confidenceStatus: ConfidenceStatus.INFERRED,
          });
          await this.apiRepo.save(entity);
          count++;
        } catch (err) {
          this.logger.warn(`Failed to populate API entry: ${err}`);
        }
      }
    }

    // Populate route entries
    const routes = data['routes'] as Array<Record<string, unknown>> | undefined;
    if (Array.isArray(routes)) {
      for (const route of routes) {
        try {
          const path = String(route['path'] ?? '');
          if (!path) continue;

          const routeType = this.resolveRouteType(String(route['routeType'] ?? ''));

          const entity = this.routeRepo.create({
            projectId: ctx.projectId,
            runId: ctx.runId,
            routeType,
            path,
            method: route['method'] ? String(route['method']).substring(0, 10) : null,
            description: route['description']
              ? String(route['description']).substring(0, 5000)
              : route['controllerName']
                ? `Controller: ${String(route['controllerName'])}`
                : null,
            status: StatusBase.ACTIVE,
            confidenceStatus: ConfidenceStatus.INFERRED,
          });
          await this.routeRepo.save(entity);
          count++;
        } catch (err) {
          this.logger.warn(`Failed to populate route entry: ${err}`);
        }
      }
    }

    await this.log(ctx, LogLevel.INFO, `Populated ${count} API/route registry entries`);
    return count;
  }

  // =============================================
  // UI Inspector → ui_registry
  // =============================================
  private async populateUi(ctx: PopulationContext, data: Record<string, unknown>): Promise<number> {
    const screens = data['screens'] as Array<Record<string, unknown>> | undefined;
    if (!Array.isArray(screens)) return 0;

    let count = 0;
    for (const screen of screens) {
      try {
        const screenName = String(screen['screenName'] ?? screen['name'] ?? '').substring(0, 180);
        if (!screenName) continue;

        const entity = this.uiRepo.create({
          projectId: ctx.projectId,
          runId: ctx.runId,
          screenName,
          routePath: screen['routePath'] ?? screen['route'] ? String(screen['routePath'] ?? screen['route']) : null,
          description: screen['description']
            ? String(screen['description']).substring(0, 5000)
            : null,
          stateType: this.resolveUiStateType(String(screen['stateType'] ?? '')),
          status: StatusBase.ACTIVE,
          confidenceStatus: ConfidenceStatus.INFERRED,
        });
        await this.uiRepo.save(entity);
        count++;
      } catch (err) {
        this.logger.warn(`Failed to populate UI entry: ${err}`);
      }
    }

    await this.log(ctx, LogLevel.INFO, `Populated ${count} UI registry entries`);
    return count;
  }

  // =============================================
  // Evidence Collector → evidence_registry
  // =============================================
  private async populateEvidence(
    ctx: PopulationContext,
    data: Record<string, unknown>,
  ): Promise<number> {
    const evidence = data['evidence'] as Array<Record<string, unknown>> | undefined;
    if (!Array.isArray(evidence)) return 0;

    let count = 0;
    for (const ev of evidence) {
      try {
        const title = String(ev['title'] ?? '').substring(0, 220);
        if (!title) continue;

        const entity = this.evidenceRepo.create({
          projectId: ctx.projectId,
          runId: ctx.runId,
          evidenceType: this.resolveEvidenceType(String(ev['evidenceType'] ?? '')),
          title,
          contentExcerpt: String(ev['content'] ?? '').substring(0, 10000),
          referencePath: ev['sourceFile'] ? String(ev['sourceFile']) : null,
          relatedEntityType: ev['relatedModule'] ? 'module' : 'run',
          relatedEntityId: ctx.runId, // Default to run since we don't have entity IDs
          confidenceStatus: ConfidenceStatus.INFERRED,
        });
        await this.evidenceRepo.save(entity);
        count++;
      } catch (err) {
        this.logger.warn(`Failed to populate evidence entry: ${err}`);
      }
    }

    await this.log(ctx, LogLevel.INFO, `Populated ${count} evidence registry entries`);
    return count;
  }

  // =============================================
  // Enum resolution helpers
  // =============================================

  private resolveLayerType(value: string): LayerType {
    const map: Record<string, LayerType> = {
      frontend: LayerType.FRONTEND,
      backend: LayerType.BACKEND,
      database: LayerType.DATABASE,
      infrastructure: LayerType.INFRA,
      infra: LayerType.INFRA,
      shared: LayerType.CROSS_CUTTING,
      cross_cutting: LayerType.CROSS_CUTTING,
      docs: LayerType.DOCS,
    };
    return map[value.toLowerCase()] ?? LayerType.BACKEND;
  }

  private resolveRouteType(value: string): RouteType {
    const map: Record<string, RouteType> = {
      api: RouteType.BACKEND,
      backend: RouteType.BACKEND,
      page: RouteType.FRONTEND,
      frontend: RouteType.FRONTEND,
      webhook: RouteType.BACKEND,
      websocket: RouteType.INTERNAL_ACTION,
      internal_action: RouteType.INTERNAL_ACTION,
    };
    return map[value.toLowerCase()] ?? RouteType.BACKEND;
  }

  private resolveUiStateType(value: string): UiStateType | null {
    const map: Record<string, UiStateType> = {
      static: UiStateType.PAGE,
      page: UiStateType.PAGE,
      dynamic: UiStateType.DETAIL_VIEW,
      form: UiStateType.FORM,
      dashboard: UiStateType.DASHBOARD,
      table: UiStateType.TABLE,
      modal: UiStateType.MODAL,
      detail_view: UiStateType.DETAIL_VIEW,
    };
    return map[value.toLowerCase()] ?? null;
  }

  private resolveEvidenceType(value: string): EvidenceType {
    const map: Record<string, EvidenceType> = {
      code_snippet: EvidenceType.CODE_EXCERPT,
      code_excerpt: EvidenceType.CODE_EXCERPT,
      configuration: EvidenceType.CODE_EXCERPT,
      log_output: EvidenceType.MANUAL_NOTE,
      screenshot: EvidenceType.SCREENSHOT_NOTE,
      screenshot_note: EvidenceType.SCREENSHOT_NOTE,
      documentation: EvidenceType.DOCUMENT_EXCERPT,
      document_excerpt: EvidenceType.DOCUMENT_EXCERPT,
    };
    return map[value.toLowerCase()] ?? EvidenceType.MANUAL_NOTE;
  }

  private resolveConfidence(value: string): ConfidenceStatus {
    const map: Record<string, ConfidenceStatus> = {
      confirmed: ConfidenceStatus.CONFIRMED,
      inferred: ConfidenceStatus.INFERRED,
      unvalidated: ConfidenceStatus.UNVALIDATED,
    };
    return map[value.toLowerCase()] ?? ConfidenceStatus.INFERRED;
  }

  private async log(ctx: PopulationContext, level: LogLevel, message: string): Promise<void> {
    try {
      const log = this.logRepo.create({
        projectId: ctx.projectId,
        runId: ctx.runId,
        agentRunId: ctx.agentRunId,
        logLevel: level,
        message,
        contextJson: { source: 'registry-population', timestamp: new Date().toISOString() },
      });
      await this.logRepo.save(log);
    } catch (err) {
      this.logger.error(`Failed to save log: ${message}`, err);
    }
  }
}
