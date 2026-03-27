import { IsEnum, IsOptional, IsString, IsUUID, Length, MaxLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ComparisonType, ComparisonResultStatus, SeverityLevel } from '../../../common/enums';

export class CreateComparisonDto {
  @ApiProperty() @IsUUID() projectId: string;
  @ApiProperty() @IsUUID() runId: string;
  @ApiProperty({ enum: ComparisonType }) @IsEnum(ComparisonType) comparisonType: ComparisonType;
  @ApiProperty() @IsString() @MaxLength(100) sourceAType: string;
  @ApiProperty() @IsString() @MaxLength(2000) sourceARef: string;
  @ApiProperty() @IsString() @MaxLength(100) sourceBType: string;
  @ApiProperty() @IsString() @MaxLength(2000) sourceBRef: string;
  @ApiProperty({ enum: ComparisonResultStatus }) @IsEnum(ComparisonResultStatus) resultStatus: ComparisonResultStatus;
  @ApiProperty() @IsString() @MaxLength(2000) summary: string;
}
export class CreateDiffDto {
  @ApiProperty() @IsString() @MaxLength(100) diffType: string;
  @ApiProperty() @IsString() @Length(3, 220) title: string;
  @ApiProperty() @IsString() @MaxLength(2000) description: string;
  @ApiPropertyOptional({ enum: SeverityLevel }) @IsOptional() @IsEnum(SeverityLevel) severity?: SeverityLevel;
}
