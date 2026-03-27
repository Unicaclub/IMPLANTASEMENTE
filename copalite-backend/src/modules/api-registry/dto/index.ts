import { IsBoolean, IsEnum, IsOptional, IsString, IsUUID, Length, MaxLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ConfidenceStatus, StatusBase } from '../../../common/enums';

export class CreateApiRegistryDto {
  @ApiProperty() @IsUUID() projectId: string;
  @ApiPropertyOptional() @IsOptional() @IsUUID() runId?: string;
  @ApiPropertyOptional() @IsOptional() @IsUUID() moduleId?: string;
  @ApiPropertyOptional() @IsOptional() @IsUUID() routeId?: string;
  @ApiPropertyOptional() @IsOptional() @IsUUID() sourceId?: string;
  @ApiProperty() @IsString() @Length(3, 180) name: string;
  @ApiProperty() @IsString() @MaxLength(100) httpMethod: string;
  @ApiProperty() @IsString() @MaxLength(2000) path: string;
  @ApiPropertyOptional() @IsOptional() @IsBoolean() authRequired?: boolean;
  @ApiPropertyOptional() @IsOptional() requestSchemaJson?: Record<string, any>;
  @ApiPropertyOptional() @IsOptional() responseSchemaJson?: Record<string, any>;
  @ApiPropertyOptional() @IsOptional() @IsString() description?: string;
}

export class UpdateApiRegistryDto {
  @ApiPropertyOptional() @IsOptional() @IsString() description?: string;
  @ApiPropertyOptional({ enum: StatusBase }) @IsOptional() @IsEnum(StatusBase) status?: StatusBase;
  @ApiPropertyOptional({ enum: ConfidenceStatus }) @IsOptional() @IsEnum(ConfidenceStatus) confidenceStatus?: ConfidenceStatus;
}
