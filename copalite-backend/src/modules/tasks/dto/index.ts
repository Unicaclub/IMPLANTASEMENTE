import { IsEnum, IsIn, IsOptional, IsString, IsUUID, Length, MaxLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { TASK_TYPES, TaskStatus } from '../../../common/enums';

export class CreateTaskDto {
  @ApiProperty() @IsUUID() projectId: string;
  @ApiPropertyOptional() @IsOptional() @IsUUID() backlogItemId?: string;
  @ApiProperty() @IsString() @Length(3, 220) title: string;
  @ApiProperty() @IsString() @MaxLength(2000) description: string;
  @ApiProperty({ enum: TASK_TYPES }) @IsIn(TASK_TYPES) taskType: string;
  @ApiPropertyOptional() @IsOptional() @IsUUID() assignedUserId?: string;
  @ApiPropertyOptional() @IsOptional() @IsUUID() assignedAgentId?: string;
  @ApiPropertyOptional() @IsOptional() dueAt?: Date;
}
export class CreateTaskFromBacklogDto {
  @ApiProperty() @IsUUID() backlogItemId: string;
  @ApiPropertyOptional() @IsOptional() @IsUUID() assignedUserId?: string;
  @ApiPropertyOptional() @IsOptional() @IsUUID() assignedAgentId?: string;
  @ApiPropertyOptional() @IsOptional() dueAt?: Date;
}
export class UpdateTaskDto {
  @ApiPropertyOptional() @IsOptional() @IsString() @Length(3, 220) title?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() description?: string;
  @ApiPropertyOptional({ enum: TaskStatus }) @IsOptional() @IsEnum(TaskStatus) status?: TaskStatus;
  @ApiPropertyOptional() @IsOptional() @IsUUID() assignedUserId?: string;
  @ApiPropertyOptional() @IsOptional() @IsUUID() assignedAgentId?: string;
}
