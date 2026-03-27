import { IsBoolean, IsEnum, IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { RunType } from '../../../common/enums';

export class StartPipelineDto {
  @ApiProperty() @IsUUID() projectId: string;
  @ApiPropertyOptional() @IsOptional() @IsUUID() sourceId?: string;
  @ApiProperty({ enum: RunType }) @IsEnum(RunType) runType: RunType;
  @ApiProperty({ example: 'Discovery inicial do ERP' }) @IsString() @MaxLength(2000) title: string;
  @ApiProperty({ example: 'Mapear módulos, APIs e schema' }) @IsString() @MaxLength(2000) goal: string;
  @ApiPropertyOptional() @IsOptional() @IsString() scopeText?: string;
  @ApiPropertyOptional({ default: false }) @IsOptional() @IsBoolean() dryRun?: boolean;
}

export class AdvanceStepDto {
  @ApiProperty({ description: 'Output summary from the agent execution' })
  @IsString() @MaxLength(2000) outputSummary: string;

  @ApiPropertyOptional({ description: 'Structured data from agent' })
  @IsOptional() structuredData?: Record<string, any>;

  @ApiPropertyOptional({ default: true })
  @IsOptional() @IsBoolean() success?: boolean;

  @ApiPropertyOptional()
  @IsOptional() @IsString() errorMessage?: string;
}
