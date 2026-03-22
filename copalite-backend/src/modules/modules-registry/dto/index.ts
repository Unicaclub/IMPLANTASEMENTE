import { IsEnum, IsOptional, IsString, IsUUID, Length, Matches } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { LayerType, StatusBase, ConfidenceStatus } from '../../../common/enums';

export class CreateModuleRegistryDto {
  @ApiProperty() @IsUUID() projectId: string;
  @ApiPropertyOptional() @IsOptional() @IsUUID() runId?: string;
  @ApiPropertyOptional() @IsOptional() @IsUUID() sourceId?: string;
  @ApiProperty() @IsString() @Length(3, 180) name: string;
  @ApiProperty() @IsString() @Length(3, 200) @Matches(/^[a-z0-9-]+$/) slug: string;
  @ApiProperty({ enum: LayerType }) @IsEnum(LayerType) layerType: LayerType;
  @ApiPropertyOptional() @IsOptional() @IsString() description?: string;
}

export class UpdateModuleRegistryDto {
  @ApiPropertyOptional() @IsOptional() @IsString() @Length(3, 180) name?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() description?: string;
  @ApiPropertyOptional({ enum: StatusBase }) @IsOptional() @IsEnum(StatusBase) status?: StatusBase;
  @ApiPropertyOptional({ enum: ConfidenceStatus }) @IsOptional() @IsEnum(ConfidenceStatus) confidenceStatus?: ConfidenceStatus;
}
