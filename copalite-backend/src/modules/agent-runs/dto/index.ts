import { IsEnum, IsOptional, IsString, IsUUID } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { RunStatus, ConfidenceStatus } from '../../../common/enums';

export class CreateAgentRunDto {
  @ApiProperty() @IsUUID() runId: string;
  @ApiProperty() @IsUUID() agentId: string;
  @ApiPropertyOptional() @IsOptional() @IsUUID() promptId?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() inputSummary?: string;
}

export class UpdateAgentRunStatusDto {
  @ApiProperty({ enum: RunStatus }) @IsEnum(RunStatus) status: RunStatus;
  @ApiPropertyOptional() @IsOptional() @IsString() outputSummary?: string;
  @ApiPropertyOptional({ enum: ConfidenceStatus }) @IsOptional() @IsEnum(ConfidenceStatus) confidenceLevel?: ConfidenceStatus;
}
