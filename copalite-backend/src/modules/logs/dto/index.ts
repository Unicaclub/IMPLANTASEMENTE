import { IsEnum, IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { LogLevel } from '../../../common/enums';
export class CreateLogDto {
  @ApiPropertyOptional() @IsOptional() @IsUUID() projectId?: string;
  @ApiPropertyOptional() @IsOptional() @IsUUID() runId?: string;
  @ApiPropertyOptional() @IsOptional() @IsUUID() agentRunId?: string;
  @ApiProperty({ enum: LogLevel }) @IsEnum(LogLevel) logLevel: LogLevel;
  @ApiProperty() @IsString() @MaxLength(2000) message: string;
  @ApiPropertyOptional() @IsOptional() contextJson?: Record<string, any>;
}
