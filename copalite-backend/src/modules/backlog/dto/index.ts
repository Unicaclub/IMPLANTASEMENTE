import { IsBoolean, IsEnum, IsInt, IsOptional, IsString, IsUUID, Length, MaxLength, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { BacklogType, BacklogPriority, BacklogStatus } from '../../../common/enums';

export class CreateBacklogItemDto {
  @ApiProperty() @IsUUID() projectId: string;
  @ApiPropertyOptional() @IsOptional() @IsUUID() runId?: string;
  @ApiProperty() @IsString() @MaxLength(100) sourceType: string;
  @ApiPropertyOptional() @IsOptional() @IsString() sourceRef?: string;
  @ApiProperty() @IsString() @Length(3, 220) title: string;
  @ApiProperty() @IsString() @MaxLength(2000) description: string;
  @ApiProperty({ enum: BacklogType }) @IsEnum(BacklogType) backlogType: BacklogType;
  @ApiPropertyOptional({ enum: BacklogPriority }) @IsOptional() @IsEnum(BacklogPriority) priority?: BacklogPriority;
  @ApiPropertyOptional() @IsOptional() @IsUUID() assignedAgentId?: string;
  @ApiPropertyOptional() @IsOptional() @IsInt() @Min(0) evidenceCount?: number;
}
export class UpdateBacklogItemDto {
  @ApiPropertyOptional() @IsOptional() @IsString() @Length(3, 220) title?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() description?: string;
  @ApiPropertyOptional({ enum: BacklogPriority }) @IsOptional() @IsEnum(BacklogPriority) priority?: BacklogPriority;
  @ApiPropertyOptional({ enum: BacklogStatus }) @IsOptional() @IsEnum(BacklogStatus) status?: BacklogStatus;
}
export class ApproveBacklogItemDto {
  @ApiProperty() @IsBoolean() approvedForTask: boolean;
}
