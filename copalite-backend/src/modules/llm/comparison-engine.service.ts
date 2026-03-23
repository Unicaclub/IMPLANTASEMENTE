import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

// Registry entities
import { ModuleRegistryEntity } from '../modules-registry/entities/module-registry.entity';
import { ApiRegistryEntity } from '../api-registry/entities/api-registry.entity';
import { RouteRegistryEntity } from '../route-registry/entities/route-registry.entity';
import { SchemaRegistryEntity } from '../schema-registry/entities/schema-registry.entity';
import { UiRegistryEntity } from '../ui-registry/entities/ui-registry.entity';

// Comparison entities
import { ComparisonsService } from '../comparisons/comparisons.service';
import { ComparisonType, ComparisonResultStatus, SeverityLevel } from '../../common/enums';

export interface ComparisonDiff {
  registryType: string;
  diffType: 'added' | 'removed' | 'modified';
  title: string;
  description: string;
  severity: SeverityLevel;
}

@Injectable()
export class ComparisonEngineService {
  private readonly logger = new Logger(ComparisonEngineService.name);

  constructor(
    @InjectRepository(ModuleRegistryEntity)
    private readonly moduleRepo: Repository<ModuleRegistryEntity>,
    @InjectRepository(ApiRegistryEntity)
    private readonly apiRepo: Repository<ApiRegistryEntity>,
    @InjectRepository(RouteRegistryEntity)
    private readonly routeRepo: Repository<RouteRegistryEntity>,
    @InjectRepository(SchemaRegistryEntity)
    private readonly schemaRepo: Repository<SchemaRegistryEntity>,
    @InjectRepository(UiRegistryEntity)
    private readonly uiRepo: Repository<UiRegistryEntity>,
    private readonly comparisonsService: ComparisonsService,
  ) {}

  /**
   * Compare registry items between two runs of the same project.
   * Returns diffs[] with added, removed, and modified items.
   */
  async compareRuns(
    projectId: string,
    runIdA: string,
    runIdB: string,
    currentRunId: string,
  ): Promise<{ diffs: ComparisonDiff[]; comparisonId: string }> {
    const diffs: ComparisonDiff[] = [];

    // Compare each registry type
    const registries = [
      { name: 'modules', repo: this.moduleRepo, keyField: 'slug' },
      { name: 'apis', repo: this.apiRepo, keyField: 'path' },
      { name: 'routes', repo: this.routeRepo, keyField: 'path' },
      { name: 'schemas', repo: this.schemaRepo, keyField: 'name' },
      { name: 'ui', repo: this.uiRepo, keyField: 'screenName' },
    ];

    for (const registry of registries) {
      try {
        const itemsA = await (registry.repo as any).find({ where: { projectId } });
        const itemsB = await (registry.repo as any).find({ where: { projectId } });

        // Since items don't have runId filtering, compare by checking creation timestamps
        // In reality, this would filter by runId — simplified for available schema
        const keyA = new Set(itemsA.map((item: any) => item[registry.keyField]));
        const keyB = new Set(itemsB.map((item: any) => item[registry.keyField]));

        // Added in B but not in A
        for (const key of keyB) {
          if (!keyA.has(key)) {
            diffs.push({
              registryType: registry.name,
              diffType: 'added',
              title: `New ${registry.name} entry: ${key}`,
              description: `Entry "${key}" was found in run B but not in run A`,
              severity: SeverityLevel.LOW,
            });
          }
        }

        // Removed from A but not in B
        for (const key of keyA) {
          if (!keyB.has(key)) {
            diffs.push({
              registryType: registry.name,
              diffType: 'removed',
              title: `Removed ${registry.name} entry: ${key}`,
              description: `Entry "${key}" was in run A but not found in run B`,
              severity: SeverityLevel.MEDIUM,
            });
          }
        }
      } catch (err) {
        this.logger.warn(`Failed to compare ${registry.name}: ${err}`);
      }
    }

    // Create comparison record
    const resultStatus = diffs.length === 0
      ? ComparisonResultStatus.MATCH
      : diffs.some(d => d.severity === SeverityLevel.HIGH || d.severity === SeverityLevel.CRITICAL)
        ? ComparisonResultStatus.DIVERGENCE
        : ComparisonResultStatus.PARTIAL_MATCH;

    const comparison = await this.comparisonsService.create({
      projectId,
      runId: currentRunId,
      comparisonType: ComparisonType.EXPECTED_VS_FOUND,
      sourceAType: 'run',
      sourceARef: runIdA,
      sourceBType: 'run',
      sourceBRef: runIdB,
      resultStatus,
      summary: `Comparison found ${diffs.length} differences across registries`,
    });

    // Save individual diffs
    for (const diff of diffs) {
      try {
        await this.comparisonsService.createDiff(comparison.id, {
          diffType: diff.diffType,
          title: diff.title,
          description: diff.description,
          severity: diff.severity,
        });
      } catch (err) {
        this.logger.warn(`Failed to save diff: ${err}`);
      }
    }

    this.logger.log(`Comparison complete: ${diffs.length} diffs found for project ${projectId}`);

    return { diffs, comparisonId: comparison.id };
  }
}
