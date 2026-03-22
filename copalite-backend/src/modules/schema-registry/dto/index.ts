import { IsBoolean, IsEnum, IsOptional, IsString, IsUUID, Length } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ConfidenceStatus, StatusBase } from '../../../common/enums';

export class CreateSchemaRegistryDto {
  @ApiProperty() @IsUUID() projectId: string;
  @ApiPropertyOptional() @IsOptional() @IsUUID() runId?: string;
  @ApiPropertyOptional() @IsOptional() @IsUUID() sourceId?: string;
  @ApiProperty() @IsString() @Length(1, 180) entityName: string;
  @ApiPropertyOptional() @IsOptional() @IsString() @Length(1, 180) tableName?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() description?: string;
}
export class UpdateSchemaRegistryDto {
  @ApiPropertyOptional() @IsOptional() @IsString() description?: string;
  @ApiPropertyOptional({ enum: StatusBase }) @IsOptional() @IsEnum(StatusBase) status?: StatusBase;
  @ApiPropertyOptional({ enum: ConfidenceStatus }) @IsOptional() @IsEnum(ConfidenceStatus) confidenceStatus?: ConfidenceStatus;
}
export class CreateSchemaFieldDto {
  @ApiProperty() @IsString() @Length(1, 180) fieldName: string;
  @ApiProperty() @IsString() @Length(1, 80) dataType: string;
  @ApiPropertyOptional() @IsOptional() @IsBoolean() isNullable?: boolean;
  @ApiPropertyOptional() @IsOptional() @IsBoolean() isPrimary?: boolean;
  @ApiPropertyOptional() @IsOptional() @IsBoolean() isUnique?: boolean;
  @ApiPropertyOptional() @IsOptional() @IsString() defaultValue?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() description?: string;
}
