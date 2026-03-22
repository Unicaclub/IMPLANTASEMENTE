import { IsEnum, IsOptional, IsString, IsUUID, Length } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { UiStateType, ConfidenceStatus, StatusBase } from '../../../common/enums';

export class CreateUiRegistryDto {
  @ApiProperty() @IsUUID() projectId: string;
  @ApiPropertyOptional() @IsOptional() @IsUUID() runId?: string;
  @ApiPropertyOptional() @IsOptional() @IsUUID() sourceId?: string;
  @ApiProperty() @IsString() @Length(1, 180) screenName: string;
  @ApiPropertyOptional() @IsOptional() @IsString() routePath?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() @Length(1, 180) componentName?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() description?: string;
  @ApiPropertyOptional({ enum: UiStateType }) @IsOptional() @IsEnum(UiStateType) stateType?: UiStateType;
}
export class UpdateUiRegistryDto {
  @ApiPropertyOptional() @IsOptional() @IsString() description?: string;
  @ApiPropertyOptional({ enum: StatusBase }) @IsOptional() @IsEnum(StatusBase) status?: StatusBase;
  @ApiPropertyOptional({ enum: ConfidenceStatus }) @IsOptional() @IsEnum(ConfidenceStatus) confidenceStatus?: ConfidenceStatus;
}
export class CreateUiActionDto {
  @ApiProperty() @IsString() @Length(1, 180) actionName: string;
  @ApiProperty() @IsString() @Length(1, 100) actionType: string;
  @ApiPropertyOptional() @IsOptional() @IsUUID() targetRouteId?: string;
  @ApiPropertyOptional() @IsOptional() @IsUUID() targetApiId?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() description?: string;
}
