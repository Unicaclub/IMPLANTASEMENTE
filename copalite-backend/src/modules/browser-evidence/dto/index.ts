import { IsEnum, IsInt, IsOptional, IsString, IsUUID, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { EvidenceKind } from '../../../common/enums';

export class CreateBrowserEvidenceDto {
  @ApiProperty() @IsUUID() browserRunId: string;
  @ApiProperty() @IsInt() @Min(0) stepIndex: number;
  @ApiProperty({ enum: EvidenceKind }) @IsEnum(EvidenceKind) kind: EvidenceKind;
  @ApiPropertyOptional() @IsOptional() @IsString() route?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() action?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() artifactUrl?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() storageKey?: string;
  @ApiPropertyOptional() @IsOptional() metadataJson?: Record<string, unknown>;
}
