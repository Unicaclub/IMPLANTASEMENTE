import { IsEnum, IsOptional, IsString, IsUUID, Length } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ComparisonType, ComparisonResultStatus, SeverityLevel } from '../../../common/enums';

export class CreateComparisonDto {
  @ApiProperty() @IsUUID() projectId: string;
  @ApiProperty() @IsUUID() runId: string;
  @ApiProperty({ enum: ComparisonType }) @IsEnum(ComparisonType) comparisonType: ComparisonType;
  @ApiProperty() @IsString() sourceAType: string;
  @ApiProperty() @IsString() sourceARef: string;
  @ApiProperty() @IsString() sourceBType: string;
  @ApiProperty() @IsString() sourceBRef: string;
  @ApiProperty({ enum: ComparisonResultStatus }) @IsEnum(ComparisonResultStatus) resultStatus: ComparisonResultStatus;
  @ApiProperty() @IsString() summary: string;
}
export class CreateDiffDto {
  @ApiProperty() @IsString() diffType: string;
  @ApiProperty() @IsString() @Length(3, 220) title: string;
  @ApiProperty() @IsString() description: string;
  @ApiPropertyOptional({ enum: SeverityLevel }) @IsOptional() @IsEnum(SeverityLevel) severity?: SeverityLevel;
}
