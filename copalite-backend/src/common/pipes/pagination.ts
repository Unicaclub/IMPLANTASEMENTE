import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsOptional, IsString, IsUUID, Max, Min } from 'class-validator';

export class PaginationQueryDto {
  @ApiPropertyOptional({ default: 1, minimum: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ default: 20, minimum: 1, maximum: 100 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 20;

  @ApiPropertyOptional({ description: 'Sort field', example: 'createdAt' })
  @IsOptional()
  @IsString()
  sortBy?: string = 'createdAt';

  @ApiPropertyOptional({ description: 'Sort direction', enum: ['ASC', 'DESC'], default: 'DESC' })
  @IsOptional()
  @IsString()
  sortOrder?: 'ASC' | 'DESC' = 'DESC';
}

export class ProjectPaginationQueryDto extends PaginationQueryDto {
  @ApiProperty({ description: 'Project ID (UUID)' })
  @IsUUID()
  projectId: string;
}

export class WorkspacePaginationQueryDto extends PaginationQueryDto {
  @ApiProperty({ description: 'Workspace ID (UUID)' })
  @IsUUID()
  workspaceId: string;
}

export class LogsPaginationQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({ description: 'Project ID (UUID)' })
  @IsOptional()
  @IsUUID()
  projectId?: string;

  @ApiPropertyOptional({ description: 'Run ID (UUID)' })
  @IsOptional()
  @IsUUID()
  runId?: string;
}

export class PaginatedResponseDto<T> {
  data: T[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  };

  constructor(data: T[], total: number, page: number, limit: number) {
    const totalPages = Math.ceil(total / limit);
    this.data = data;
    this.meta = {
      total,
      page,
      limit,
      totalPages,
      hasNextPage: page < totalPages,
      hasPreviousPage: page > 1,
    };
  }
}

/**
 * Helper to apply pagination to a TypeORM query builder or find options
 */
export function getPaginationSkipTake(query: PaginationQueryDto): {
  skip: number;
  take: number;
} {
  const page = query.page || 1;
  const limit = query.limit || 20;
  return {
    skip: (page - 1) * limit,
    take: limit,
  };
}
