import { IsOptional, IsString, IsUUID, Length } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
export class CreateActivityDto {
  @ApiProperty() @IsUUID() workspaceId: string;
  @ApiPropertyOptional() @IsOptional() @IsUUID() projectId?: string;
  @ApiPropertyOptional() @IsOptional() @IsUUID() userId?: string;
  @ApiPropertyOptional() @IsOptional() @IsUUID() agentId?: string;
  @ApiProperty() @IsString() @Length(1, 80) actionType: string;
  @ApiProperty() @IsString() @Length(1, 80) entityType: string;
  @ApiProperty() @IsUUID() entityId: string;
  @ApiProperty() @IsString() description: string;
}
