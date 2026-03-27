import { IsEnum, IsOptional, IsString, IsUUID, Length, MaxLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { EvidenceType, ConfidenceStatus } from '../../../common/enums';

export class CreateEvidenceDto {
  @ApiProperty() @IsUUID() projectId: string;
  @ApiProperty() @IsUUID() runId: string;
  @ApiPropertyOptional() @IsOptional() @IsUUID() sourceId?: string;
  @ApiProperty({ enum: EvidenceType }) @IsEnum(EvidenceType) evidenceType: EvidenceType;
  @ApiProperty() @IsString() @Length(3, 220) title: string;
  @ApiProperty() @IsString() @MaxLength(50000) contentExcerpt: string;
  @ApiPropertyOptional() @IsOptional() @IsString() referencePath?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() referenceUrl?: string;
  @ApiProperty() @IsString() @Length(1, 80) relatedEntityType: string;
  @ApiProperty() @IsUUID() relatedEntityId: string;
  @ApiPropertyOptional({ enum: ConfidenceStatus }) @IsOptional() @IsEnum(ConfidenceStatus) confidenceStatus?: ConfidenceStatus;
}
