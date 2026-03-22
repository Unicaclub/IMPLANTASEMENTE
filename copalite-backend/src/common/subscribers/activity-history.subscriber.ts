import {
  DataSource,
  EntitySubscriberInterface,
  EventSubscriber,
  InsertEvent,
  UpdateEvent,
} from 'typeorm';
import { Logger } from '@nestjs/common';

import { ActivityHistoryEntity } from '../../modules/activity-history/entities/activity-history.entity';
import { WorkspaceEntity } from '../../modules/workspaces/entities/workspace.entity';
import { ProjectEntity } from '../../modules/projects/entities/project.entity';
import { RunEntity } from '../../modules/runs/entities/run.entity';
import { BacklogItemEntity } from '../../modules/backlog/entities/backlog-item.entity';
import { TaskEntity } from '../../modules/tasks/entities/task.entity';

/**
 * Map of tracked entity constructors to their activity_history entity_type label.
 */
const TRACKED_ENTITIES = new Map<Function, string>([
  [WorkspaceEntity, 'workspace'],
  [ProjectEntity, 'project'],
  [RunEntity, 'run'],
  [BacklogItemEntity, 'backlog_item'],
  [TaskEntity, 'task'],
]);

/**
 * Derives a human-readable label from the entity_type string.
 * e.g. 'backlog_item' -> 'Backlog item'
 */
function entityLabel(entityType: string): string {
  const raw = entityType.replace(/_/g, ' ');
  return raw.charAt(0).toUpperCase() + raw.slice(1);
}

@EventSubscriber()
export class ActivityHistorySubscriber implements EntitySubscriberInterface {
  private readonly logger = new Logger(ActivityHistorySubscriber.name);

  /**
   * Checks whether the entity that triggered the event is one we track.
   * Returns the entityType string if tracked, or null otherwise.
   */
  private getEntityType(target: Function | undefined): string | null {
    if (!target) return null;
    return TRACKED_ENTITIES.get(target) ?? null;
  }

  // ---------------------------------------------------------------
  // afterInsert
  // ---------------------------------------------------------------
  async afterInsert(event: InsertEvent<any>): Promise<void> {
    try {
      const entityType = this.getEntityType(event.metadata?.target as Function);
      if (!entityType) return;

      const entity = event.entity;
      if (!entity?.id) return;

      const { workspaceId, projectId } = await this.resolveContext(
        entityType,
        entity,
        event.connection,
      );

      // workspaceId is NOT NULL in the table — skip if we cannot resolve it
      if (!workspaceId) {
        this.logger.warn(
          `Cannot resolve workspaceId for ${entityType}:${entity.id} — skipping activity_history insert`,
        );
        return;
      }

      const description = `${entityLabel(entityType)} created`;

      await event.connection.getRepository(ActivityHistoryEntity).insert({
        workspaceId,
        projectId,
        userId: null,
        agentId: null,
        actionType: 'created',
        entityType,
        entityId: entity.id,
        description,
      });
    } catch (error) {
      // Subscriber must be silent — never propagate
      this.logger.error(
        `Failed to record activity_history on insert: ${(error as Error).message}`,
        (error as Error).stack,
      );
    }
  }

  // ---------------------------------------------------------------
  // afterUpdate
  // ---------------------------------------------------------------
  async afterUpdate(event: UpdateEvent<any>): Promise<void> {
    try {
      const entityType = this.getEntityType(event.metadata?.target as Function);
      if (!entityType) return;

      const entity = event.entity as Record<string, any> | undefined;
      // For update events, entity may be undefined when using QueryBuilder
      const entityId = entity?.id ?? (event.databaseEntity as any)?.id;
      if (!entityId) return;

      const source = entity ?? event.databaseEntity;

      const { workspaceId, projectId } = await this.resolveContext(
        entityType,
        source,
        event.connection,
      );

      if (!workspaceId) {
        this.logger.warn(
          `Cannot resolve workspaceId for ${entityType}:${entityId} — skipping activity_history update`,
        );
        return;
      }

      const description = `${entityLabel(entityType)} updated`;

      await event.connection.getRepository(ActivityHistoryEntity).insert({
        workspaceId,
        projectId,
        userId: null,
        agentId: null,
        actionType: 'updated',
        entityType,
        entityId,
        description,
      });
    } catch (error) {
      this.logger.error(
        `Failed to record activity_history on update: ${(error as Error).message}`,
        (error as Error).stack,
      );
    }
  }

  // ---------------------------------------------------------------
  // Context resolution helpers
  // ---------------------------------------------------------------

  /**
   * Resolves workspaceId and projectId for the given entity.
   *
   * - WorkspaceEntity:   workspaceId = entity.id,        projectId = null
   * - ProjectEntity:     workspaceId = entity.workspaceId, projectId = entity.id
   * - Run/Backlog/Task:  workspaceId via Project lookup,  projectId = entity.projectId
   */
  private async resolveContext(
    entityType: string,
    entity: Record<string, any>,
    dataSource: DataSource,
  ): Promise<{ workspaceId: string | null; projectId: string | null }> {
    switch (entityType) {
      case 'workspace':
        return { workspaceId: entity.id, projectId: null };

      case 'project':
        return {
          workspaceId: entity.workspaceId ?? null,
          projectId: entity.id,
        };

      case 'run':
      case 'backlog_item':
      case 'task': {
        const projectId: string | null = entity.projectId ?? null;
        if (!projectId) return { workspaceId: null, projectId: null };

        const workspaceId = await this.resolveWorkspaceFromProject(
          projectId,
          dataSource,
        );
        return { workspaceId, projectId };
      }

      default:
        return { workspaceId: null, projectId: null };
    }
  }

  /**
   * Fetches the workspaceId for a given projectId.
   * Uses a lightweight select to avoid loading the full entity.
   */
  private async resolveWorkspaceFromProject(
    projectId: string,
    dataSource: DataSource,
  ): Promise<string | null> {
    const row = await dataSource
      .getRepository(ProjectEntity)
      .findOne({
        where: { id: projectId },
        select: ['workspaceId'],
      });

    return row?.workspaceId ?? null;
  }
}
