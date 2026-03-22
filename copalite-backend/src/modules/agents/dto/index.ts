import { IsEnum, IsInt, IsObject, IsOptional, IsString, Length, Matches } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { AgentType, StatusBase } from '../../../common/enums';

export class CreateAgentDto {
  @ApiProperty() @IsString() @Length(3, 160) name: string;
  @ApiProperty() @IsString() @Length(3, 180) @Matches(/^[a-z0-9-]+$/) slug: string;
  @ApiProperty({ enum: AgentType }) @IsEnum(AgentType) agentType: AgentType;
  @ApiPropertyOptional() @IsOptional() @IsString() description?: string;
  @ApiPropertyOptional() @IsOptional() @IsInt() executionOrder?: number;
  @ApiPropertyOptional() @IsOptional() @IsObject() config?: Record<string, unknown>;
}

export class UpdateAgentDto {
  @ApiPropertyOptional() @IsOptional() @IsString() @Length(3, 160) name?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() description?: string;
  @ApiPropertyOptional({ enum: StatusBase }) @IsOptional() @IsEnum(StatusBase) status?: StatusBase;
  @ApiPropertyOptional() @IsOptional() @IsInt() executionOrder?: number;
  @ApiPropertyOptional() @IsOptional() @IsObject() config?: Record<string, unknown>;
}
