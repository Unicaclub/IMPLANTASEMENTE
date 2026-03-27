import { IsEnum, IsInt, IsOptional, IsString, IsUUID, Length, MaxLength, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { RunType, RunStatus } from '../../../common/enums';

export class CreateRunDto {
  @ApiProperty() @IsUUID() projectId: string;
  @ApiPropertyOptional() @IsOptional() @IsUUID() sourceId?: string;
  @ApiProperty({ enum: RunType }) @IsEnum(RunType) runType: RunType;
  @ApiProperty() @IsString() @Length(3, 220) title: string;
  @ApiProperty() @IsString() @MaxLength(2000) goal: string;
  @ApiPropertyOptional() @IsOptional() @IsString() scopeText?: string;
}

export class UpdateRunStatusDto {
  @ApiProperty({ enum: RunStatus }) @IsEnum(RunStatus) status: RunStatus;
}

export class CreateRunStepDto {
  @ApiProperty() @IsInt() @Min(1) stepOrder: number;
  @ApiProperty() @IsString() @Length(3, 180) stepName: string;
  @ApiProperty() @IsString() @MaxLength(100) stepType: string;
  @ApiPropertyOptional() @IsOptional() @IsString() notes?: string;
}
