import { IsEnum, IsIn, IsOptional, IsString, IsUrl, IsUUID, Length, MaxLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { SYSTEM_TYPES, TargetStatus } from '../../../common/enums';

export class CreateTargetDto {
  @ApiProperty() @IsUUID() projectId: string;
  @ApiProperty() @IsString() @Length(3, 180) name: string;
  @ApiProperty() @IsString() @MaxLength(2000) baseUrl: string;
  @ApiPropertyOptional() @IsOptional() @IsString() environment?: string;
  @ApiPropertyOptional() @IsOptional() @IsIn(SYSTEM_TYPES) systemType?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() authMode?: string;
  @ApiPropertyOptional() @IsOptional() credentialsJson?: Record<string, unknown>;
  @ApiPropertyOptional() @IsOptional() @IsString() notes?: string;
}

export class UpdateTargetDto {
  @ApiPropertyOptional() @IsOptional() @IsString() @Length(3, 180) name?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() baseUrl?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() environment?: string;
  @ApiPropertyOptional() @IsOptional() @IsIn(SYSTEM_TYPES) systemType?: string;
  @ApiPropertyOptional() @IsOptional() @IsEnum(TargetStatus) status?: TargetStatus;
  @ApiPropertyOptional() @IsOptional() @IsString() authMode?: string;
  @ApiPropertyOptional() @IsOptional() credentialsJson?: Record<string, unknown>;
  @ApiPropertyOptional() @IsOptional() @IsString() notes?: string;
}
